/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import fs from "fs";
import path from "path";
import ts from "typescript";

const commonRoot = path.resolve(process.cwd(), "src/common");
const allowedExternalTargets = new Set([
    path.resolve(process.cwd(), "src/packageMetadata.ts"),
]);
const forbiddenAggregationFiles = new Set([
    "exports-browser-only.ts",
    "exports-common.ts",
    "exports-node-only.ts",
    "index-browser.ts",
    "index-node.ts",
]);

function getTypeScriptFiles(directory: string): string[] {
    return fs
        .readdirSync(directory, { withFileTypes: true })
        .flatMap((entry) => {
            const entryPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                return getTypeScriptFiles(entryPath);
            }

            return entry.name.endsWith(".ts") ? [entryPath] : [];
        });
}

function resolveTypeScriptImport(
    containingFile: string,
    specifier: string
): string {
    const resolvedPath = path.resolve(path.dirname(containingFile), specifier);
    return resolvedPath.endsWith(".js")
        ? resolvedPath.slice(0, -3) + ".ts"
        : resolvedPath;
}

function isWithin(directory: string, target: string): boolean {
    const relativePath = path.relative(directory, target);
    return (
        relativePath === "" ||
        (!relativePath.startsWith(`..${path.sep}`) &&
            relativePath !== ".." &&
            !path.isAbsolute(relativePath))
    );
}

describe("extracted common runtime boundary", () => {
    it("contains only resolvable static local imports", () => {
        const files = getTypeScriptFiles(commonRoot);
        const failures: string[] = [];

        files.forEach((file) => {
            const relativePath = path.relative(commonRoot, file);
            if (
                relativePath.split(path.sep).includes("browser") ||
                forbiddenAggregationFiles.has(path.basename(file))
            ) {
                failures.push(
                    `${relativePath}: forbidden browser or barrel file`
                );
            }

            const sourceText = fs.readFileSync(file, "utf8");
            if (sourceText.includes("@azure/msal-common")) {
                failures.push(`${relativePath}: imports @azure/msal-common`);
            }

            const sourceFile = ts.createSourceFile(
                file,
                sourceText,
                ts.ScriptTarget.Latest,
                true,
                ts.ScriptKind.TS
            );

            function inspectSpecifier(specifier: string): void {
                if (!specifier.startsWith(".")) {
                    failures.push(
                        `${relativePath}: external import ${specifier}`
                    );
                    return;
                }

                const target = resolveTypeScriptImport(file, specifier);
                if (!fs.existsSync(target)) {
                    failures.push(
                        `${relativePath}: unresolved import ${specifier}`
                    );
                    return;
                }

                if (
                    !isWithin(commonRoot, target) &&
                    !allowedExternalTargets.has(target)
                ) {
                    failures.push(
                        `${relativePath}: import escapes extracted runtime ${specifier}`
                    );
                }

                const targetRelativePath = path.relative(commonRoot, target);
                if (
                    targetRelativePath.split(path.sep).includes("browser") ||
                    forbiddenAggregationFiles.has(path.basename(target))
                ) {
                    failures.push(
                        `${relativePath}: forbidden browser or barrel import ${specifier}`
                    );
                }
            }

            function inspect(node: ts.Node): void {
                if (
                    (ts.isImportDeclaration(node) ||
                        ts.isExportDeclaration(node)) &&
                    node.moduleSpecifier &&
                    ts.isStringLiteral(node.moduleSpecifier)
                ) {
                    inspectSpecifier(node.moduleSpecifier.text);
                }

                if (
                    ts.isImportEqualsDeclaration(node) &&
                    ts.isExternalModuleReference(node.moduleReference) &&
                    node.moduleReference.expression &&
                    ts.isStringLiteral(node.moduleReference.expression)
                ) {
                    inspectSpecifier(node.moduleReference.expression.text);
                }

                if (
                    ts.isCallExpression(node) &&
                    (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
                        (ts.isIdentifier(node.expression) &&
                            node.expression.text === "require"))
                ) {
                    failures.push(
                        `${relativePath}: dynamic import or require is forbidden`
                    );
                }

                ts.forEachChild(node, inspect);
            }

            inspect(sourceFile);
        });

        expect(files.length).toBeGreaterThan(0);
        expect(failures).toEqual([]);
    });
});

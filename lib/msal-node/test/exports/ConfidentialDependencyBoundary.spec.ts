/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import fs from "fs";
import path from "path";
import ts from "typescript";

const SOURCE_ROOT = path.resolve(__dirname, "../../src");
const CONFIDENTIAL_ENTRY_POINT = path.join(
    SOURCE_ROOT,
    "confidential",
    "index.ts"
);
const REQUIRED_CONFIDENTIAL_MODULES = new Set(
    [
        "client/BaseClientApplication.ts",
        "client/ClientApplication.ts",
        "client/ConfidentialClientApplication.ts",
        "client/ClientCredentialClient.ts",
        "client/ManagedIdentityApplication.ts",
        "client/OnBehalfOfClient.ts",
        "client/UserFederatedIdentityCredentialClient.ts",
        "client/UsernamePasswordClient.ts",
        "request/AuthorizationCodeRequest.ts",
        "request/AuthorizationUrlRequest.ts",
        "request/ClientCredentialRequest.ts",
        "request/OnBehalfOfRequest.ts",
        "request/RefreshTokenRequest.ts",
        "request/SilentFlowRequest.ts",
        "request/UserFederatedIdentityCredentialRequest.ts",
        "request/UsernamePasswordRequest.ts",
    ].map((filePath) => path.normalize(filePath))
);
const PCA_ONLY_MODULES = new Set(
    [
        "client/PublicClientApplication.ts",
        "client/IPublicClientApplication.ts",
        "client/DeviceCodeClient.ts",
        "request/CommonDeviceCodeRequest.ts",
        "request/DeviceCodeRequest.ts",
        "request/InteractiveRequest.ts",
        "request/SignOutRequest.ts",
        "network/LoopbackClient.ts",
    ].map((filePath) => path.normalize(filePath))
);

function resolveSourceImport(
    containingFile: string,
    importPath: string
): string | undefined {
    if (!importPath.startsWith(".")) {
        return undefined;
    }

    const unresolvedPath = path.resolve(
        path.dirname(containingFile),
        importPath
    );
    const sourcePath = unresolvedPath.replace(/\.js$/, ".ts");
    if (fs.existsSync(sourcePath)) {
        return sourcePath;
    }

    const indexPath = path.join(unresolvedPath, "index.ts");
    if (fs.existsSync(indexPath)) {
        return indexPath;
    }

    throw new Error(
        `Unable to resolve ${importPath} from ${path.relative(
            SOURCE_ROOT,
            containingFile
        )}`
    );
}

function getSourceDependencies(filePath: string): string[] {
    const sourceText = fs.readFileSync(filePath, "utf8");
    return getImportPaths(sourceText)
        .map((importPath) => resolveSourceImport(filePath, importPath))
        .filter((dependency): dependency is string => !!dependency);
}

function getImportPaths(sourceText: string): string[] {
    return ts
        .preProcessFile(sourceText, true, true)
        .importedFiles.map((importedFile) => importedFile.fileName);
}

describe("@azure/msal-node/confidential dependency boundary", () => {
    it("recognizes supported static, type-only, and dynamic import forms", () => {
        const importPaths = getImportPaths(`
            import {
                FirstDependency
            } from "./multiline.js";
            export type { SecondDependency } from "./type-only.js";
            import("./dynamic.js");
        `);

        expect(importPaths).toEqual([
            "./multiline.js",
            "./type-only.js",
            "./dynamic.js",
        ]);
    });

    it("does not transitively import PCA-only modules", () => {
        const missingPcaModules = Array.from(PCA_ONLY_MODULES).filter(
            (filePath) => !fs.existsSync(path.join(SOURCE_ROOT, filePath))
        );
        const visited = new Set<string>();
        const pending = [CONFIDENTIAL_ENTRY_POINT];
        const violations: string[] = [];

        expect(missingPcaModules).toEqual([]);

        while (pending.length) {
            const currentFile = pending.pop() as string;
            if (visited.has(currentFile)) {
                continue;
            }
            visited.add(currentFile);

            for (const dependency of getSourceDependencies(currentFile)) {
                const relativeDependency = path.normalize(
                    path.relative(SOURCE_ROOT, dependency)
                );
                if (PCA_ONLY_MODULES.has(relativeDependency)) {
                    violations.push(
                        `${path.relative(
                            SOURCE_ROOT,
                            currentFile
                        )} imports ${relativeDependency}`
                    );
                }
                pending.push(dependency);
            }
        }

        const reachableModules = new Set(
            Array.from(visited).map((filePath) =>
                path.normalize(path.relative(SOURCE_ROOT, filePath))
            )
        );
        const missingConfidentialModules = Array.from(
            REQUIRED_CONFIDENTIAL_MODULES
        ).filter((filePath) => !reachableModules.has(filePath));

        expect(missingConfidentialModules.sort()).toEqual([]);
        expect(violations.sort()).toEqual([]);
    });
});

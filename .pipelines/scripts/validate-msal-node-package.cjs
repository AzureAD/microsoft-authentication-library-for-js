/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createRequire } = require("module");

const repositoryRoot = path.resolve(__dirname, "../..");
const packageRoot = path.join(repositoryRoot, "lib", "msal-node");
const sourceManifest = JSON.parse(
    fs.readFileSync(path.join(packageRoot, "package.json"), "utf8")
);

function runNode(args, cwd) {
    execFileSync(process.execPath, args, {
        cwd,
        env: { ...process.env, NODE_PATH: "" },
        stdio: "inherit",
    });
}

function runNpm(args, cwd) {
    const npmCli =
        process.env.npm_execpath ||
        (process.platform === "win32"
            ? path.join(
                  path.dirname(process.execPath),
                  "node_modules",
                  "npm",
                  "bin",
                  "npm-cli.js"
              )
            : undefined);

    if (npmCli) {
        if (!fs.existsSync(npmCli)) {
            throw new Error(`npm CLI not found at ${npmCli}`);
        }
        runNode([npmCli, ...args], cwd);
        return;
    }

    execFileSync("npm", args, {
        cwd,
        env: { ...process.env, NODE_PATH: "" },
        stdio: "inherit",
    });
}

function isWithin(parent, child) {
    const relativePath = path.relative(parent, child);
    return (
        relativePath !== "" &&
        relativePath !== ".." &&
        !relativePath.startsWith(`..${path.sep}`) &&
        !path.isAbsolute(relativePath)
    );
}

function findFiles(root, extensions) {
    return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
        const entryPath = path.join(root, entry.name);
        if (entry.isDirectory()) {
            return findFiles(entryPath, extensions);
        }
        return extensions.some((extension) => entry.name.endsWith(extension))
            ? [entryPath]
            : [];
    });
}

const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "msal-node-package-contract-")
);
const packDirectory = path.join(tempRoot, "pack");
const projectRoot = path.join(tempRoot, "consumer");

try {
    if (isWithin(repositoryRoot, projectRoot)) {
        throw new Error("Package consumer must be outside the repository");
    }

    fs.mkdirSync(packDirectory);
    fs.mkdirSync(projectRoot);
    fs.writeFileSync(
        path.join(projectRoot, "package.json"),
        JSON.stringify({ private: true, type: "module" }, null, 2)
    );

    runNpm(
        [
            "pack",
            "--ignore-scripts",
            "--loglevel=error",
            "--pack-destination",
            packDirectory,
        ],
        packageRoot
    );

    const tarballs = fs
        .readdirSync(packDirectory)
        .filter((file) => file.endsWith(".tgz"));
    if (tarballs.length !== 1) {
        throw new Error(
            `Expected one MSAL Node tarball, found ${tarballs.length}`
        );
    }

    runNpm(
        [
            "install",
            "--ignore-scripts",
            "--loglevel=error",
            "--no-audit",
            "--no-fund",
            "--package-lock=false",
            "--registry=https://registry.npmjs.org/",
            path.join(packDirectory, tarballs[0]),
            `typescript@${sourceManifest.devDependencies.typescript}`,
            `@types/node@${sourceManifest.devDependencies["@types/node"]}`,
        ],
        projectRoot
    );

    const requireFromProject = createRequire(
        path.join(projectRoot, "package.json")
    );
    const manifestPath = fs.realpathSync(
        requireFromProject.resolve("@azure/msal-node/package.json")
    );
    const installedPackageRoot = path.dirname(manifestPath);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

    if (!isWithin(projectRoot, installedPackageRoot)) {
        throw new Error(
            `MSAL Node resolved outside the isolated project: ${installedPackageRoot}`
        );
    }

    for (const entrypoint of [
        manifest.main,
        manifest.module,
        manifest.types,
        manifest.exports?.["."]?.import?.types,
        manifest.exports?.["."]?.require?.types,
    ]) {
        if (
            typeof entrypoint !== "string" ||
            !fs.existsSync(path.join(installedPackageRoot, entrypoint))
        ) {
            throw new Error(`Packed entrypoint is missing: ${entrypoint}`);
        }
    }
    const declarationManifest = JSON.parse(
        fs.readFileSync(
            path.join(installedPackageRoot, "types", "package.json"),
            "utf8"
        )
    );
    if (declarationManifest.type !== "commonjs") {
        throw new Error(
            "Packed CommonJS declaration graph is missing its module scope"
        );
    }

    const requireFromPackage = createRequire(manifestPath);
    for (const dependency of Object.keys(manifest.dependencies || {})) {
        requireFromPackage.resolve(dependency);
    }
    try {
        requireFromProject.resolve("@azure/msal-common");
        throw new Error(
            "@azure/msal-common unexpectedly resolves from the isolated package"
        );
    } catch (error) {
        if (error.code !== "MODULE_NOT_FOUND") {
            throw error;
        }
    }

    const cjsConsumer = path.join(projectRoot, "consumer.cjs");
    fs.writeFileSync(
        cjsConsumer,
        [
            'const assert = require("node:assert/strict");',
            'const msal = require("@azure/msal-node");',
            'assert.equal(typeof msal.ConfidentialClientApplication, "function");',
            'assert.equal(typeof msal.ManagedIdentityApplication, "function");',
        ].join("\n")
    );
    runNode([cjsConsumer], projectRoot);

    const esmConsumer = path.join(projectRoot, "consumer.mjs");
    fs.writeFileSync(
        esmConsumer,
        [
            'import assert from "node:assert/strict";',
            'import * as msal from "@azure/msal-node";',
            'assert.equal(typeof msal.ConfidentialClientApplication, "function");',
            'assert.equal(typeof msal.ManagedIdentityApplication, "function");',
        ].join("\n")
    );
    runNode([esmConsumer], projectRoot);

    const typeConsumer = path.join(projectRoot, "consumer.ts");
    const typeConsumerSource = [
        "import {",
        "    AuthError,",
        "    ConfidentialClientApplication,",
        "    ManagedIdentityApplication,",
        '} from "@azure/msal-node";',
        "void AuthError;",
        "void ConfidentialClientApplication;",
        "void ManagedIdentityApplication;",
    ].join("\n");
    fs.writeFileSync(typeConsumer, typeConsumerSource);
    fs.writeFileSync(
        path.join(projectRoot, "consumer.cts"),
        typeConsumerSource
    );
    fs.writeFileSync(
        path.join(projectRoot, "tsconfig.json"),
        JSON.stringify(
            {
                compilerOptions: {
                    lib: ["ES2022"],
                    module: "Node16",
                    moduleResolution: "Node16",
                    noEmit: true,
                    strict: true,
                    target: "ES2022",
                    types: ["node"],
                },
                files: ["consumer.ts", "consumer.cts"],
            },
            null,
            2
        )
    );
    const typescriptCli = requireFromProject.resolve("typescript/lib/tsc.js");
    runNode([typescriptCli, "--project", "tsconfig.json"], projectRoot);

    for (const file of findFiles(installedPackageRoot, [
        ".js",
        ".cjs",
        ".mjs",
        ".ts",
        ".cts",
        ".mts",
    ])) {
        if (fs.readFileSync(file, "utf8").includes("@azure/msal-common")) {
            throw new Error(
                `Packed artifact references @azure/msal-common: ${path.relative(
                    installedPackageRoot,
                    file
                )}`
            );
        }
    }

    console.log(
        `Validated isolated packed @azure/msal-node@${manifest.version}`
    );
} finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
}

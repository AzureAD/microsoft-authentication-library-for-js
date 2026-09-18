// Validates the package built by the governed E2E job in an isolated consumer,
// then stages that package and its closure before Jest loads product tests.
const { execFileSync } = require("child_process");
const { createHash } = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createRequire } = require("module");
const { fileURLToPath } = require("url");

const enabled = process.env.MSAL_NODE_E2E_LOCAL_PACKAGE === "true";

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
        execFileSync(process.execPath, [npmCli, ...args], {
            cwd,
            stdio: "inherit",
        });
        return;
    }

    execFileSync("npm", args, { cwd, stdio: "inherit" });
}

function isPathInside(parent, candidate) {
    const relativePath = path.relative(parent, candidate);
    return (
        relativePath !== "" &&
        relativePath !== ".." &&
        !relativePath.startsWith(`..${path.sep}`) &&
        !path.isAbsolute(relativePath)
    );
}

function validateEntrypoint(packageRoot, entrypoint, kind) {
    if (!isPathInside(packageRoot, entrypoint)) {
        throw new Error(
            `The packed ${kind} entrypoint resolves outside the package: ${entrypoint}`
        );
    }
}

function findPackageRoot(entrypoint, packageName) {
    let currentDirectory = path.dirname(fs.realpathSync(entrypoint));
    while (true) {
        const manifestPath = path.join(currentDirectory, "package.json");
        if (fs.existsSync(manifestPath)) {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
            if (manifest.name === packageName) {
                return currentDirectory;
            }
        }

        const parentDirectory = path.dirname(currentDirectory);
        if (parentDirectory === currentDirectory) {
            throw new Error(
                `Could not find the package root for ${packageName}`
            );
        }
        currentDirectory = parentDirectory;
    }
}

module.exports = () => {
    if (!enabled) {
        return;
    }

    const repositoryRoot = path.resolve(__dirname, "../..");
    const packageRoot = path.join(repositoryRoot, "lib", "msal-node");
    const sampleRoot = fs.realpathSync(process.cwd());
    const samplePath = path
        .relative(repositoryRoot, sampleRoot)
        .split(path.sep)
        .join("/");
    const retainedSamples = new Set([
        "samples/msal-node-samples/auth-code",
        "samples/msal-node-samples/client-credentials",
        "samples/msal-node-samples/client-credentials-with-cert-from-key-vault",
        "samples/msal-node-samples/silent-flow",
    ]);

    if (!retainedSamples.has(samplePath)) {
        throw new Error(
            `Local MSAL Node package validation is not configured for ${samplePath}`
        );
    }

    const packageJson = require(path.join(packageRoot, "package.json"));
    for (const entrypoint of [
        packageJson.main,
        packageJson.module,
        packageJson.types,
    ]) {
        if (!entrypoint || !fs.existsSync(path.join(packageRoot, entrypoint))) {
            throw new Error(
                `MSAL Node build output is missing before npm pack: ${entrypoint}`
            );
        }
    }

    const packDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), "msal-node-e2e-")
    );
    const consumerRoot = path.join(packDirectory, "consumer");

    try {
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
                `Expected one packed MSAL Node tarball, found ${tarballs.length}`
            );
        }

        const tarball = path.join(packDirectory, tarballs[0]);
        const tarballHash = createHash("sha256")
            .update(fs.readFileSync(tarball))
            .digest("hex");
        fs.mkdirSync(consumerRoot);
        fs.writeFileSync(
            path.join(consumerRoot, "package.json"),
            JSON.stringify({
                name: "msal-node-packed-package-validation",
                private: true,
                type: "module",
            })
        );

        const installArgs = [
            "install",
            "--ignore-scripts",
            "--loglevel=error",
            "--no-audit",
            "--no-fund",
            "--package-lock=false",
            "--prefer-offline",
            tarball,
        ];
        const repositoryNpmrc = path.join(repositoryRoot, ".npmrc");
        if (fs.existsSync(repositoryNpmrc)) {
            installArgs.push(`--userconfig=${repositoryNpmrc}`);
        }
        runNpm(installArgs, consumerRoot);

        const requireFromConsumer = createRequire(
            path.join(consumerRoot, "package.json")
        );
        const resolvedManifest = fs.realpathSync(
            requireFromConsumer.resolve("@azure/msal-node/package.json")
        );
        const resolvedPackageRoot = path.dirname(resolvedManifest);
        const resolvedCommonJsEntrypoint = fs.realpathSync(
            requireFromConsumer.resolve("@azure/msal-node")
        );
        const installedPackage = JSON.parse(
            fs.readFileSync(resolvedManifest, "utf8")
        );

        if (!isPathInside(consumerRoot, resolvedPackageRoot)) {
            throw new Error(
                `The packed package resolves outside the isolated consumer: ${resolvedPackageRoot}`
            );
        }
        if (installedPackage.version !== packageJson.version) {
            throw new Error(
                `The isolated consumer resolves @azure/msal-node@${installedPackage.version}, expected packed version ${packageJson.version}`
            );
        }
        requireFromConsumer("@azure/msal-node");
        validateEntrypoint(
            resolvedPackageRoot,
            resolvedCommonJsEntrypoint,
            "CommonJS"
        );

        const esmValidationScript = path.join(
            consumerRoot,
            "validate-msal-node-esm.mjs"
        );
        fs.writeFileSync(
            esmValidationScript,
            [
                'const resolved = import.meta.resolve("@azure/msal-node");',
                'await import("@azure/msal-node");',
                "process.stdout.write(resolved);",
            ].join("\n")
        );
        const resolvedEsmEntrypoint = fs.realpathSync(
            fileURLToPath(
                execFileSync(process.execPath, [esmValidationScript], {
                    cwd: consumerRoot,
                    encoding: "utf8",
                })
            )
        );
        validateEntrypoint(resolvedPackageRoot, resolvedEsmEntrypoint, "ESM");

        const runtimeDependencies = Object.keys(
            installedPackage.dependencies || {}
        ).sort();
        if (
            JSON.stringify(runtimeDependencies) !==
            JSON.stringify(["jsonwebtoken", "lru-cache"])
        ) {
            throw new Error(
                `Unexpected packed MSAL Node runtime dependencies: ${runtimeDependencies.join(
                    ", "
                )}`
            );
        }
        for (const dependency of runtimeDependencies) {
            const dependencyEntrypoint = fs.realpathSync(
                requireFromConsumer.resolve(dependency)
            );
            if (!isPathInside(consumerRoot, dependencyEntrypoint)) {
                throw new Error(
                    `Runtime dependency ${dependency} resolves outside the isolated consumer: ${dependencyEntrypoint}`
                );
            }
        }
        try {
            requireFromConsumer.resolve("@azure/msal-common");
            throw new Error(
                "@azure/msal-common unexpectedly resolves from the isolated consumer"
            );
        } catch (error) {
            if (error.code !== "MODULE_NOT_FOUND") {
                throw error;
            }
        }

        const samplePackageRoot = path.join(
            sampleRoot,
            "node_modules",
            "@azure",
            "msal-node"
        );
        fs.rmSync(samplePackageRoot, { recursive: true, force: true });
        fs.mkdirSync(path.dirname(samplePackageRoot), { recursive: true });
        fs.cpSync(resolvedPackageRoot, samplePackageRoot, { recursive: true });
        const requireFromWorkspacePackage = createRequire(
            path.join(packageRoot, "package.json")
        );
        for (const dependency of runtimeDependencies) {
            const lockedDependencyRoot = findPackageRoot(
                requireFromWorkspacePackage.resolve(dependency),
                dependency
            );
            if (!isPathInside(repositoryRoot, lockedDependencyRoot)) {
                throw new Error(
                    `Locked runtime dependency ${dependency} resolves outside the repository: ${lockedDependencyRoot}`
                );
            }
            fs.cpSync(
                lockedDependencyRoot,
                path.join(samplePackageRoot, "node_modules", dependency),
                { recursive: true }
            );
        }

        const requireFromSample = createRequire(
            path.join(sampleRoot, "package.json")
        );
        const sampleManifest = fs.realpathSync(
            requireFromSample.resolve("@azure/msal-node/package.json")
        );
        const sampleEntrypoint = fs.realpathSync(
            requireFromSample.resolve("@azure/msal-node")
        );
        if (
            path.dirname(sampleManifest) !== fs.realpathSync(samplePackageRoot)
        ) {
            throw new Error(
                `The sample does not resolve the copied packed package: ${sampleManifest}`
            );
        }
        validateEntrypoint(samplePackageRoot, sampleEntrypoint, "sample");
        requireFromSample("@azure/msal-node");
        const requireFromSamplePackage = createRequire(sampleManifest);
        for (const dependency of runtimeDependencies) {
            const dependencyEntrypoint = fs.realpathSync(
                requireFromSamplePackage.resolve(dependency)
            );
            if (!isPathInside(samplePackageRoot, dependencyEntrypoint)) {
                throw new Error(
                    `The sample resolves ${dependency} outside the copied package closure: ${dependencyEntrypoint}`
                );
            }
        }

        console.log(
            `Validated ${samplePath} against packed @azure/msal-node@${installedPackage.version} (sha256:${tarballHash})`
        );
    } finally {
        fs.rmSync(packDirectory, { recursive: true, force: true });
    }
};

// Installs the package built by the governed E2E job into the current sample
// before Jest loads any product tests.
const { execFileSync } = require("child_process");
const { createHash } = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createRequire } = require("module");

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

        runNpm(
            [
                "install",
                "--ignore-scripts",
                "--loglevel=error",
                "--no-audit",
                "--no-fund",
                "--no-save",
                "--package-lock=false",
                "--workspaces=false",
                tarball,
            ],
            sampleRoot
        );

        const requireFromSample = createRequire(
            path.join(sampleRoot, "package.json")
        );
        const resolvedManifest = fs.realpathSync(
            requireFromSample.resolve("@azure/msal-node/package.json")
        );
        const resolvedPackageRoot = path.dirname(resolvedManifest);
        const resolvedEntrypoint = fs.realpathSync(
            requireFromSample.resolve("@azure/msal-node")
        );
        const installedPackage = JSON.parse(
            fs.readFileSync(resolvedManifest, "utf8")
        );

        if (resolvedPackageRoot === fs.realpathSync(packageRoot)) {
            throw new Error(
                "The sample resolves the workspace directory instead of the packed MSAL Node artifact"
            );
        }
        if (installedPackage.version !== packageJson.version) {
            throw new Error(
                `The sample resolves @azure/msal-node@${installedPackage.version}, expected packed version ${packageJson.version}`
            );
        }
        const relativeEntrypoint = path.relative(
            resolvedPackageRoot,
            resolvedEntrypoint
        );
        if (
            path.isAbsolute(relativeEntrypoint) ||
            relativeEntrypoint === ".." ||
            relativeEntrypoint.startsWith(`..${path.sep}`)
        ) {
            throw new Error(
                `The sample entrypoint resolves outside the packed package: ${resolvedEntrypoint}`
            );
        }
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

        console.log(
            `Validated ${samplePath} against packed @azure/msal-node@${installedPackage.version} (sha256:${tarballHash})`
        );
    } finally {
        fs.rmSync(packDirectory, { recursive: true, force: true });
    }
};

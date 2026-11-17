/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function main() {
    assert.equal(process.platform, "win32", "DPAPI requires Windows");
    const packageDirectory = path.resolve(process.argv[2]);
    const commonjs = require(path.join(
        packageDirectory,
        "lib",
        "msal-node-extensions.cjs"
    ));
    const esm = await import(
        pathToFileURL(path.join(packageDirectory, "dist", "index.mjs")).href
    );
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "msal-dpapi-"));

    try {
        for (const [index, api] of [commonjs, esm].entries()) {
            for (const scope of Object.values(api.DataProtectionScope)) {
                for (const entropy of [undefined, "test-entropy"]) {
                    const file = path.join(
                        directory,
                        `${index}-${scope}-${entropy}.cache`
                    );
                    const persistence =
                        await api.FilePersistenceWithDataProtection.create(
                            file,
                            scope,
                            entropy
                        );
                    await persistence.save("MSAL packaged DPAPI round trip");
                    assert.equal(
                        await persistence.load(),
                        "MSAL packaged DPAPI round trip"
                    );
                    assert.notEqual(
                        await fs.readFile(file, "utf8"),
                        "MSAL packaged DPAPI round trip"
                    );
                }
            }
        }
        console.log(
            `${process.version} ${process.arch}: packaged CommonJS/ESM DPAPI round trips passed`
        );
    } finally {
        await fs.rm(directory, { recursive: true, force: true });
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

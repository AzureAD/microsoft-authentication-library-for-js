/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * Verifies that MsalMtlsMsiHelper.exe is present for all required architectures.
 * Runs as part of `prepack` to catch missing binaries before publishing to npm.
 */

const { platform } = require("process");
const fs = require("fs");
const path = require("path");

if (platform !== "win32") {
    console.log(
        "Platform is not Windows. Skipping binary check for MsalMtlsMsiHelper."
    );
    process.exit(0);
}

const architectures = ["x64", "arm64"];
let allPresent = true;

architectures.forEach((arch) => {
    const binary = path.join(
        __dirname,
        "..",
        "bin",
        `win-${arch}`,
        "MsalMtlsMsiHelper.exe"
    );
    if (!fs.existsSync(binary)) {
        console.error(
            `Missing binary for win-${arch}: ${binary}\n` +
                `  Run "npm run build:binaries" to build it.`
        );
        allPresent = false;
    } else {
        console.log(`  [ok] bin/win-${arch}/MsalMtlsMsiHelper.exe`);
    }
});

if (!allPresent) {
    process.exit(1);
}

console.log("All binaries present.");
process.exit(0);

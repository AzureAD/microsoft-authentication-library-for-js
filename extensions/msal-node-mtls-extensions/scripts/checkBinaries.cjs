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
// AttestationClientLib.dll is required for VBS attestation.
// Microsoft.Azure.Security.KeyGuardAttestation currently ships x64 only.
const attestationDllArchitectures = ["x64"];
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

    // AttestationClientLib.dll is required alongside the binary for withAttestation support.
    if (attestationDllArchitectures.includes(arch)) {
        const attestDll = path.join(
            __dirname,
            "..",
            "bin",
            `win-${arch}`,
            "AttestationClientLib.dll"
        );
        if (!fs.existsSync(attestDll)) {
            console.error(
                `Missing AttestationClientLib.dll for win-${arch}: ${attestDll}\n` +
                    `  Run "npm run build:binaries" to build and copy it.`
            );
            allPresent = false;
        } else {
            console.log(`  [ok] bin/win-${arch}/AttestationClientLib.dll`);
        }
    }
});

if (!allPresent) {
    process.exit(1);
}

console.log("All binaries present.");
process.exit(0);

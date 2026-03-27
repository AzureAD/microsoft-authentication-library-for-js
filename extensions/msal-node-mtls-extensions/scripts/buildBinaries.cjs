/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * Builds MsalMtlsMsiHelper.exe for win-x64 and win-arm64 via `dotnet publish`.
 * Runs as `npm run build:binaries` and is called by `prepack`.
 *
 * Requirements: .NET 8 SDK installed and on PATH.
 */

const { platform } = require("process");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

if (platform !== "win32") {
    console.log(
        "Platform is not Windows. Skipping build of MsalMtlsMsiHelper."
    );
    process.exit(0);
}

const architectures = ["x64", "arm64"];
const projectDir = path.join(
    __dirname,
    "..",
    "native",
    "MsalMtlsMsiHelper"
);
const binDir = path.join(__dirname, "..", "bin");

if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir);
}

architectures.forEach((arch) => {
    const outputDir = path.join(binDir, `win-${arch}`);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const cmd = [
        "dotnet publish",
        `"${projectDir}"`,
        `-r win-${arch}`,
        "--self-contained false",
        "/p:PublishSingleFile=true",
        "-c Release",
        `-o "${outputDir}"`,
    ].join(" ");

    console.log(`\nBuilding MsalMtlsMsiHelper for win-${arch}...`);
    console.log(`  ${cmd}`);

    try {
        execSync(cmd, { stdio: "inherit" });
        console.log(`  -> bin/win-${arch}/MsalMtlsMsiHelper.exe`);
    } catch (err) {
        console.error(`Failed to build for win-${arch}: ${err.message}`);
        process.exit(1);
    }
});

console.log("\nAll binaries built successfully.");

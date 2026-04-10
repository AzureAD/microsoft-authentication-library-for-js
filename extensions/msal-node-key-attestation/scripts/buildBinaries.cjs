/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * Builds MsalMtlsMsiHelper.exe for win-x64 via `dotnet publish`.
 * Runs as `npm run build:binaries` and is called by `prepack`.
 *
 * The .NET source project lives in the sibling package:
 *   extensions/msal-node-mtls-extensions/native/MsalMtlsMsiHelper/
 *
 * Binaries are published to this package's bin/ directory:
 *   extensions/msal-node-key-attestation/bin/win-x64/
 *
 * Requirements: .NET 8 SDK installed and on PATH.
 * Note: Only win-x64 is supported. arm64 is not yet validated (AttestationClientLib.dll
 * does not ship for arm64 in the NuGet package).
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

const architectures = ["x64"];

// The .NET source lives in the sibling msal-node-mtls-extensions package.
const projectDir = path.join(
    __dirname,
    "..",
    "..",
    "msal-node-mtls-extensions",
    "native",
    "MsalMtlsMsiHelper"
);
const binDir = path.join(__dirname, "..", "bin");

if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir);
}

// Map arch to MSBuild PlatformTarget
const archMeta = {
    x64: { platformTarget: "x64" },
};

// Architectures that include AttestationClientLib.dll in the NuGet package.
// The Microsoft.Azure.Security.KeyGuardAttestation package currently ships x64 only.
const attestationDllArchitectures = ["x64"];

architectures.forEach((arch) => {
    const outputDir = path.join(binDir, `win-${arch}`);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const platformTarget = archMeta[arch].platformTarget;

    // Pass PlatformTarget so the MSBuild .targets file from
    // Microsoft.Azure.Security.KeyGuardAttestation copies AttestationClientLib.dll
    // into the publish output directory.
    const cmd = [
        "dotnet publish",
        `"${projectDir}"`,
        `-r win-${arch}`,
        "--self-contained false",
        "/p:PublishSingleFile=true",
        `-p:PlatformTarget=${platformTarget}`,
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

    // Verify AttestationClientLib.dll was copied for architectures that require it.
    // If MSBuild skipped the copy (e.g. PlatformTarget mismatch on a CI image), fall
    // back to locating the DLL in the NuGet global-packages cache.
    if (attestationDllArchitectures.includes(arch)) {
        const dllDest = path.join(outputDir, "AttestationClientLib.dll");
        if (!fs.existsSync(dllDest)) {
            console.log(
                `  AttestationClientLib.dll not found in publish output — searching NuGet cache...`
            );
            const nugetCachePath = getNugetGlobalPackagesPath();
            const dllSrc = findAttestationDll(nugetCachePath, arch);
            if (dllSrc) {
                fs.copyFileSync(dllSrc, dllDest);
                console.log(
                    `  -> bin/win-${arch}/AttestationClientLib.dll (copied from NuGet cache)`
                );
            } else {
                console.error(
                    `  WARNING: AttestationClientLib.dll not found for win-${arch}.\n` +
                        `  VMs that require VBS attestation will not work without this file.\n` +
                        `  Expected location: <nuget-global-packages>/microsoft.azure.security.keyguardattestation/<version>/build/native/lib/${arch}/`
                );
            }
        } else {
            console.log(`  -> bin/win-${arch}/AttestationClientLib.dll`);
        }
    }
});

console.log("\nAll binaries built successfully.");

/**
 * Returns the NuGet global packages root directory.
 * Uses `dotnet nuget locals global-packages --list` for reliability.
 */
function getNugetGlobalPackagesPath() {
    try {
        const output = execSync("dotnet nuget locals global-packages --list", {
            encoding: "utf8",
        });
        // Output format: "global-packages: C:\Users\user\.nuget\packages\"
        const match = output.match(/global-packages:\s*(.+)/);
        if (match) {
            return match[1].trim();
        }
    } catch {
        // fall through to default
    }
    // Default fallback
    return path.join(
        process.env.USERPROFILE || process.env.HOME || "",
        ".nuget",
        "packages"
    );
}

/**
 * Finds AttestationClientLib.dll for the given architecture in the NuGet cache.
 * Returns the full path if found, otherwise null.
 */
function findAttestationDll(nugetRoot, arch) {
    const pkgDir = path.join(
        nugetRoot,
        "microsoft.azure.security.keyguardattestation"
    );
    if (!fs.existsSync(pkgDir)) {
        return null;
    }
    // Pick the highest installed version
    const versions = fs
        .readdirSync(pkgDir)
        .filter((v) => fs.statSync(path.join(pkgDir, v)).isDirectory())
        .sort()
        .reverse();
    for (const version of versions) {
        const dllPath = path.join(
            pkgDir,
            version,
            "build",
            "native",
            "lib",
            arch,
            "AttestationClientLib.dll"
        );
        if (fs.existsSync(dllPath)) {
            return dllPath;
        }
    }
    return null;
}

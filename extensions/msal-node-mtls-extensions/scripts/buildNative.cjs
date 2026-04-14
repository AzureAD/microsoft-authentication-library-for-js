/**
 * Builds the msal_mtls_win.node N-API addon and copies it to bin/win-x64/.
 * Only runs on Windows; a no-op on other platforms (the addon is Windows-only).
 *
 * Usage:
 *   node scripts/buildNative.cjs [--arch <x64|arm64|ia32>]
 *
 * Requires:
 *   - MSVC (Visual Studio with C++ workload) — specifically vcvarsall.bat
 *   - node-gyp (available as a devDependency or globally)
 */

"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const process = require("process");

if (process.platform !== "win32") {
    console.log("Platform is not Windows. Skipping native addon build.");
    process.exit(0);
}

// Resolve paths relative to package root (one level up from scripts/)
const packageRoot = path.join(__dirname, "..");
const buildRelease = path.join(packageRoot, "build", "Release", "msal_mtls_win.node");
const binDir = path.join(packageRoot, "bin", "win-x64");
const destFile = path.join(binDir, "msal_mtls_win.node");

// Parse --arch argument (default x64)
const archIdx = process.argv.indexOf("--arch");
const arch = archIdx !== -1 ? process.argv[archIdx + 1] : "x64";

// Locate vcvarsall.bat — check common VS installation paths
const vsPaths = [
    "C:\\Program Files\\Microsoft Visual Studio\\18\\Community\\VC\\Auxiliary\\Build\\vcvarsall.bat",
    "C:\\Program Files\\Microsoft Visual Studio\\2022\\Community\\VC\\Auxiliary\\Build\\vcvarsall.bat",
    "C:\\Program Files\\Microsoft Visual Studio\\2022\\Enterprise\\VC\\Auxiliary\\Build\\vcvarsall.bat",
    "C:\\Program Files\\Microsoft Visual Studio\\2022\\Professional\\VC\\Auxiliary\\Build\\vcvarsall.bat",
    "C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Community\\VC\\Auxiliary\\Build\\vcvarsall.bat",
];

const vcvarsall = vsPaths.find(fs.existsSync);
if (!vcvarsall) {
    console.error("ERROR: Could not find vcvarsall.bat. Install Visual Studio with C++ workload.");
    process.exit(1);
}

// Locate node-gyp: prefer local devDependency JS file, fall back to global CLI
const localNodeGypJs = path.join(packageRoot, "node_modules", "node-gyp", "bin", "node-gyp.js");
const hasLocalNodeGyp = fs.existsSync(localNodeGypJs);

// Build the node-gyp invocation: local = `node "path/to/node-gyp.js"`, global = `node-gyp`
const nodeGypCmd = hasLocalNodeGyp
    ? `node "${localNodeGypJs}"`
    : "node-gyp";

console.log(`Building msal_mtls_win.node for ${arch}...`);
console.log(`  vcvarsall: ${vcvarsall}`);
console.log(`  node-gyp:  ${hasLocalNodeGyp ? localNodeGypJs : "node-gyp (global)"}`);

try {
    execSync(
        `cmd /c ""${vcvarsall}" ${arch} && ${nodeGypCmd} rebuild --arch=${arch}"`,
        { cwd: packageRoot, stdio: "inherit" }
    );
} catch (err) {
    console.error("ERROR: node-gyp build failed.");
    process.exit(1);
}

// Copy binary to bin/win-x64/
if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
}

fs.copyFileSync(buildRelease, destFile);
console.log(`Copied ${buildRelease} -> ${destFile}`);

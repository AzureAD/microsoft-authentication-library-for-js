const { platform } = require('process');
if (platform !== "win32") {
    console.log("Platform is not Windows. Skipping build of DPAPI");
    return;
}

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Allow overriding which architectures to build via env var MSAL_NODE_EXT_ARCHES (comma-separated)
// Default remains the previous set.
const defaultArchList = ["x64", "ia32", "arm64"];
const architectures = (process.env.MSAL_NODE_EXT_ARCHES || "")
    .split(/[,;\s]+/)
    .filter(Boolean)
    .map(a => a.trim())
    .filter(a => defaultArchList.includes(a));

if (!architectures.length) {
    architectures.push(...defaultArchList);
}

const failures = [];

const binDir = path.join(__dirname, "..", "bin");
if (!fs.existsSync(binDir)) {
    console.log(`Creating directory ${binDir}`);
    fs.mkdirSync(binDir);
}

architectures.forEach(arch => {
    const archDir = path.join(binDir, arch);
    if (!fs.existsSync(archDir)) {
        console.log(`Creating directory ${archDir}`);
        fs.mkdirSync(archDir);
    }

    try {
        execSync(`npm run compile -- --arch=${arch}`, { stdio: "inherit" });
    } catch (e) {
        console.error(`Compilation failed for arch ${arch}: ${e.message}`);
        failures.push(arch);
        return; // Skip copy & cleanup for this arch
    }

    const sourceFile = path.join(__dirname, "..", "build", "Release", "dpapi.node");
    const destFile = path.join(archDir, "dpapi.node");
    try {
        fs.copyFileSync(sourceFile, destFile);
        console.log(`${sourceFile} was successfully copied to ${destFile}`);
    } catch (err) {
        console.log(`Error copying ${sourceFile} to ${destFile}`);
        console.error(err);
        failures.push(arch);
        return;
    }

    // Remove build directory to start clean for the next build
    fs.rmSync(path.join(__dirname, "..", "build"), { recursive: true, force: true });
});

if (failures.length) {
    console.error(`DPAPI native build completed with failures for architectures: ${failures.join(", ")}`);
    // Non-zero exit to surface partial failure in CI, unless suppressed
    if (!process.env.MSAL_NODE_EXT_ALLOW_PARTIAL) {
        process.exit(1);
    }
} else {
    console.log("DPAPI native build completed successfully for all architectures.");
}

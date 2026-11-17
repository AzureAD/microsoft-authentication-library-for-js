const { platform } = require('process');
if (platform !== "win32") {
    console.log("Platform is not Windows. Skipping build of DPAPI");
    return;
}

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const architectures = ["x64", "ia32", "arm64"];
// Node 24+ no longer ships Windows x86 import libraries. Node-API keeps these binaries runtime-independent.
const targetVersion = "22.23.5";

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

    execSync(`npm run compile -- --arch=${arch} --target=${targetVersion}`, {
        stdio: "inherit"
    });

    const sourceFile = path.join(__dirname, "..", "build", "Release", "dpapi.node");
    const destFile = path.join(archDir, "dpapi.node");
    try {
        fs.copyFileSync(sourceFile, destFile);
        console.log(`${sourceFile} was successfully copied to ${destFile}`);
    } catch (err) {
        console.log(`Error copying ${sourceFile} to ${destFile}`);
        throw err;
    }

    // Remove build directory to start clean for the next build
    fs.rmSync(path.join(__dirname, "..", "build"), { recursive: true, force: true });
});

const process = require("process");
const fs = require("fs");
const path = require("path");

const architectures = ["x64", "ia32", "arm64"];

architectures.forEach(arch => {
    const binary = path.join(__dirname, "..", "bin", arch, "dpapi.node");
    if (!fs.existsSync(binary)) {
        console.log(`Binary for ${arch} is missing!`);
        process.exit(1);
    }
});

console.log("All binaries present");
process.exit(0);
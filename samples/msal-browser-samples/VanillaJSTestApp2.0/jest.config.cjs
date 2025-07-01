const fs = require("fs");
const path = require("path");

const APP_DIR = path.join(__dirname, 'app');

// if a sample is specified, only run tests for that sample
const sampleFolders = process.argv.find(arg => arg.startsWith('--sample='))
    ? [path.join(APP_DIR, process.argv.find(arg => arg.startsWith('--sample='))?.split('=')[1])]
    : fs.readdirSync(APP_DIR, { withFileTypes: true })
        .filter(file => file.isDirectory() && file.name !== "node_modules" && fs.existsSync(path.resolve(APP_DIR, file.name, "jest.config.cjs")))
        .map(file => path.join(APP_DIR, file.name));

module.exports = {
    projects: sampleFolders,
    testTimeout: 30000
};

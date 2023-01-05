const fs = require("fs");
const path = require("path");

const APP_DIR = path.join(__dirname, 'app');

const sampleFolders = fs.readdirSync(APP_DIR, { withFileTypes: true }).filter(function(file) {
    return file.isDirectory() && file.name !== "node_modules" && fs.existsSync(path.resolve(APP_DIR, file.name, "jest.config.js"));
}).map(function(file) {
    return path.join(APP_DIR, file.name);
});

module.exports = {
    projects : sampleFolders,
    testTimeout: 30000
};

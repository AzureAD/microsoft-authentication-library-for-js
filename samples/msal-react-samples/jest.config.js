const fs = require("fs");
const path = require("path");

const sampleFolders = fs.readdirSync(__dirname, { withFileTypes: true }).filter(function(file) {
  return file.isDirectory() && file.name !== "node_modules" && fs.existsSync(path.resolve(__dirname, file.name, "jest.config.js"));
}).map(function(file) {
  return `<rootDir>/${file.name}`;
});

module.exports = {
  projects : sampleFolders
};
const serverUtils = require("./serverUtils");
const path = require("path");

function kill(rootDir) {
    serverUtils.killServer(rootDir);
};

module.exports = (jestOptions) => {
    if(jestOptions.projects) {
        jestOptions.projects.forEach((project) => {
            const jestConfig = require(path.resolve(project, "jest.config.js"));
            kill(jestConfig.rootDir);
        });
    } else {
        kill(jestOptions.rootDir);
    }
}
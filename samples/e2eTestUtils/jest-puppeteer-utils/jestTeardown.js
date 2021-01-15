const serverUtils = require("./serverUtils");

function kill(rootDir) {
    serverUtils.killServer(rootDir);
};

module.exports = (jestOptions) => {
    if(jestOptions.projects) {
        jestOptions.projects.forEach((project) => {
            const jestConfig = require(`${project}\\jest.config.js`);
            kill(jestConfig.rootDir);
        });
    } else {
        kill(jestOptions.rootDir);
    }
}
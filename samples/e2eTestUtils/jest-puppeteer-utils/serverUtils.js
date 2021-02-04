const { exec } = require('child_process');
const waitOn  = require('wait-on');
const find = require("find-process");
const path = require("path");

/**
 * Returns boolean true/false if the given port is currently serving
 */
async function isServerUp(port, timeout) {
    try {
        await waitOn({ resources: [`http://localhost:${port}`], timeout: timeout});
    } catch (e) {
        return false;
    }

    return true;
}

/**
 * Spawns a child process to serve the sample
 */
function startServer(cmd, directory, callback) {
    exec(cmd, {cwd: directory}, callback);
}

/**
 * Kills all processes listening on a given port
 */
async function killServer(port) {
    return find("port", port).then((list) => {
        list.forEach(proc => {
            console.log(`Killing server on port ${port}`);
            process.kill(proc.pid);
        });
    });
}

/**
 * Finds all ports configured for this jest run and kills all open servers on those ports
 */
async function killServers(jestOptions) {
    if(jestOptions.projects && jestOptions.projects.length > 0) {
        for (let i = 0; i < jestOptions.projects.length; i++) {
            const project = jestOptions.projects[i];
            const jestConfig = require(path.resolve(project, "jest.config.js"));
            const port = jestConfig.globals.__PORT__;
            await killServer(port);
        };
    } else {
        const jestConfig = require(path.resolve(jestOptions.rootDir, "jest.config.js"));
        await killServer(jestConfig.globals.__PORT__);
    }
}

module.exports = {
    isServerUp, 
    startServer,
    killServer,
    killServers
}
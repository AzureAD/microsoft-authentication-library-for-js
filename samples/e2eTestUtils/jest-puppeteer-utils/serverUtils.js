const { exec } = require('child_process');
const waitOn  = require('wait-on');
const kill = require("tree-kill");
const fs = require("fs");
const path = require("path");

async function isServerUp(port, timeout) {
    try {
        await waitOn({ resources: [`http://localhost:${port}`], timeout: timeout});
    } catch (e) {
        return false;
    }

    return true;
}

function startServer(cmd, directory, callback) {
    const child = exec(cmd, {cwd: directory}, callback);
    
    // store the child instance so we can teardown it later
    fs.writeFileSync(path.join(directory, '.server.pid'), child.pid.toString());
}

function killServer(sampleDirectory) {
    const filename = path.join(sampleDirectory, '.server.pid')
    const pid = fs.readFileSync(filename);
    kill(pid);
    fs.unlinkSync(filename);
}

function getPortForProject(projects, sampleName) {
    const matches = projects.filter(project => {
        const sampleDir = project.rootDir.split("/").pop();
        if (sampleName === sampleDir) {
            return true;
        }

        return false;
    });

    if (matches.length > 1) {
        throw Error(`${sampleName} is defined more than once in jest config!`);
    } else if (matches.length <= 0) {
        throw Error(`${sampleName} is not defined in jest config!`);
    }

    const project = matches[0];
    if (project.globals.__PORT__) {
        return project.globals.__PORT__;
    } else {
        throw Error(`Unable to get port for ${sampleName}!`);
    }
}

module.exports = {
    isServerUp, 
    startServer,
    killServer,
    getPortForProject
}
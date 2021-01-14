const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const PARENT_DIR = path.resolve();

async function installPackages(sample) {
    console.log(`Installing packages for ${sample}`);
    const directory = `${PARENT_DIR}/${sample}`;
    return new Promise ((resolve, reject) => {
        exec("npm install && npm install:local", {cwd: directory}, (error) => {
            if (error) {
                console.log(`${sample}: ${error}`);
                reject();
            } else {
                resolve();
            }
        });
    });
}

async function buildSample(sample) {
    console.log(`Building ${sample}...`);

    const directory = `${PARENT_DIR}/${sample}`;
    return new Promise ((resolve, reject) => {
        exec("npm run build", {cwd: directory}, (error) => {
            if (error) {
                console.log(`${sample}: ${error}`);
                reject();
            } else {
                resolve();
            }
        });
    });
}

function getSampleFolders() {
    return fs.readdirSync(PARENT_DIR, { withFileTypes: true }).filter(function(file) {
        return file.isDirectory() && fs.existsSync(`${PARENT_DIR}/${file.name}/package.json`);
    }).map(function(file) {
        return file.name;
    });
}

async function main() {
    const sampleFolders = getSampleFolders();

    // Run npm install in each sample
    const installs = [];
    sampleFolders.forEach(sample => {
        installs.push(installPackages(sample));
    });
    await Promise.all(installs).catch(() => process.exit(1));

    // Run npm run build in each sample
    const builds = [];
    sampleFolders.forEach(sample => {
        builds.push(buildSample(sample));
    });
    await Promise.all(builds).then(() => {
        console.log("SUCCESS");
        process.exit(0);
    }).catch(() => process.exit(1));
}

main();
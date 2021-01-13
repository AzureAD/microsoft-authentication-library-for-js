import path from "path";
import fs from "fs";
import { exec } from 'child_process';

const PARENT_DIR = path.resolve();

const sampleFolders = fs.readdirSync(PARENT_DIR, { withFileTypes: true }).filter(function(file) {
    return file.isDirectory() && fs.existsSync(`${PARENT_DIR}/${file.name}/package.json`);
}).map(function(file) {
    return file.name;
});

const installProcesses = [];
const buildProcesses = [];

console.log("Installing packages for samples");
sampleFolders.forEach((sample) => {
    const directory = `${PARENT_DIR}/${sample}`;
    const install = new Promise ((resolve, reject) => {
        exec("npm install", {cwd: directory}, (error) => {
            if (error) {
                console.log(`${sample}: ${error}`);
                reject();
            } else {
                resolve();
            }
        });
    });
    installProcesses.push(install);
});
await Promise.all(installProcesses).catch(() => process.exit(1));

console.log("Building samples...");
sampleFolders.forEach((sample) => {
    const directory = `${PARENT_DIR}/${sample}`;
    const build = new Promise ((resolve, reject) => {
        exec("npm run build", {cwd: directory}, (error) => {
            if (error) {
                console.log(`${sample}: ${error}`);
                reject();
            } else {
                resolve();
            }
        });
    });
    buildProcesses.push(build);
});
await Promise.all(buildProcesses).then(() => {
    console.log("SUCCESS");
    process.exit(0);
}).catch(() => {
    process.exit(1)
});

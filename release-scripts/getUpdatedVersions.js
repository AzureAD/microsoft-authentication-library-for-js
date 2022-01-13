const { spawn } = require("child_process");
const fs = require('fs');
const process = require('process')

async function runProcess(command, args) {
    const p = spawn(command, args)
    let output = '';
    p.stdout.on("data", data => {
        output += data.toString()
    });


    return new Promise((resolve, reject) => {
        p.on('exit', (code) => {
            if (code !== 0) {
                return reject(code);
            }

            resolve(output)
        })
    });
}

const VERSION_DIFF_REGEX = /^\+\s*"version":\s*"([0-9\.]+)".*$/
const VERSION_DIFF_OLD_REGEX = /^\-\s*"version":\s*"([0-9\.]+)".*$/

function formatForGithubActions(markdownString) {
    return markdownString.replace(/\n/g, "%0A");
}

function extractVersionFromLines(lines, regex) {
    const [line] = lines
            .filter(line => regex.test(line));
            
    const regexResult = regex.exec(line);

    if (!regexResult || !regexResult[1]) {
        throw new Error("Cannot parse version for module " + module) 
    }

    return regexResult[1];
}

async function getBumpedModules() {
    const modules = fs.readdirSync('./lib');
    const moduleToNewVersion = {};
    const moduleToOldVersion = {};

    for (let i in modules) {
        const module = modules[i];
        const diff = await runProcess('git', ['diff', `./lib/${module}/package.json`]);

        if (diff.trim().length < 1) continue;

        const lines = diff.split("\n");

        const newVersion = extractVersionFromLines(lines, VERSION_DIFF_REGEX);
        const oldVersion = extractVersionFromLines(lines, VERSION_DIFF_OLD_REGEX);

        moduleToNewVersion[module] = newVersion;
        moduleToOldVersion[module] = oldVersion;

    }


    const modList = Object.keys(moduleToOldVersion)
        .map(module => `| ${module} | ${moduleToOldVersion[module]} |  ${moduleToNewVersion[module]} |`)
        .join("\n");


    let tableHeader = "| Module | Old Version | New Version |\n";
    tableHeader +=    "| ---    | ---         | ---         |\n"


    return formatForGithubActions(`The following modules have had their versions bumped:\n ${tableHeader}${modList}`);
};

(async () => {
    console.log(await getBumpedModules());
})();
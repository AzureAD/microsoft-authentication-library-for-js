const { spawn } = require("child_process");
const fs = require('fs/promises');
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

const VERSION_DIFF_REGEX = /^\+\s*"version"\s*:\s*"([^"]+)".*$/ //      '+  "version": "1.4.17",'
const VERSION_DIFF_OLD_REGEX = /^\-\s*"version"\s*:\s*"([^"]+)".*$/ //   '-  "version": "1.4.16",'

function formatForGithubActions(markdownString) {
    // Replaces all occurrences of \n with literal character '%0A'
    // This is needed to work around Github action output variables
    return markdownString.replace(/\n/g, "%0A");
}

//extracts matching lines 
function extractVersionFromLines(lines, regex) {
    const [line] = lines
            .filter(line => regex.test(line));
            
    const regexResult = regex.exec(line);

    if (!regexResult || !regexResult[1]) {
        return '???'; // could not parse version from the diff, return default value
    }

    return regexResult[1];
}

const extensionModulePaths = [
    './extensions/msal-node-extensions'
]

//returns the path of modules in lib as well as extensions path
//as specified by the extensionModulePaths above. 
async function getModulePaths() {
    const libRoot = './lib';
    const libDirNames = await fs.readdir(libRoot);

    const libDirPaths = libDirNames.map(lib => `${libRoot}/${lib}`); //parent dir is needed to handle the extensions case

    return [...libDirPaths, ...extensionModulePaths];
}

async function getBumpedModules() {
    const modulePaths = await getModulePaths();
    const moduleToNewVersion = {}; // map of module name to the new version it was bumped to
    const moduleToOldVersion = {}; // map of module name to its old version before the bump

    for (let modulePath of modulePaths) {
        const diff = await runProcess('git', ['diff', `${modulePath}/package.json`]);

        // skips to next module if git diff output is empty, i.e. this module was unchanged
        if (diff.trim().length < 1) continue; 

        //output of git diff separated by newlines for further processing 
        const lines = diff.split("\n");

        const newVersion = extractVersionFromLines(lines, VERSION_DIFF_REGEX);
        const oldVersion = extractVersionFromLines(lines, VERSION_DIFF_OLD_REGEX);

        //Fetch the module name from the path
        const modulePathComponents = modulePath.split('/');
        const module = modulePathComponents[modulePathComponents.length - 1];

        // adds the retrieved newer version to the map [msal-node]:1.4.2
        moduleToNewVersion[module] = newVersion;
        // adds the retrieved older version to the map [msal-node]:1.4.1
        moduleToOldVersion[module] = oldVersion;

    }


    //prepare the version information for applicable modules from the maps in row format
    // example- | msal-browser | 1.4.16 | 1.4.17 |
    //          | msal-node | 1.4.1 | 1.4.2 |
    const modList = Object.keys(moduleToOldVersion)
        .map(module => `| ${module} | ${moduleToOldVersion[module]} |  ${moduleToNewVersion[module]} |`)
        .join("\n");

    // Define a Markdown table header
    let tableHeader = "| Module | Old Version | New Version |\n";
    tableHeader +=    "| ---    | ---         | ---         |\n"


    return formatForGithubActions(`The following modules have had their versions bumped:\n ${tableHeader}${modList}`);
};

getBumpedModules().then((bumpedModulesDescription) => {
    console.log(bumpedModulesDescription);
});
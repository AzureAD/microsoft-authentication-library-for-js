/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const path = require("path");
const fs = require("fs");

const exclude = ["msal-angularjs"]; // Libs that should be excluded
const failures = 0;

const LIB_DIR = path.resolve(process.cwd(), "lib");
const libFolders = fs.readdirSync(LIB_DIR, { withFileTypes: true }).filter(function(file) {
    return file.isDirectory() && exclude.indexOf(file.name) === -1 && fs.existsSync(path.resolve(LIB_DIR, file.name, "package.json"));
}).map(function(file) {
    return file.name;
});

libFolders.forEach((lib) => {
    const packageJsonPath = path.resolve(LIB_DIR, lib, "package.json");
    const outputFilepath = path.resolve(LIB_DIR, lib, "src", "version.json");
    const packageJson = require(packageJsonPath);
    const versionJson = require(outputFilepath);

    if (packageJson.version !== versionJson.version) {
        console.log(`Updating ${packageJson.name} to version ${packageJson.version} from ${versionJson.version}`);
        const data = {
            name: packageJson.name,
            version: packageJson.version
        };

        try {
            fs.writeFileSync(outputFilepath, JSON.stringify(data));
        } catch {
            failures += 1;
            console.error(`Failed to update version for ${packageJson.name}`);
        }
    } else {
        console.log(`Update not needed for: ${packageJson.name}`);
    }
});

if (failures > 0) {
    console.error(`Failed to update versions on ${failures} packages`);
} else {
    console.log("All package versions updated successfully!");
}

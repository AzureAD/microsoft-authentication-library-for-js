/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const path = require("path");
const fs = require("fs");

const exclude = ["msal-angularjs"]; // Libs that should be excluded
const failures = 0;

const LIB_DIR = path.resolve(process.cwd(), "lib");
const EXTENSIONS_DIR = path.resolve(process.cwd(), "extensions");
const libFolders = fs.readdirSync(LIB_DIR, { withFileTypes: true }).filter(function(file) {
    return file.isDirectory() && exclude.indexOf(file.name) === -1 && fs.existsSync(path.resolve(LIB_DIR, file.name, "package.json"));
}).map(function(file) {
    return file.name;
});

function updatePackageMetadata(libPath) {
    const packageJsonPath = path.resolve(libPath, "package.json");
    const outputFilepath = path.resolve(libPath, "src", "packageMetadata.ts");
    const packageJson = require(packageJsonPath);

    console.log(`Updating ${packageJson.name} to version ${packageJson.version}`);
    const fileContents = [
        "/* eslint-disable header/header */",
        `export const name = "${packageJson.name}";`,
        `export const version = "${packageJson.version}";`,
        ""
    ];

    try {
        fs.writeFileSync(outputFilepath, fileContents.join("\n"));
    } catch {
        failures += 1;
        console.error(`Failed to update version for ${packageJson.name}`);
    }
};

libFolders.forEach((lib) => {
    const packagePath = path.resolve(LIB_DIR, lib);
    updatePackageMetadata(packagePath);
});

const nodeExtensionsPath = path.resolve(EXTENSIONS_DIR, "msal-node-extensions");
updatePackageMetadata(nodeExtensionsPath);

if (failures > 0) {
    console.error(`Failed to update versions on ${failures} packages`);
} else {
    console.log("All package versions updated successfully!");
}

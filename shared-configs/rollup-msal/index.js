/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const path = require("path");
const fs = require("fs");

/**
 * Creates a package json for the specific output (ESM or CJS). This is necessary to resolve types properly in both formats. 
 */
const createPackageJson = ({libPath}) => {
    return {
        name: "createPackageJson",
        writeBundle: (options) => {
            let format = "module";
            if (options.dir === "lib") {
                format = "commonjs"
            }
            const packageJsonPath = path.join(libPath, options.dir, "package.json");
            fs.writeFileSync(packageJsonPath, JSON.stringify({type: format}));
        }

    }
}

module.exports = {
    createPackageJson
}
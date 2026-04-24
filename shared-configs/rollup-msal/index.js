/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const path = require("path");
const fs = require("fs");
const { loggerMinifyPlugin } = require("./logger-minify-plugin");

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

/**
 * Creates CommonJS declaration shims that point to ESM declaration entrypoints.
 */
const createCjsTypeShims = ({ packageRoot, shims }) => {
    return {
        name: "createCjsTypeShims",
        writeBundle: () => {
            for (const shim of shims) {
                const absolutePath = path.resolve(packageRoot, shim.filePath);
                fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
                fs.writeFileSync(
                    absolutePath,
                    `declare const mod: typeof import("${shim.target}");\nexport = mod;\n`,
                    "utf8"
                );
            }
        }
    }
}

module.exports = {
    createPackageJson,
    createCjsTypeShims,
    loggerMinifyPlugin
}

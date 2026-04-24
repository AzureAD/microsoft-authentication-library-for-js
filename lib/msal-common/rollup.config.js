/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import typescript from "@rollup/plugin-typescript";
import pkg from "./package.json";
import { createCjsTypeShims, createPackageJson, loggerMinifyPlugin } from "rollup-msal";
import path from "path";

const libraryHeader = `/*! ${pkg.name} v${pkg.version} ${new Date().toISOString().split("T")[0]} */`;
const useStrictHeader = "'use strict';";
const fileHeader = `${libraryHeader}\n${useStrictHeader}`;
const minifyLogs = process.env.MSAL_MINIFY_LOGS !== 'false';

export default [
    {
        // for es build
        input: ["src/index-node.ts", "src/index.ts"],
        output: {
            dir: "dist",
            format: "es",
            entryFileNames: "[name].mjs",
            preserveModules: true,
            preserveModulesRoot: "src",
            banner: fileHeader,
            sourcemap: true,
        },
        treeshake: {
            moduleSideEffects: false,
            propertyReadSideEffects: false
        },
        external: [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.peerDependencies || {})
        ],
        plugins: [
            typescript({
                typescript: require("typescript"),
                tsconfig: "tsconfig.build.json"
            }),
            createCjsTypeShims({
                packageRoot: __dirname,
                shims: [
                    {
                        filePath: path.join("types", "index.d.cts"),
                        target: "./index.js",
                    },
                    {
                        filePath: path.join("types", "index-node.d.cts"),
                        target: "./index-node.js",
                    },
                    {
                        filePath: path.join("types", "index-browser.d.cts"),
                        target: "./index-browser.js",
                    },
                ],
            }),
        ]
    },
    {
        // for es build with hashed logs
        input: ["src/index-browser.ts", "src/index.ts"],
        output: {
            dir: "dist-browser",
            format: "es",
            entryFileNames: "[name].mjs",
            preserveModules: true,
            preserveModulesRoot: "src",
            banner: fileHeader,
            sourcemap: true,
        },
        treeshake: {
            moduleSideEffects: false,
            propertyReadSideEffects: false
        },
        external: [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.peerDependencies || {})
        ],
        plugins: [
            typescript({
                typescript: require("typescript"),
                tsconfig: "tsconfig.build.browser.json"
            }),
            ...(minifyLogs === true ? [loggerMinifyPlugin({
                outputFile: "./dist-browser/log-strings-mapping.json",
                packageJsonPath: path.resolve(__dirname, "./package.json"),
                verbose: true
            })] : [])
        ]
    },
    {
        input: ["src/index-browser.ts", "src/index-node.ts", "src/index.ts"],
        output: [
            {
                dir: "lib",
                format: "cjs",
                banner: fileHeader,
                sourcemap: true,
                entryFileNames: "[name].cjs"
            }
        ],
        external: [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.peerDependencies || {})
        ],
        plugins: [
            typescript({
                typescript: require("typescript"),
                tsconfig: "tsconfig.build.json",
                sourceMap: true,
                compilerOptions: {
                    outDir: "lib/types",
                    declaration: false,
                    declarationMap: false,
                }
            }),
            createPackageJson({libPath: __dirname})
        ]
    }
];

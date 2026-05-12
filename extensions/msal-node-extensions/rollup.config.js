/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import pkg from "./package.json";
import { createCjsTypeShims, createPackageJson } from "rollup-msal";
import path from "path";

const libraryHeader = `/*! ${pkg.name} v${pkg.version} ${new Date().toISOString().split("T")[0]} */`;
const useStrictHeader = "'use strict';";
const fileHeader = `${libraryHeader}\n${useStrictHeader}`;

export default [
    {
        // for cjs build
        input: "src/index.ts",
        output: {
            dir: "lib",
            format: "cjs",
            entryFileNames: "msal-node-extensions.cjs",
            banner: fileHeader,
            sourcemap: true
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
                tsconfig: "tsconfig.build.json",
                compilerOptions: {
                    outDir: "./lib"
                }
            }),
            nodeResolve({
                preferBuiltins: true
            }),
            createPackageJson({libPath: __dirname})
        ]
    },
    {
        // for esm build
        input: "src/index.ts",
        output: {
            dir: "dist",
            format: "es",
            entryFileNames: "[name].mjs",
            preserveModules: true,
            preserveModulesRoot: "src",
            banner: fileHeader,
            sourcemap: true
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
                        target: "./index.js"
                    }
                ]
            }),
            nodeResolve({
                preferBuiltins: true
            })
        ]
    }
];

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import typescript from "@rollup/plugin-typescript";
import pkg from "./package.json";
import { createCjsTypeShims, createPackageJson } from "rollup-msal";
import path from "path";

const libraryHeader = `/*! ${pkg.name} v${pkg.version} ${new Date().toISOString().split("T")[0]} */`;
const useStrictHeader = "'use strict';";
const fileHeader = `${libraryHeader}\n${useStrictHeader}`;

export default [
    {
        // for es build
        input: "src/index.ts",
        output: {
            dir: "dist",
            preserveModules: true,
            preserveModulesRoot: "src",
            format: "es",
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
                tsconfig: "tsconfig.build.json",
                compilerOptions: {
                    declaration: false,
                    declarationMap: false,
                }
            }),
            createCjsTypeShims({
                packageRoot: __dirname,
                shims: [
                    {
                        filePath: path.join("types", "index.d.cts"),
                        target: "../dist/index.js",
                    },
                ],
            }),
        ]
    },
    {
        input: "src/index.ts",
        output: {
            dir: "lib",
            format: "cjs",
            entryFileNames: "msal-react.cjs",
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
                tsconfig: "tsconfig.build.json",
                compilerOptions: {
                    outDir: "lib/types",
                    declaration: false,
                    declarationMap: false,
                }
            }),
            createPackageJson({ libPath: __dirname})
        ]
    }
];

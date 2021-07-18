/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";
import { terser } from "rollup-plugin-terser";
import pkg from "./package.json";

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
                tsconfig: "tsconfig.build.json"
            })
        ]
    },
    {
        input: "src/index.ts",
        preserveModules: false,
        output: [
            {
                file: pkg.main,
                format: "cjs",
                banner: fileHeader,
                sourcemap: true,
            },
            {
                file: "./lib/msal-browser.js",
                format: "umd",
                name: "msal",
                banner: fileHeader,
                sourcemap: true,
            }
        ],
        plugins: [
            nodeResolve({
                browser: true,
                resolveOnly: ["@azure/msal-common", "tslib"]
            }),
            typescript({
                typescript: require("typescript"),
                tsconfig: "tsconfig.build.json"
            })
        ]
    },
    {
        // Minified version of msal
        input: "src/index.ts",
        output: [
            {
                file: "./lib/msal-browser.min.js",
                format: "umd",
                name: "msal",
                banner: useStrictHeader,
                sourcemap: false,
            }
        ],
        plugins: [
            nodeResolve({
                browser: true,
                resolveOnly: ["@azure/msal-common", "tslib"]
            }),
            typescript({
                typescript: require("typescript"),
                tsconfig: "tsconfig.build.json"
            }),
            terser({
                output: {
                    preamble: libraryHeader
                }
            })
        ]
    }
];

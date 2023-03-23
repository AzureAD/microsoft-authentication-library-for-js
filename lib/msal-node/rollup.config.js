/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import pkg from "./package.json";

const libraryHeader = `/*! ${pkg.name} v${pkg.version} ${new Date().toISOString().split("T")[0]} */`;
const useStrictHeader = "'use strict';";
const fileHeader = `${libraryHeader}\n${useStrictHeader}`;

export default [
    {
        // for cjs build
        input: "src/index.ts",
        output: {
            dir: "dist",
            format: "cjs",
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
            typescript( {
                typescript: require("typescript"),
                tsconfig: "tsconfig.build.json"
            }),
            nodeResolve()
        ]
    },
    {
        // for cjs build
        input: "src/index.ts",
        output: {
            dir: "dist",
            format: "esm",
            entryFileNames: "[name].esm.js",
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
            typescript( {
                typescript: require("typescript"),
                tsconfig: "tsconfig.build.json"
            }),
            nodeResolve()
        ]
    },
    {
        // for cjs build
        input: "src/index.ts",
        output: {
            dir: "dist",
            format: "cjs",
            entryFileNames: "[name].[format].min.js",
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
            typescript( {
                typescript: require("typescript"),
                tsconfig: "tsconfig.build.json"
            }),
            nodeResolve(),
            terser({
                output: {
                    preamble: libraryHeader
                }
            })
        ]
    },
    {
        // for es build
        input: "src/index.ts",
        output: {
            dir: "dist",
            name: "msal-node",
            entryFileNames: "[name].[format].min.js",
            preserveModules: true,
            preserveModulesRoot: "src",
            format: "esm",
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
            nodeResolve(),
            terser({
                output: {
                    preamble: libraryHeader
                }
            })
        ]
    }
	
];

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";
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
            format: "es",
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
            nodeResolve({
                resolveOnly: ["jose"]
            }),
            typescript({
                typescript: require("typescript"),
                tsconfig: "tsconfig.build.json"
            })
        ]
    },
    {
        input: "src/index.ts",
        output: [
            {
                file: pkg.main,
                format: "cjs",
                banner: fileHeader,
                sourcemap: true
            }
        ],
        external: [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.peerDependencies || {})
        ],
        plugins: [
            nodeResolve({
                resolveOnly: ["jose"]
            }),
            typescript({
                typescript: require("typescript"),
                tsconfig: "tsconfig.build.json"
            })
        ]
    }
];

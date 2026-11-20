/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import typescript from "@rollup/plugin-typescript";
import pkg from "./package.json";

const banner = `/*! ${pkg.name} v${pkg.version} */`;

const typescriptPlugin = () =>
    typescript({
        typescript: require("typescript"),
        tsconfig: "tsconfig.build.json",
    });

export default [
    {
        input: {
            index: "src/index.ts",
            autoInstall: "src/autoInstall.ts",
        },
        output: {
            dir: "dist",
            format: "es",
            entryFileNames: "[name].mjs",
            banner,
            sourcemap: true,
        },
        plugins: [typescriptPlugin()],
    },
    {
        input: "src/index.ts",
        output: {
            file: "lib/index.cjs",
            format: "cjs",
            banner,
            exports: "named",
            sourcemap: true,
        },
        plugins: [typescriptPlugin()],
    },
    {
        input: "src/autoInstall.ts",
        output: {
            file: "dist/nested-app-auth-bridge.js",
            format: "iife",
            name: "NestedAppAuthBridge",
            banner,
            exports: "named",
            sourcemap: true,
        },
        plugins: [typescriptPlugin()],
    },
];

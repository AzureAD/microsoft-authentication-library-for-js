/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import pkg from "./package.json";
import { createPackageJson } from "rollup-msal";

const libraryHeader = `/*! ${pkg.name} v${pkg.version} ${
    new Date().toISOString().split("T")[0]
} */`;
const useStrictHeader = "'use strict';";
const fileHeader = `${libraryHeader}\n${useStrictHeader}`;

export default [
    {
        // Main SDK - ES build
        input: "src/index.ts",
        output: {
            dir: "dist",
            preserveModules: true,
            preserveModulesRoot: "src",
            format: "es",
            entryFileNames: "[name].mjs",
            banner: fileHeader,
            sourcemap: true,
        },
        treeshake: {
            moduleSideEffects: false,
            propertyReadSideEffects: false,
        },
        external: ["@azure/msal-common/browser"],
        plugins: [
            typescript({
                typescript: require("typescript"),
                tsconfig: "tsconfig.build.json",
            }),
        ],
    },
    {
        // Main SDK - CommonJS build
        input: "src/index.ts",
        output: [
            {
                dir: "lib",
                format: "cjs",
                banner: fileHeader,
                sourcemap: true,
                entryFileNames: "msal-browser.cjs",
                inlineDynamicImports: true,
            },
        ],
        plugins: [
            nodeResolve({
                browser: true,
                resolveOnly: ["@azure/msal-common", "tslib"],
            }),
            typescript({
                typescript: require("typescript"),
                tsconfig: "tsconfig.build.json",
                sourceMap: true,
                compilerOptions: { outDir: "lib/types" },
            }),
            createPackageJson({ libPath: __dirname }),
        ],
    },
    {
        // Main SDK - UMD build
        input: "src/index.ts",
        output: [
            {
                dir: "lib",
                format: "umd",
                name: "msal",
                banner: fileHeader,
                inlineDynamicImports: true,
                sourcemap: true,
                entryFileNames: "msal-browser.js",
            },
        ],
        plugins: [
            nodeResolve({
                browser: true,
                resolveOnly: ["@azure/msal-common", "tslib"],
            }),
            typescript({
                typescript: require("typescript"),
                tsconfig: "tsconfig.build.json",
                sourceMap: true,
                compilerOptions: {
                    outDir: "lib/types",
                    declaration: false,
                    declarationMap: false,
                },
            }),
        ],
    },
    {
        // Main SDK - UMD minified build
        input: "src/index.ts",
        output: [
            {
                dir: "lib",
                format: "umd",
                name: "msal",
                entryFileNames: "msal-browser.min.js",
                banner: useStrictHeader,
                inlineDynamicImports: true,
                sourcemap: false,
            },
        ],
        plugins: [
            nodeResolve({
                browser: true,
                resolveOnly: ["@azure/msal-common", "tslib"],
            }),
            typescript({
                typescript: require("typescript"),
                tsconfig: "tsconfig.build.json",
                sourceMap: false,
                compilerOptions: {
                    outDir: "lib/types",
                    declaration: false,
                    declarationMap: false,
                },
            }),
            terser({
                output: {
                    preamble: libraryHeader,
                },
            }),
        ],
    },
    {
        // Custom Auth - ES module build
        input: "src/custom_auth/index.ts",
        output: {
            dir: "dist/custom-auth-path",
            preserveModules: true,
            preserveModulesRoot: "src",
            format: "es",
            entryFileNames: "[name].mjs",
            banner: fileHeader,
            sourcemap: true,
        },
        treeshake: {
            moduleSideEffects: false,
            propertyReadSideEffects: false,
        },
        external: ["@azure/msal-common/browser"],
        plugins: [
            typescript({
                typescript: require("typescript"),
                tsconfig: "tsconfig.custom-auth.build.json",
            }),
        ],
    },
    {
        // Custom Auth - CommonJS build
        input: "src/custom_auth/index.ts",
        output: {
            dir: "lib/custom-auth-path",
            format: "cjs",
            banner: fileHeader,
            sourcemap: true,
            entryFileNames: "msal-custom-auth.cjs",
            inlineDynamicImports: true,
        },
        plugins: [
            nodeResolve({
                browser: true,
                resolveOnly: ["@azure/msal-common", "tslib"],
            }),
            typescript({
                typescript: require("typescript"),
                tsconfig: "tsconfig.custom-auth.build.json",
                sourceMap: true,
                compilerOptions: { outDir: "lib/custom-auth-path/types" },
            }),
        ],
    },
    {
        // Custom Auth - UMD build
        input: "src/custom_auth/index.ts",
        output: [
            {
                dir: "lib/custom-auth-path",
                format: "umd",
                name: "msalCustomAuth",
                banner: fileHeader,
                inlineDynamicImports: true,
                sourcemap: true,
                entryFileNames: "msal-custom-auth.js",
            },
        ],
        plugins: [
            nodeResolve({
                browser: true,
                resolveOnly: ["@azure/msal-common", "tslib"],
            }),
            typescript({
                typescript: require("typescript"),
                tsconfig: "tsconfig.custom-auth.build.json",
                sourceMap: true,
                compilerOptions: {
                    outDir: "lib/custom-auth-path/types",
                    declaration: false,
                    declarationMap: false,
                },
            }),
        ],
    },
];

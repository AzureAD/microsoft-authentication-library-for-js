/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import pkg from "./package.json";
import { createPackageJson, loggerMinifyPlugin } from "rollup-msal";
import path from "path";

const libraryHeader = `/*! ${pkg.name} v${pkg.version} ${
    new Date().toISOString().split("T")[0]
} */`;
const useStrictHeader = "'use strict';";
const fileHeader = `${libraryHeader}\n${useStrictHeader}`;
const minifyLogs = process.env.MSAL_MINIFY_LOGS !== 'false';

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
            ...(minifyLogs === true ? [loggerMinifyPlugin({
                verbose: true,
                outputFile: path.resolve(__dirname, "./dist/log-strings-mapping.json"),
                packageJsonPath: path.resolve(__dirname, "./package.json"),
            })] : []),
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
            ...(minifyLogs === true ? [loggerMinifyPlugin({
                outputFile: path.resolve(__dirname, "./lib/log-strings-mapping.json"),
                packageJsonPath: path.resolve(__dirname, "./package.json"),
                verbose: true
            })] : []),
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
            ...(minifyLogs === true ? [loggerMinifyPlugin({
                verbose: true
            })] : []),
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
            loggerMinifyPlugin({
                verbose: true
            }),
            terser({
                output: {
                    preamble: libraryHeader,
                    comments: false,
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
            ...(minifyLogs === true ? [loggerMinifyPlugin({
                verbose: true,
                outputFile: path.resolve(__dirname, "./dist/custom-auth-path/log-strings-mapping.json"),
                packageJsonPath: path.resolve(__dirname, "./package.json"),
            })] : []),
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
            ...(minifyLogs === true ? [loggerMinifyPlugin({
                outputFile: path.resolve(__dirname, "./lib/custom-auth-path/log-strings-mapping.json"),
                packageJsonPath: path.resolve(__dirname, "./package.json"),
                verbose: true
            })] : []),
        ],
    },
    {
        // Popup Bridge - ES module build
        input: "src/popup_bridge/index.ts",
        output: {
            dir: "dist/popup-bridge",
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
                tsconfig: "tsconfig.rollup-bridge.build.json",
            }),
        ],
    },
    {
        // Popup Bridge - UMD build
        input: "src/popup_bridge/index.ts",
        output: [
            {
                dir: "lib/popup-bridge",
                format: "umd",
                name: "msalPopupBridge",
                banner: fileHeader,
                inlineDynamicImports: true,
                sourcemap: true,
                entryFileNames: "msal-popup-bridge.js",
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
                    outDir: "lib/popup-bridge/types",
                    declaration: false,
                    declarationMap: false,
                },
            }),
        ],
    },
    {
        // Popup Bridge - UMD minified build
        input: "src/popup_bridge/index.ts",
        output: [
            {
                dir: "lib/popup-bridge",
                format: "umd",
                name: "msalPopupBridge",
                entryFileNames: "msal-popup-bridge.min.js",
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
                tsconfig: "tsconfig.rollup-bridge.build.json",
                sourceMap: false,
                compilerOptions: {
                    outDir: "lib/popup-bridge/types",
                    declaration: false,
                    declarationMap: false,
                },
            }),
            terser({
                output: {
                    preamble: libraryHeader,
                    comments: false,
                },
            }),
        ],
    },
];

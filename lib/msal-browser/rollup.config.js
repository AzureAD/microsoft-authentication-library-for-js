/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import pkg from "./package.json";
import { createCjsTypeShims, createPackageJson, loggerMinifyPlugin } from "rollup-msal";
import path from "path";

const libraryHeader = `/*! ${pkg.name} v${pkg.version} ${
    new Date().toISOString().split("T")[0]
} */`;
const useStrictHeader = "'use strict';";
const fileHeader = `${libraryHeader}\n${useStrictHeader}`;
const minifyLogs = process.env.MSAL_MINIFY_LOGS !== 'false';

export default [
    {
        // Main SDK + subpath exports - ES build
        input: [
            "src/index.ts",
            "src/custom_auth/index.ts",
            "src/redirect_bridge/index.ts",
        ],
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
                compilerOptions: {
                    declaration: false,
                    declarationMap: false,
                },
            }),
            createCjsTypeShims({
                packageRoot: __dirname,
                shims: [
                    {
                        filePath: path.join("types", "index.d.cts"),
                        target: "./index.js",
                    },
                    {
                        filePath: path.join("types", "custom_auth", "index.d.cts"),
                        target: "./index.js",
                    },
                    {
                        filePath: path.join("types", "redirect_bridge", "index.d.cts"),
                        target: "./index.js",
                    },
                ],
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
                compilerOptions: {
                    outDir: "lib/types",
                    declaration: false,
                    declarationMap: false,
                },
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
                compilerOptions: { outDir: "lib/custom-auth-path/types", declaration: false, declarationMap: false },
            }),
            ...(minifyLogs === true ? [loggerMinifyPlugin({
                outputFile: path.resolve(__dirname, "./lib/custom-auth-path/log-strings-mapping.json"),
                packageJsonPath: path.resolve(__dirname, "./package.json"),
                verbose: true
            })] : []),
        ],
    },
    {
        // Redirect Bridge - CommonJS build
        input: "src/redirect_bridge/index.ts",
        output: {
            dir: "lib/redirect-bridge",
            format: "cjs",
            banner: fileHeader,
            sourcemap: true,
            entryFileNames: "msal-redirect-bridge.cjs",
            inlineDynamicImports: true,
        },
        plugins: [
            nodeResolve({
                browser: true,
                resolveOnly: ["@azure/msal-common", "tslib"],
            }),
            typescript({
                typescript: require("typescript"),
                tsconfig: "tsconfig.redirect-bridge.build.json",
                sourceMap: true,
                compilerOptions: { outDir: "lib/redirect-bridge/types", declaration: false, declarationMap: false },
            }),
        ],
    },
    {
        // Redirect Bridge - UMD build
        input: "src/redirect_bridge/index.ts",
        output: [
            {
                dir: "lib/redirect-bridge",
                format: "umd",
                name: "msalRedirectBridge",
                banner: fileHeader,
                inlineDynamicImports: true,
                sourcemap: true,
                entryFileNames: "msal-redirect-bridge.js",
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
                    outDir: "lib/redirect-bridge/types",
                    declaration: false,
                    declarationMap: false,
                },
            }),
        ],
    },
    {
        // Redirect Bridge - UMD minified build
        input: "src/redirect_bridge/index.ts",
        output: [
            {
                dir: "lib/redirect-bridge",
                format: "umd",
                name: "msalRedirectBridge",
                entryFileNames: "msal-redirect-bridge.min.js",
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
                tsconfig: "tsconfig.redirect-bridge.build.json",
                sourceMap: false,
                compilerOptions: {
                    outDir: "lib/redirect-bridge/types",
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

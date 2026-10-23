/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import fs from "fs";
import path from "path";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import pkg from "./package.json";
import { createPackageJson } from "rollup-msal";

const createDeclarationEntrypoints = ({ packageRoot }) => ({
    name: "createDeclarationEntrypoints",
    writeBundle: () => {
        const typesRoot = path.join(packageRoot, "types");
        fs.mkdirSync(typesRoot, { recursive: true });
        fs.writeFileSync(
            path.join(typesRoot, "package.json"),
            JSON.stringify({ type: "commonjs" })
        );
        fs.writeFileSync(
            path.join(typesRoot, "index.d.mts"),
            'export * from "./index.js";\n',
            "utf8"
        );
    },
});

const libraryHeader = `/*! ${pkg.name} v${pkg.version} ${
    new Date().toISOString().split("T")[0]
} */`;
const useStrictHeader = "'use strict';";
const fileHeader = `${libraryHeader}\n${useStrictHeader}`;

export default [{
    input: "src/index.ts",
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
        propertyReadSideEffects: false,
    },
    external: [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {})
    ],
    plugins: [
        typescript({
            tsconfig: "tsconfig.build.json"
        }),
        createDeclarationEntrypoints({
            packageRoot: __dirname,
        }),
        nodeResolve({
            preferBuiltins: true
        }),
    ],
}, 
{
    input: "src/index.ts",
    output: {
            dir: "lib",
            format: "cjs",
            entryFileNames: "msal-node.cjs",
            banner: fileHeader,
            sourcemap: true,
    },
    treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
    },
    external: [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
    ],
    plugins: [
        typescript({
            tsconfig: "tsconfig.build.json",
            compilerOptions: {
                outDir: "lib/types"
            }
        }),
        nodeResolve({ preferBuiltins: true }),
        createPackageJson({libPath: __dirname})
    ],
}
];

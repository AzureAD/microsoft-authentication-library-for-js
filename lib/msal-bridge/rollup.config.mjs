import typescript from "@rollup/plugin-typescript";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(
    readFileSync(new URL("./package.json", import.meta.url), "utf8")
);
const banner = `/*! ${pkg.name} v${pkg.version} */`;
const plugins = () => [
    typescript({
        tsconfig: "./tsconfig.json",
        declaration: false,
        declarationMap: false,
        outDir: "dist",
    }),
];

export default [
    {
        input: { index: "src/index.ts", autoInstall: "src/autoInstall.ts" },
        output: {
            dir: "dist",
            format: "es",
            entryFileNames: "[name].mjs",
            banner,
            sourcemap: true,
        },
        plugins: plugins(),
    },
    {
        input: "src/index.ts",
        output: {
            file: "dist/index.cjs",
            format: "cjs",
            exports: "named",
            banner,
            sourcemap: true,
        },
        plugins: plugins(),
    },
    {
        input: "src/autoInstall.ts",
        output: {
            file: "dist/msal-bridge.js",
            format: "iife",
            name: "NestedAppAuthBridge",
            exports: "named",
            banner,
            sourcemap: true,
        },
        plugins: plugins(),
    },
];

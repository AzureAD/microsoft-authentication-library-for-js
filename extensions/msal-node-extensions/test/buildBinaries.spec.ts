/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as fs from "fs";
import * as path from "path";
import * as vm from "vm";

const scriptDirectory = path.join(__dirname, "..", "scripts");
const script = fs.readFileSync(
    path.join(scriptDirectory, "buildBinaries.cjs"),
    "utf8"
);

function runBuild(platform: string, compile = jest.fn()) {
    const copyFileSync = jest.fn();
    const run = () =>
        vm.runInNewContext(`(function () { ${script} })()`, {
            __dirname: scriptDirectory,
            console: { log: jest.fn() },
            require: (name: string) => {
                switch (name) {
                    case "process":
                        return { platform };
                    case "fs":
                        return {
                            existsSync: () => true,
                            copyFileSync,
                            rmSync: jest.fn(),
                        };
                    case "path":
                        return path;
                    case "child_process":
                        return { execSync: compile };
                    default:
                        throw new Error(`Unexpected dependency: ${name}`);
                }
            },
        });
    return { run, compile, copyFileSync };
}

describe("Native binary production", () => {
    it("builds and copies every shipped architecture against x86-capable headers", () => {
        const { run, compile, copyFileSync } = runBuild("win32");
        run();
        expect(compile.mock.calls.map(([command]) => command)).toEqual([
            "npm run compile -- --arch=x64 --target=22.23.5",
            "npm run compile -- --arch=ia32 --target=22.23.5",
            "npm run compile -- --arch=arm64 --target=22.23.5",
        ]);
        expect(
            copyFileSync.mock.calls.map(([, destination]) => destination)
        ).toEqual(
            ["x64", "ia32", "arm64"].map((arch) =>
                path.join(scriptDirectory, "..", "bin", arch, "dpapi.node")
            )
        );
    });

    it("fails rather than omitting a binary when compilation fails", () => {
        const error = new Error("Compilation failed");
        const { run, copyFileSync } = runBuild(
            "win32",
            jest.fn(() => {
                throw error;
            })
        );
        expect(run).toThrow(error);
        expect(copyFileSync).not.toHaveBeenCalled();
    });

    it("does not compile Windows binaries on other platforms", () => {
        const { run, compile, copyFileSync } = runBuild("linux");
        run();
        expect(compile).not.toHaveBeenCalled();
        expect(copyFileSync).not.toHaveBeenCalled();
    });
});

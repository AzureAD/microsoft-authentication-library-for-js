/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { fork } from "child_process";
import { promises as fs } from "fs";
import { FileSystemUtils } from "../util/FileSystemUtils";

describe('Test cache lock performance', () => {

    const cacheFilePath = "./test_file.json";

    afterEach(async () => {
        await FileSystemUtils.cleanUpFile(cacheFilePath);
        await FileSystemUtils.cleanUpFile(cacheFilePath + ".lockfile");
    });

    test('test cache normal workload', async () => {
        const numProcesses = 4;
        const retryNumber = 100;
        const retryDelay = 100;

        await runMultipleProcesses(numProcesses, cacheFilePath, retryNumber, retryDelay);
        const correctlyFormatted = await fileCorrectlyFormatted(cacheFilePath, numProcesses * 2);
        expect(correctlyFormatted).toBe(true);
    });
});

async function runMultipleProcesses(numProcesses, cacheLocation, retryNumber, retryDelay): Promise<void> {

    const options = [cacheLocation, retryNumber.toString(), retryDelay.toString()];
    let count = 0;
    for (let i = 0; i < numProcesses; i++) {
        const proc = fork("./test/performance-test/LockAndWriteToStorageScript.js", options);
        proc.on('exit', (code) => {
            count++;
        });
    }

    while(count < numProcesses){
        await sleep(100);
    }
}

async function fileCorrectlyFormatted(filePath: string, expectedCount: number): Promise<boolean> {
    const fd = await fs.readFile(filePath);

    let prevProcessId = null;
    let count = 0;
    const lines = fd.toString().split("\n").slice(0, -1); // last will be empty
    for (let line of lines) {
        count++;
        const pieces = line.split(" ");
        if (pieces.length !== 2) {
            return false;
        }
        if (prevProcessId != null) {
            if (pieces[0] !== ">") {
                return false;
            }
            if (pieces[1] != prevProcessId) {
                return false;
            }
            prevProcessId = null;
        } else {
            if (pieces[0] !== "<") {
                return false;
            }
            prevProcessId = pieces[1];
        }
    }

    return expectedCount === count;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

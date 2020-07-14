/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const process = require("process");
const extensions = require("../../dist/index");

async function writeToCache(fileName, retryNumber, retryDelay) {
    const persistence = await extensions.FilePersistence.create(fileName);

    const lockOptions = {
        retryNumber,
        retryDelay
    };
    const plugin = new extensions.PersistenceCachePlugin(persistence, lockOptions);
    await plugin.writeToStorage(async (diskState) => {
        const processId = process.pid.toString();
        let data = diskState;
        if(!diskState || diskState.length === 0){
            data = "";
        }
        data = data + "< " + processId + "\n";
        await sleep(100);
        data = data + "> " + processId + "\n";
        return data;
    })
}

function sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

// Expect: node_path, path_to_file, filename, retryNumber, retryDelay
if (process.argv.length < 5) {
    process.exit(1)
}

writeToCache(process.argv[2], Number(process.argv[3]), Number(process.argv[4])).then(() => {
        process.exit(0);
    }
);

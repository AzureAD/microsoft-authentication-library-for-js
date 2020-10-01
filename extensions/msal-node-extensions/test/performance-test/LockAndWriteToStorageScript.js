/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const process = require("process");
const extensions = require("../../dist/index");
const fs = require("fs");
const path = require("path");

// Expect: node_path, path_to_file, filename, retryNumber, retryDelay
if (process.argv.length < 5) {
    process.exit(1)
}

async function writeToCache(fileName, retryNumber, retryDelay) {

    const logFileName = `./test/test-logs/${process.pid}-log.txt`;
    await createDirectory(logFileName);
    const logger = fs.createWriteStream(logFileName, {
        flags: 'a'
    });
    const loggerOptions = {
        loggerCallback(loglevel, message, containsPii) {
            logger.write(`${message}\n`);
        },
        piiLoggingEnabled: false,
    }
    const persistence = await extensions.FilePersistence.create(fileName, loggerOptions);

    const lockOptions = {
        retryNumber,
        retryDelay
    };
    const plugin = new extensions.PersistenceCachePlugin(persistence, lockOptions);
    await plugin.writeToStorage(async (diskState) => {
        const processId = process.pid.toString();
        let data = diskState;
        if (!diskState || diskState.length === 0) {
            data = "";
        }
        data = data + "< " + processId + "\n";
        await sleep(100);
        data = data + "> " + processId + "\n";
        return data;
    }).then(() => logger.end())
}

// Logs from each process get written to this directory
async function createDirectory(logFileName) {
    try {
        await fs.promises.mkdir(path.dirname(logFileName), { recursive: true });
    } catch (err) {
        if (err.code == "EEXIST") {
            // Do nothing, since the directory already exists
        } else {
            throw err;
        }
    }
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

writeToCache(process.argv[2], Number(process.argv[3]), Number(process.argv[4])).then(() => {
    process.exit(0);
});

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const process = require("process");
const extensions = require("../../dist/index");
const fs = require("fs");
const path = require("path");
const msalCommon = require("@azure/msal-common");

// Expect: node_path, path_to_file, filename, retryNumber, retryDelay
if (process.argv.length < 5) {
    process.exit(1)
}

let fileData;
const serializableCache = {
    serialize: () => {
        return fileData;
    },
    deserialize: (data) => {
        if (!data || data.length === 0) {
            data = "";
        }
        fileData = data;
    }
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
    const context = new msalCommon.TokenCacheContext(serializableCache, true);
    try {
        await plugin.beforeCacheAccess(context);

        const processId = process.pid.toString();
        let data = fileData + "< " + processId + "\n";
        await sleep(100);
        fileData = data + "> " + processId + "\n";
    } finally {
        await plugin.afterCacheAccess(context, true);
        () => logger.end();
    }
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

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CrossPlatformLock } from "../../src/lock/CrossPlatformLock";
import { Logger } from "@azure/msal-common";
import { promises as fs } from "fs";
import { Constants } from "../../src/utils/Constants";
import { FileSystemUtils } from "../util/FileSystemUtils";

describe('Test cross platform lock', () => {

    const loggerOptions = {
        loggerCallback: () => {
        },
        piiLoggingEnabled: false
    };
    const logger = new Logger(loggerOptions);
    const lockFilePath = "./test.lockfile";

    afterEach(async () => {
        await FileSystemUtils.cleanUpFile(lockFilePath);
    });

    test('export a class', () => {
        const lock = new CrossPlatformLock(lockFilePath, logger);
        expect(lock).toBeInstanceOf(CrossPlatformLock);
    });

    test('locks then unlocks by creating then deleting lockfile', async () => {
        const lock = new CrossPlatformLock(lockFilePath, logger);
        await lock.lock();

        // if lockfile not created, then fs.access throws and test fails
        await fs.access(lockFilePath);

        // deletes lockfile
        await lock.unlock();
        try {
            await fs.access(lockFilePath);
        } catch (error) {
            expect(error.code).toEqual(Constants.ENOENT_ERROR.toString());
            return;
        }
        // If error was not caught, lockfile was not deleted, and therefore we should throw
        throw Error("Lockfile not deleted");
    });

    test('Tries to acquire a lock when .lockfile is present and fails', async () => {
        const fd = await fs.open(lockFilePath, "wx+");

        const lockOptions = {
            retryNumber: 10,
            retryDelay: 10
        };

        const lock = new CrossPlatformLock(lockFilePath, logger, lockOptions);
        try {
            await lock.lock();
        } catch (error) {
            expect(error.errorCode).toEqual("CrossPlatformLockError");
            return;
        } finally {
            await fd.close();
        }

        throw Error("Able to acquire lock");
    });

    test('Tries to acquire a lock when .lockfile is present and succeeds', async () => {
        // try to acquire lock for 10 times at 500 millisecond interval
        const lockOptions = {
            retryNumber: 10,
            retryDelay: 500
        };

        const lock = new CrossPlatformLock(lockFilePath, logger, lockOptions);

        // mock other process having lock, then releasing after 2 seconds
        const fileHandle = await fs.open(lockFilePath, "wx+");
        setTimeout(async () => {
            await fs.unlink(lockFilePath);
            await fileHandle.close();
        }, 2000);

        // expect lockfile to be present
        await expect(async () => await lock.lock()).not.toThrow();
        await expect(async () => await fs.access(lockFilePath)).not.toThrow();
    });
});

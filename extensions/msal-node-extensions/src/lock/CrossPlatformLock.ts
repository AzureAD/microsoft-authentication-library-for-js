/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { promises as fs } from "fs";
import { pid } from "process";
import { CrossPlatformLockOptions } from "./CrossPlatformLockOptions.js";
import { Constants } from "../utils/Constants.js";
import { PersistenceError } from "../error/PersistenceError.js";
import { Logger } from "@azure/msal-common/node";
import { isNodeError } from "../utils/TypeGuards.js";

/**
 * Cross-process lock that works on all platforms.
 */
export class CrossPlatformLock {
    private readonly lockFilePath: string;
    private lockFileHandle: fs.FileHandle | undefined;
    private readonly retryNumber: number;
    private readonly retryDelay: number;

    private logger: Logger;

    constructor(
        lockFilePath: string,
        logger: Logger,
        lockOptions?: CrossPlatformLockOptions
    ) {
        this.lockFilePath = lockFilePath;
        this.retryNumber = lockOptions ? lockOptions.retryNumber : 500;
        this.retryDelay = lockOptions ? lockOptions.retryDelay : 100;
        this.logger = logger;
    }

    /**
     * Locks cache from read or writes by creating file with same path and name as
     * cache file but with .lockfile extension. If another process has already created
     * the lockfile, will back off and retry based on configuration settings set by CrossPlatformLockOptions
     */
    public async lock(): Promise<void> {
        for (let tryCount = 0; tryCount < this.retryNumber; tryCount++) {
            try {
                this.logger.info(`Pid ${pid} trying to acquire lock`);
                this.lockFileHandle = await fs.open(this.lockFilePath, "wx+");

                this.logger.info(`Pid ${pid} acquired lock`);
                await this.lockFileHandle.write(pid.toString());
                return;
            } catch (err) {
                if (isNodeError(err)) {
                    if (
                        err.code === Constants.EEXIST_ERROR ||
                        err.code === Constants.EPERM_ERROR
                    ) {
                        this.logger.info(err.message);
                        await this.sleep(this.retryDelay);
                    } else {
                        this.logger.error(
                            `${pid} was not able to acquire lock. Ran into error: ${err.message}`
                        );
                        throw PersistenceError.createCrossPlatformLockError(
                            err.message
                        );
                    }
                } else {
                    throw err;
                }
            }
        }
        this.logger.error(
            `${pid} was not able to acquire lock. Exceeded amount of retries set in the options`
        );
        throw PersistenceError.createCrossPlatformLockError(
            "Not able to acquire lock. Exceeded amount of retries set in options"
        );
    }

    /**
     * unlocks cache file by deleting .lockfile.
     */
    public async unlock(): Promise<void> {
        try {
            if (this.lockFileHandle) {
                // if we have a file handle to the .lockfile, delete lock file
                await fs.unlink(this.lockFilePath);
                await this.lockFileHandle.close();
                this.logger.info("lockfile deleted");
            } else {
                this.logger.warning(
                    "lockfile handle does not exist, so lockfile could not be deleted"
                );
            }
        } catch (err) {
            if (isNodeError(err)) {
                if (err.code === Constants.ENOENT_ERROR) {
                    this.logger.info(
                        "Tried to unlock but lockfile does not exist"
                    );
                } else {
                    this.logger.error(
                        `${pid} was not able to release lock. Ran into error: ${err.message}`
                    );
                    throw PersistenceError.createCrossPlatformLockError(
                        err.message
                    );
                }
            } else {
                throw err;
            }
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}

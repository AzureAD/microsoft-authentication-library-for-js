/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { promises as fs } from "fs"
import { pid } from "process";
import { CrossPlatformLockOptions } from "./CrossPlatformLockOptions";
import { Constants } from "../utils/Constants";
import { PersistenceError } from "../error/PersistenceError";

/**
 * Cross-process lock that works on all platforms.
 */
export class CrossPlatformLock {

    private readonly lockFilePath: string;
    private lockFileDescriptor: number;
    private readonly retryNumber: number;
    private readonly retryDelay: number;

    constructor(lockFilePath:string, lockOptions?: CrossPlatformLockOptions) {
        this.lockFilePath = lockFilePath;
        this.retryNumber = lockOptions ? lockOptions.retryNumber : 500;
        this.retryDelay = lockOptions ? lockOptions.retryDelay : 100;
    }

    /**
     * Locks cache from read or writes by creating file with same path and name as
     * cache file but with .lockfile extension. If another process has already created
     * the lockfile, will retry again based on configuration settings set by CrossPlatformLockOptions
     */
    public async lock(): Promise<void> {
        const processId = pid.toString();
        for (let tryCount = 0; tryCount < this.retryNumber; tryCount++)
            try {
                console.log("Pid " + pid + " trying to acquire lock");
                this.lockFileDescriptor = await fs.open(this.lockFilePath, "wx+");

                console.log("Pid " + pid + " acquired lock");
                await fs.write(this.lockFileDescriptor, processId);
                break;
            } catch (err) {
                if (err.code == Constants.EEXIST_ERROR) {
                    console.log(err);
                    await this.sleep(this.retryDelay);
                } else {
                    throw PersistenceError.createCrossPlatformLockError(err.code, err.message);
                }
            }
    }

    /**
     * unlocks cache file by deleting .lockfile.
     */
    public async unlock(): Promise<void> {
        try {
            // delete lock file
            await fs.unlink(this.lockFilePath);
            await fs.close(this.lockFileDescriptor);
        } catch(err){
            if(err.code == Constants.ENOENT_ERROR){
                console.log("Lockfile does not exist");
            } else {
                throw PersistenceError.createCrossPlatformLockError(err.code, err.message);
            }
        }
    }

    private sleep(ms): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}

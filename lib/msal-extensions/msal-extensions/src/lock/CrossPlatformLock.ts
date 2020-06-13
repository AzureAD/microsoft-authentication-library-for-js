/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { openSync, closeSync, writeSync, unlinkSync } from "fs";
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

    public async lock(): Promise<void> {
        const processId = pid.toString();
        for (let tryCount = 0; tryCount < this.retryNumber; tryCount++)
            try {
                console.log("Pid " + pid + " trying to acquire lock");
                // https://nodejs.org/api/fs.html#fs_file_system_flags
                this.lockFileDescriptor = openSync(this.lockFilePath, "wx+");
                console.log("Pid " + pid + " acquired lock");
                writeSync(this.lockFileDescriptor, processId);
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

    public unlock(): void {
        try {
            unlinkSync(this.lockFilePath);
            closeSync(this.lockFileDescriptor);
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

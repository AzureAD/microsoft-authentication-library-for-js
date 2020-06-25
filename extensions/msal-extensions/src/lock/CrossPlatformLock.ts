/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { open, close, write, unlink } from "fs";
import { promisify } from "util";
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
                const openPromise = promisify(open);
                this.lockFileDescriptor = await openPromise(this.lockFilePath, "wx+");
                console.log("Pid " + pid + " acquired lock");
                const writePromise = promisify(write);
                await writePromise(this.lockFileDescriptor, processId);
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

    public async unlock(): Promise<void> {
        try {
            // delete lock file
            const unlinkPromise = promisify(unlink);
            await unlinkPromise(this.lockFilePath);
            const closePromise = promisify(close);
            await closePromise(this.lockFileDescriptor);
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

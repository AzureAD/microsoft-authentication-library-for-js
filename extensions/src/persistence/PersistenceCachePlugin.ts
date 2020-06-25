/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IPersistence } from "../persistence/IPersistence";
import { CrossPlatformLock } from "../lock/CrossPlatformLock";
import { CrossPlatformLockOptions } from "../lock/CrossPlatformLockOptions";
import { pid } from "process";

/**
 * MSAL cache plugin which enables callers to write the MSAL cache to disk on Windows,
 * macOs, and Linux.
 *
 * - Persistence can be one of:
 * - FilePersistence: Writes and reads from an unencrypted file. Can be used on Windows,
 * macOs, or Linux.
 * - FilePersistenceWithDataProtection: Used on Windows, writes and reads from file encrypted
 * with windows dpapi.
 * - KeychainPersistence: Used on macOs, writes and reads from keychain.
 * - LibSecretPersistence: Used on linux, writes and reads from secret service API. Requires
 * libsecret be installed.
 */
export class PersistenceCachePlugin {

    public persistence: IPersistence;
    public lastSync: number;
    public currentCache: string;
    public lockFilePath: string;

    private crossPlatformLock: CrossPlatformLock;
    private readonly lockOptions: CrossPlatformLockOptions;

    constructor(persistence: IPersistence, lockOptions?: CrossPlatformLockOptions) {
        this.persistence = persistence;
        this.lockFilePath = `${this.persistence.getFilePath()}.lockfile`;
        this.lastSync = 0;
        this.currentCache = null;
        this.lockOptions = lockOptions;
    }

    /**
     * Reads from storage and avoids saves an in memory copy. If persistence has not been updated
     * since last time data was read, in memory copy is used.
     */
    public async readFromStorage(): Promise<string> {
        console.log("Reading from storage");
        if (await this.persistence.reloadNecessary(this.lastSync) || this.currentCache == null) {
            try {
                console.log("Reload necessary.  Last sync time: " + this.lastSync);
                this.crossPlatformLock = new CrossPlatformLock(this.lockFilePath, this.lockOptions);
                await this.crossPlatformLock.lock();

                this.currentCache = await this.persistence.load();
                this.lastSync = new Date().getTime();
                console.log("Last sync time updated to: ", this.lastSync);
            } finally {
                await this.crossPlatformLock.unlock();
                delete this.crossPlatformLock;
                console.log("Pid " + pid + " Released lock");
            }
        }
        return this.currentCache;
    }

    /**
     * Writes to storage. If persistence has not been updated since last time data was read,
     * reads and latest state from persistence, sends state via callback, and updates in memory copy.
     */
    public async writeToStorage(callback: (diskState: string) => string): Promise<void> {
        try {
            console.log("Writing to storage");
            this.crossPlatformLock = new CrossPlatformLock(this.lockFilePath, this.lockOptions);
            await this.crossPlatformLock.lock();

            if(await this.persistence.reloadNecessary(this.lastSync)){
                console.log("Reload necessary.  Last sync time: " + this.lastSync);
                this.currentCache = await this.persistence.load();
                this.lastSync = new Date().getTime();
                console.log("Last sync time updated to: ", this.lastSync);
            }

            this.currentCache = await callback(this.currentCache);
            await this.persistence.save(this.currentCache);
        } finally {
            await this.crossPlatformLock.unlock();
            console.log("Pid " + pid + " Released lock");
        }
    }
}

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IPersistence } from "../persistence/IPersistence";
import { CrossPlatformLock } from "../lock/CrossPlatformLock";
import { CrossPlatformLockOptions } from "../lock/CrossPlatformLockOptions";
import { pid } from "process";
import { Logger } from "@azure/msal-common";

/**
 * MSAL cache plugin which enables callers to write the MSAL cache to disk on Windows,
 * macOs, and Linux.
 *
 * - Persistence can be one of:
 * - FilePersistence: Writes and reads from an unencrypted file. Can be used on Windows,
 * macOs, or Linux.
 * - FilePersistenceWithDataProtection: Used on Windows, writes and reads from file encrypted
 * with windows dpapi-addon.
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

    private logger: Logger;

    constructor(persistence: IPersistence, lockOptions?: CrossPlatformLockOptions) {
        this.persistence = persistence;

        // initialize logger
        this.logger = persistence.getLogger();

        // create file lock
        this.lockFilePath = `${this.persistence.getFilePath()}.lockfile`;
        this.crossPlatformLock = new CrossPlatformLock(this.lockFilePath, this.logger, lockOptions);

        // initialize default values
        this.lastSync = 0;
        this.currentCache = null;
    }

    /**
     * Reads from storage and avoids saves an in memory copy. If persistence has not been updated
     * since last time data was read, in memory copy is used.
     */
    public async readFromStorage(): Promise<string> {
        this.logger.info("Reading from storage");
        if (await this.persistence.reloadNecessary(this.lastSync) || this.currentCache == null) {
            try {
                this.logger.info(`Reload necessary. Last sync time: ${this.lastSync}`);
                await this.crossPlatformLock.lock();

                this.currentCache = await this.persistence.load();
                this.lastSync = new Date().getTime();
                this.logger.info(`Last sync time updated to: ${this.lastSync}`);
            } finally {
                await this.crossPlatformLock.unlock();
                this.logger.info(`Pid ${pid} Released lock`);
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
            this.logger.info("Writing to storage");
            await this.crossPlatformLock.lock();

            if (await this.persistence.reloadNecessary(this.lastSync)) {
                this.logger.info(`Reload necessary. Last sync time: ${this.lastSync}`);
                this.currentCache = await this.persistence.load();
                this.lastSync = new Date().getTime();
                this.logger.info(`Last sync time updated to: ${this.lastSync}`);
            }

            this.currentCache = await callback(this.currentCache);
            await this.persistence.save(this.currentCache);
        } finally {
            await this.crossPlatformLock.unlock();
            this.logger.info(`Pid ${pid} Released lock`);
        }
    }
}

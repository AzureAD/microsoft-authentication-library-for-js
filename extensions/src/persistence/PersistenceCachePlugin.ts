/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IPersistence } from "../persistence/IPersistence";
import { CrossPlatformLock } from "../lock/CrossPlatformLock";
import { CrossPlatformLockOptions } from "../lock/CrossPlatformLockOptions";
import { pid } from "process";
import { Logger } from "@azure/msal-common";

export class PersistenceCachePlugin {

    public persistence: IPersistence;
    public lastSync: number;
    public currentCache: string;
    public lockFilePath: string;

    private crossPlatformLock: CrossPlatformLock;
    private readonly lockOptions: CrossPlatformLockOptions;

    private logger: Logger;

    constructor(persistence: IPersistence, lockOptions?: CrossPlatformLockOptions) {
        this.persistence = persistence;
        this.lockFilePath = `${this.persistence.getFilePath()}.lockfile`;

        // initialize default values
        this.lastSync = 0;
        this.currentCache = null;
        this.lockOptions = lockOptions;

        // initialize logger
        this.logger = persistence.getLogger();
    }

    public async readFromStorage(): Promise<string> {
        this.logger.info("Reading from storage");
        if (await this.persistence.reloadNecessary(this.lastSync) || this.currentCache == null) {
            try {
                this.logger.info(`Reload necessary. Last sync time: ${this.lastSync}`);
                this.crossPlatformLock = new CrossPlatformLock(this.lockFilePath, this.logger, this.lockOptions);
                await this.crossPlatformLock.lock();

                this.currentCache = await this.persistence.load();
                this.lastSync = new Date().getTime();
                this.logger.info(`Last sync time updated to: ${this.lastSync}`);
            } finally {
                await this.crossPlatformLock.unlock();
                delete this.crossPlatformLock;
                this.logger.info(`Pid ${pid} Released lock`);
            }
        }
        return this.currentCache;
    }

    public async writeToStorage(callback: (diskState: string) => string): Promise<void> {
        try {
            this.logger.info("Writing to storage");
            this.crossPlatformLock = new CrossPlatformLock(this.lockFilePath, this.logger, this.lockOptions);
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

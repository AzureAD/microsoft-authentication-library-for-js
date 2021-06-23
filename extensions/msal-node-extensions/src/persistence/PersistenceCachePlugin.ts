/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IPersistence } from "./IPersistence";
import { CrossPlatformLock } from "../lock/CrossPlatformLock";
import { CrossPlatformLockOptions } from "../lock/CrossPlatformLockOptions";
import { pid } from "process";
import { TokenCacheContext, ICachePlugin, Logger } from "@azure/msal-common";

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
export class PersistenceCachePlugin implements ICachePlugin {

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
     * Reads from storage and saves an in-memory copy. If persistence has not been updated
     * since last time data was read, in memory copy is used.
     *
     * If cacheContext.cacheHasChanged === true, then file lock is created and not deleted until
     * afterCacheAccess() is called, to prevent the cache file from changing in between
     * beforeCacheAccess() and afterCacheAccess().
     */
    public async beforeCacheAccess(cacheContext: TokenCacheContext): Promise<void> {
        this.logger.info("Executing before cache access");
        const reloadNecessary = await this.persistence.reloadNecessary(this.lastSync);
        if (!reloadNecessary && this.currentCache !== null) {
            if (cacheContext.cacheHasChanged) {
                this.logger.verbose("Cache context has changed");
                await this.crossPlatformLock.lock();
            }
            return;
        }
        try {
            this.logger.info(`Reload necessary. Last sync time: ${this.lastSync}`);
            await this.crossPlatformLock.lock();

            this.currentCache = await this.persistence.load();
            this.lastSync = new Date().getTime();
            cacheContext.tokenCache.deserialize(this.currentCache);

            this.logger.info(`Last sync time updated to: ${this.lastSync}`);
        } finally {
            if (!cacheContext.cacheHasChanged) {
                await this.crossPlatformLock.unlock();
                this.logger.info(`Pid ${pid} released lock`);
            } else {
                this.logger.info(`Pid ${pid} beforeCacheAccess did not release lock`);
            }
        }
    }

    /**
     * Writes to storage if MSAL in memory copy of cache has been changed.
     */
    public async afterCacheAccess(cacheContext: TokenCacheContext): Promise<void> {
        this.logger.info("Executing after cache access");
        try {
            if (cacheContext.cacheHasChanged) {
                this.logger.info("Msal in-memory cache has changed. Writing changes to persistence");
                this.currentCache = cacheContext.tokenCache.serialize();
                await this.persistence.save(this.currentCache);
            } else {
                this.logger.info("Msal in-memory cache has not changed. Did not write to persistence");
            }
        } finally {
            await this.crossPlatformLock.unlock();
            this.logger.info(`Pid ${pid} afterCacheAccess released lock`);
        }
    }
}

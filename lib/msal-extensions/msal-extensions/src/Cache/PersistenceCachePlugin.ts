/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { pid } from "process";
import { IPersistence } from "Persistence/IPersistence";
import { lock } from "proper-lockfile";

export class PersistenceCachePlugin {

    public persistence: IPersistence;
    public lastSync: number;
    public currentCache: string;

    constructor(persistence: IPersistence) {
        this.persistence = persistence;
        this.lastSync = 0;
        this.currentCache = null;
    }

    // Todo should we keep an in memory copy of cache?
    public async readFromStorage(): Promise<string> {
        // console.log("Node process id: " + pid );
        console.log("Reading from storage");
        if (await this.persistence.reloadNecessary(this.lastSync) || this.currentCache == null) {
            console.log("Reload necessary");
            try {
                const lockReleaseCallback = await lock(await this.persistence.getFilePath());
                console.log("Created read lock");
                this.currentCache = await this.persistence.load();
                this.lastSync = new Date().getTime();
                lockReleaseCallback();
                console.log("Released lock");
            } catch (error) {
                console.error(error);
                throw error;
            }
        }
        return this.currentCache;
    }

    public async writeToStorage(diskState: string): Promise<void> {
        try {
            console.log("Node process id: " + pid );
            const lockReleaseCallback = await lock(await this.persistence.getFilePath());
            console.log("Created lock");

            this.currentCache = diskState;
            this.lastSync = new Date().getTime();
            await this.persistence.save(this.currentCache);
            lockReleaseCallback();
            console.log("Released lock")
        } catch (error) {
            console.error(error);
            throw(error);
        }
    }
}

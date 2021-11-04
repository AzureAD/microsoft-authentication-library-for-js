/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrowserAuthError } from "../error/BrowserAuthError";
import { DBTableNames } from "../utils/BrowserConstants";
import { IAsyncStorage } from "./IAsyncMemoryStorage";

interface IDBOpenDBRequestEvent extends Event {
    target: IDBOpenDBRequest & EventTarget;
}

interface IDBOpenOnUpgradeNeededEvent extends IDBVersionChangeEvent {
    target: IDBOpenDBRequest & EventTarget;
}

interface IDBRequestEvent extends Event {
    target: IDBRequest & EventTarget;
}

export type DatabaseInfo = {
    name: string,
    version: number,
    tableNames: Array<DBTableNames>
};

/**
 * Storage wrapper for IndexedDB storage in browsers: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 */
export class DatabaseStorage<T> implements IAsyncStorage<T> {
    private db: IDBDatabase|undefined;
    private dbName: string;
    private tableName: string;
    private version: number;
    private dbOpen: boolean;

    constructor(dbInfo: DatabaseInfo, tableName: DBTableNames) {
        this.dbName = dbInfo.name;
        this.version = dbInfo.version;
        this.tableName = tableName;
        this.dbOpen = false;
    }

    /**
     * Opens IndexedDB instance.
     */
    async open(): Promise<void> {
        return new Promise((resolve, reject) => {
            const openDB = window.indexedDB.open(this.dbName, this.version);
            openDB.addEventListener("upgradeneeded", (e: IDBVersionChangeEvent) => {
                const event = e as IDBOpenOnUpgradeNeededEvent;
                Object.values(DBTableNames).forEach(tableName => {
                    event.target.result.createObjectStore(tableName);
                });
            });
            openDB.addEventListener("success", (e: Event) => {
                const event = e as IDBOpenDBRequestEvent;
                this.db = event.target.result;
                this.dbOpen = true;
                resolve();
            });
            openDB.addEventListener("error",  () => reject(BrowserAuthError.createDatabaseUnavailableError()));
        });
    }

    /**
     * Opens database if it's not already open
     */
    private async validateDbIsOpen(): Promise<void> {
        if (!this.dbOpen) {
            return await this.open();
        }
    }

    /**
     * Retrieves item from IndexedDB instance.
     * @param key 
     */
    async getItem(key: string): Promise<T | null> {
        await this.validateDbIsOpen();

        return new Promise<T>((resolve, reject) => {
            // TODO: Add timeouts?
            if (!this.db) {
                return reject(BrowserAuthError.createDatabaseNotOpenError());
            }
            const transaction = this.db.transaction([this.tableName], "readonly");
            const objectStore = transaction.objectStore(this.tableName);
            const dbGet = objectStore.get(key);
            dbGet.addEventListener("success", (e: Event) => {
                const event = e as IDBRequestEvent;
                resolve(event.target.result);
            });
            dbGet.addEventListener("error", (e) => reject(e));
        });
    }

    /**
     * Adds item to IndexedDB under given key
     * @param key 
     * @param payload 
     */
    async setItem(key: string, payload: T): Promise<void> {
        await this.validateDbIsOpen();

        return new Promise<void>((resolve: Function, reject: Function) => {
            // TODO: Add timeouts?
            if (!this.db) {
                return reject(BrowserAuthError.createDatabaseNotOpenError());
            }
            const transaction = this.db.transaction([this.tableName], "readwrite");

            const objectStore = transaction.objectStore(this.tableName);

            const dbPut = objectStore.put(payload, key);

            dbPut.addEventListener("success", () => resolve());
            dbPut.addEventListener("error", (e) => reject(e));
        });
    }

    /**
     * Removes item from IndexedDB under given key
     * @param key
     */
    async removeItem(key: string): Promise<void> {
        await this.validateDbIsOpen();

        return new Promise<void>((resolve: Function, reject: Function) => {
            if (!this.db) {
                return reject(BrowserAuthError.createDatabaseNotOpenError());
            }
            const transaction = this.db.transaction([this.tableName], "readwrite");
            const objectStore = transaction.objectStore(this.tableName);
            const dbDelete = objectStore.delete(key);
            dbDelete.addEventListener("success", () => resolve());
            dbDelete.addEventListener("error", (e) => reject(e));
        });
    }

    /**
     * Get all the keys from the storage object as an iterable array of strings.
     */
    async getKeys(): Promise<string[]> {
        await this.validateDbIsOpen();

        return new Promise<string[]>((resolve: Function, reject: Function) => {
            if (!this.db) {
                return reject(BrowserAuthError.createDatabaseNotOpenError());
            }

            const transaction = this.db.transaction([this.tableName], "readonly");
            const objectStore = transaction.objectStore(this.tableName);
            const dbGetKeys = objectStore.getAllKeys();
            dbGetKeys.addEventListener("success", (e: Event) => {
                const event = e as IDBRequestEvent;
                resolve(event.target.result);
            });
            dbGetKeys.addEventListener("error",  (e: Event) => reject(e));
        });
    }

    /**
     * 
     * Checks whether there is an object under the search key in the object store
     */
    async containsKey(key: string): Promise<boolean> {
        await this.validateDbIsOpen();

        return new Promise<boolean>((resolve: Function, reject: Function) => {
            if (!this.db) {
                return reject(BrowserAuthError.createDatabaseNotOpenError());
            }
            const transaction = this.db.transaction([this.tableName], "readonly");
            const objectStore = transaction.objectStore(this.tableName);
            const dbContainsKey = objectStore.count(key);
            dbContainsKey.addEventListener("success", (e: Event) => {
                const event = e as IDBRequestEvent;
                resolve(event.target.result === 1);
            });
            dbContainsKey.addEventListener("error", (e: Event) => reject(e));
        });
    }

    /**
     * Deletes the MSAL database. The database is deleted rather than cleared to make it possible
     * for client applications to downgrade to a previous MSAL version without worrying about forward compatibility issues
     * with IndexedDB database versions.
     */
    async deleteDatabase(): Promise<boolean> {
        return new Promise<boolean>((resolve: Function, reject: Function) => {
            const deleteDbRequest = window.indexedDB.deleteDatabase(this.dbName);
            deleteDbRequest.addEventListener("success", () => resolve(true));
            deleteDbRequest.addEventListener("error", () => reject(false));
        });
    }
}

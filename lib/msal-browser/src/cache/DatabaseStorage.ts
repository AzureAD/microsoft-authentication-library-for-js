/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrowserAuthError } from "../error/BrowserAuthError";
import { DBTableNames, DB_NAME, DB_VERSION } from "../utils/BrowserConstants";

interface IDBOpenDBRequestEvent extends Event {
    target: IDBOpenDBRequest & EventTarget;
}

interface IDBOpenOnUpgradeNeededEvent extends IDBVersionChangeEvent {
    target: IDBOpenDBRequest & EventTarget;
}

interface IDBRequestEvent extends Event {
    target: IDBRequest & EventTarget;
}

/**
 * Storage wrapper for IndexedDB storage in browsers: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 */
export class DatabaseStorage<T> {
    private db: IDBDatabase|undefined;
    private dbName: string;
    private tableName: string;
    private version: number;
    private dbOpen: boolean;

    constructor(tableName: string) {
        this.dbName = DB_NAME;
        this.version = DB_VERSION;
        this.tableName = tableName;
        this.dbOpen = false;
    }

    /**
     * Opens IndexedDB instance.
     */
    async open(): Promise<void> {
        return new Promise((resolve, reject) => {
            // TODO: Add timeouts?
            const openDB = window.indexedDB.open(this.dbName, this.version);

            openDB.addEventListener("upgradeneeded", (e: IDBVersionChangeEvent) => {
                this.upgradeDatabase(e as IDBOpenOnUpgradeNeededEvent);
            });

            openDB.addEventListener("success", (e: Event) => {
                const event = e as IDBOpenDBRequestEvent;
                this.db = event.target.result;
                this.dbOpen = true;
                resolve();
            });

            openDB.addEventListener("error", error => reject(error));
        });
    }

    /**
     * Upgrades the existing database by adding newly supported tables
     * and removing outdated tables
     */
    upgradeDatabase(event: IDBOpenOnUpgradeNeededEvent): void {
        const database = event.target.result;

        // List of tables supported in new DB version
        const supportedTables = Object.values(DBTableNames) as Array<string>;
        // List of tables in current (old) DB version
        const currentTables = Object.values(database.objectStoreNames);

        // Tables in old DB version that aren't supported anymore
        const outdatedTables = currentTables.filter((existingTableName: string) => {
            return supportedTables.indexOf(existingTableName) === -1;
        });

        // Tables in new DB version that weren't supported before
        const newTables = supportedTables.filter((supportedTable: string) => {
            return currentTables.indexOf(supportedTable) === -1;
        });

        // Add missing supported tables
        newTables.forEach((tableName: string) => {
            database.createObjectStore(tableName);
        });

        // Remove remaining outdated tables
        outdatedTables.forEach((tableName: string) => {
            database.deleteObjectStore(tableName);
        });

    }

    /**
     * Retrieves item from IndexedDB instance.
     * @param key 
     */
    async get(key: string): Promise<T> {
        if (!this.dbOpen) {
            await this.open();
        }

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
            dbGet.addEventListener("error", e => reject(e));
        });
    }

    /**
     * Adds item to IndexedDB under given key
     * @param key 
     * @param payload 
     */
    async put(key: string, payload: T): Promise<T> {
        if (!this.dbOpen) {
            await this.open();
        }

        return new Promise<T>((resolve: Function, reject: Function) => {
            // TODO: Add timeouts?
            if (!this.db) {
                return reject(BrowserAuthError.createDatabaseNotOpenError());
            }

            const transaction = this.db.transaction([this.tableName], "readwrite");

            const objectStore = transaction.objectStore(this.tableName);
            
            const dbPut = objectStore.put(payload, key);

            dbPut.addEventListener("success", (e: Event) => {
                const event = e as IDBRequestEvent;
                resolve(event.target.result);
            });
            dbPut.addEventListener("error", e => reject(e));
        });
    }

    /**
     * Removes item from IndexedDB under given key
     * @param key
     */
    async delete(key: string): Promise<boolean> {
        if (!this.dbOpen) {
            await this.open();
        }

        return new Promise<boolean>((resolve: Function, reject: Function) => {
            if (!this.db) {
                return reject(BrowserAuthError.createDatabaseNotOpenError());
            }

            const transaction = this.db.transaction([this.tableName], "readwrite");

            const objectStore = transaction.objectStore(this.tableName);

            const dbDelete = objectStore.delete(key);

            dbDelete.addEventListener("success", (e: Event) => {
                const event = e as IDBRequestEvent;
                resolve(event.target.result === undefined);
            });
            dbDelete.addEventListener("error", e => reject(e));
        });
    }

    async clear(): Promise<boolean> {
        if (!this.dbOpen) {
            await this.open();
        }

        return new Promise<boolean>((resolve: Function, reject: Function) => {
            const dataBase = this.db;

            if (!dataBase) {
                return reject(BrowserAuthError.createDatabaseNotOpenError());
            }

            const transaction = dataBase.transaction([this.tableName], "readwrite");

            const objectStore = transaction.objectStore(this.tableName);

            const dbDelete = objectStore.clear();

            dbDelete.addEventListener("success", (e: Event) => {
                const event = e as IDBRequestEvent;
                return resolve(event.target.result === undefined);
            });

            dbDelete.addEventListener("error", e =>{
                return reject(e);
            });
        });
    }
}

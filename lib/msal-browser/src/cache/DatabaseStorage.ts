/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrowserAuthError } from "../error/BrowserAuthError";

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
export class DatabaseStorage<T>{
    private db: IDBDatabase|undefined;
    private dbName: string;
    private tableName: string;
    private version: number;
    private dbOpen: boolean;

    constructor(dbName: string, tableName: string, version: number) {
        this.dbName = dbName;
        this.tableName = tableName;
        this.version = version;
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
                const event = e as IDBOpenOnUpgradeNeededEvent;
                event.target.result.createObjectStore(this.tableName);
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
            if (!this.db) {
                return reject(BrowserAuthError.createDatabaseNotOpenError());
            }

            const transaction = this.db.transaction([this.tableName], "readwrite");

            const objectStore = transaction.objectStore(this.tableName);

            const dbDelete = objectStore.clear();

            dbDelete.addEventListener("success", (e: Event) => {
                const event = e as IDBRequestEvent;
                resolve(event.target.result === undefined);
            });
            dbDelete.addEventListener("error", e => reject(e));
        });
    }
}

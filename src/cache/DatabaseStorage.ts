/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

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
    private _db : IDBDatabase;
    private _dbName: string;
    private _tableName: string;
    private _version: number;

    constructor(dbName: string, tableName: string, version: number) {
        this._dbName = dbName;
        this._tableName = tableName;
        this._version = version;
    }

    /**
     * Opens IndexedDB instance.
     */
    async open(): Promise<void> {
        return new Promise((resolve, reject) => {
            // TODO: Add timeouts?
            const openDB = window.indexedDB.open(this._dbName, this._version);
            openDB.addEventListener("upgradeneeded", (e: IDBOpenOnUpgradeNeededEvent) => {
                e.target.result.createObjectStore(this._tableName);
            });
            openDB.addEventListener("success", (e: IDBOpenDBRequestEvent) => {
                this._db = e.target.result;
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
        return new Promise((resolve, reject) => {
            // TODO: Add timeouts?
            const transaction = this._db.transaction([this._tableName], "readonly");

            const objectStore = transaction.objectStore(this._tableName);
            const dbGet = objectStore.get(key);
            dbGet.addEventListener("success", (e: IDBRequestEvent) => resolve(e.target.result));
            dbGet.addEventListener("error", e => reject(e));
        });
    }

    /**
     * Adds item to IndexedDB under given key
     * @param key 
     * @param payload 
     */
    async put(key: string, payload: T): Promise<T> {
        return new Promise((resolve: any, reject: any) => {
            // TODO: Add timeouts?
            const transaction = this._db.transaction([this._tableName], "readwrite");
            const objectStore = transaction.objectStore(this._tableName);

            const dbPut = objectStore.put(payload, key);
            dbPut.addEventListener("success", (e: IDBRequestEvent) => resolve(e.target.result));
            dbPut.addEventListener("error", e => reject(e));
        });
    }
}

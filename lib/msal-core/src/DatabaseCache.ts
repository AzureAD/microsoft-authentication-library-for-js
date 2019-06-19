interface IDBOpenDBRequestEvent extends Event {
    target: IDBOpenDBRequest & EventTarget;
}

interface IDBOpenOnUpgradeNeededEvent extends IDBVersionChangeEvent {
    target: IDBOpenDBRequest & EventTarget;
}

interface IDBRequestEvent extends Event {
    target: IDBRequest & EventTarget;
}

export class DatabaseCache<T> {
    private _db : IDBDatabase;
    private _dbName: string;
    private _tableName: string;
    private _version: number;

    constructor(dbName: string, tableName: string, version: number) {
        this._dbName = dbName;
        this._tableName = tableName;
        this._version = version;
    }

    async open(): Promise<void> {
        const openOperation = window.indexedDB.open(this._dbName, this._version);

        openOperation.addEventListener('upgradeneeded', (e: IDBOpenOnUpgradeNeededEvent) => {
            e.target.result.createObjectStore(this._tableName);
        })

        return new Promise((resolve, reject) => {
            openOperation.addEventListener('success', (e: IDBOpenDBRequestEvent) => {
                this._db = e.target.result;
                resolve();
            });

            openOperation.addEventListener('error', error => reject(error))
        })
    }

    async get(key: string): Promise<T> {
        const transaction = this._db.transaction([ this._tableName ], "readonly");
        const objectStore = transaction.objectStore(this._tableName);

        const getOperation = objectStore.get(key);

        return new Promise((resolve, reject) => {
            getOperation.addEventListener('success', (e: IDBRequestEvent) => resolve(e.target.result));
            getOperation.addEventListener('error', e => reject(e));
        });
    }

    async put(key: string, payload: T): Promise<T> {
        const transaction = this._db.transaction([ this._tableName ], "readwrite");
        const objectStore = transaction.objectStore(this._tableName);

        const putOperation = objectStore.put(payload, key);

        return new Promise((resolve, reject) => {
            putOperation.addEventListener('success', (e: IDBRequestEvent) => resolve(e.target.result));
            putOperation.addEventListener('error', e => reject(e));
        });
    }
}

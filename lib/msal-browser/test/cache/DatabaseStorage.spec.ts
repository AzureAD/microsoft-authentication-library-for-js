import { DatabaseStorage } from "../../src/cache/DatabaseStorage";
import { DBTableNames, DB_NAME, DB_VERSION } from "../../src/utils/BrowserConstants";

require("fake-indexeddb/auto");

interface IDBOpenDBRequestEvent extends Event {
    target: IDBOpenDBRequest & EventTarget;
}

interface IDBRequestEvent extends Event {
    target: IDBRequest & EventTarget;
}

const testKeyPairEntry = {
    key: "TestKeyPairKey",
    value:     {
        publicKey: { 
            algorithm: { name: "RSASSA-PKCS1-v1_5" },
            extractable: true,
            type: "public" as KeyType,
            usages: ["verify"] as KeyUsage[]
        },
        privateKey: {
            algorithm: { name: "RSASSA-PKCS1-v1_5" },
            extractable: false,
            type: "private" as KeyType,
            usages: ["sign"] as KeyUsage[]
        }
    }
}

const testSymmetricKeyEntry = {
    key: "TestSymmetricKey",
    value: {
        algorithm: { name: "AES-GCM" },
        extractable: true,
        type: "public" as KeyType,
        usages: ["sign", "verify"] as KeyUsage[]
    }
}

const setupDb = (e: Event) => {
    const event = e as IDBOpenDBRequestEvent;
    const db = event.target.result;

    // Create object stores
    Object.values(DBTableNames).forEach((tableName: string) =>{
        db.createObjectStore(tableName);
    });
}

const populateDb = (e: Event) => {
    const event = e as IDBOpenDBRequestEvent;
    const db = event.target.result;
    // Add asymmetric testKeyPair
    const asymmetricKeyTransaction = db.transaction([DBTableNames.asymmetricKeys], "readwrite");
    const asymmetricKeyObjectStore = asymmetricKeyTransaction.objectStore(DBTableNames.asymmetricKeys);
    asymmetricKeyObjectStore.put(testKeyPairEntry.value, testKeyPairEntry.key);

    // Add symmetric key
    const symmetricTransaction = db.transaction([DBTableNames.symmetricKeys], "readwrite");
    const symmetricObjectStore = symmetricTransaction.objectStore(DBTableNames.symmetricKeys);
    symmetricObjectStore.put(testSymmetricKeyEntry.value, testSymmetricKeyEntry.key);
}

const clearDb = (e: Event) => {
    const event = e as IDBOpenDBRequestEvent;
    const db = event.target.result;
    // Clear asymmetric keys
    const asymmetricKeyTransaction = db.transaction([DBTableNames.asymmetricKeys], "readwrite");
    const asymmetricKeyObjectStore = asymmetricKeyTransaction.objectStore(DBTableNames.asymmetricKeys);
    asymmetricKeyObjectStore.clear();

    // Add symmetric key
    const symmetricTransaction = db.transaction([DBTableNames.symmetricKeys], "readwrite");
    const symmetricObjectStore = symmetricTransaction.objectStore(DBTableNames.symmetricKeys);
    symmetricObjectStore.clear();
}

describe("DatabaseStorage.ts unit tests", () => {
    // Test get API
    let asymmetricKeys: DatabaseStorage<CryptoKeyPair>;
    let symmetricKeys: DatabaseStorage<CryptoKey>;

    beforeAll(() => {
        asymmetricKeys = new DatabaseStorage<CryptoKeyPair>(DBTableNames.asymmetricKeys);
        symmetricKeys = new DatabaseStorage<CryptoKey>(DBTableNames.symmetricKeys);
        const openDbReq = indexedDB.open(DB_NAME, DB_VERSION);
        openDbReq.onupgradeneeded = setupDb;
    });

    describe("get", () => {
        beforeEach(() => {
            const openDbReq = indexedDB.open(DB_NAME, DB_VERSION);
            openDbReq.onsuccess = populateDb;
        });

        afterEach(() =>{
            const openDbReq = indexedDB.open(DB_NAME, DB_VERSION);
            openDbReq.onsuccess = clearDb;
        });

        it("successfully retrieves an asymmetric keypair", async () => {
            const cachedAsymmetricKey = await asymmetricKeys.get(testKeyPairEntry.key);
            expect(cachedAsymmetricKey).toStrictEqual(testKeyPairEntry.value);
        });

        it("successfully retrieves a symmetric key", async () => {
            const cachedSymmetrickey = await symmetricKeys.get(testSymmetricKeyEntry.key);
            expect(cachedSymmetrickey).toStrictEqual(testSymmetricKeyEntry.value);
        });
    });
})
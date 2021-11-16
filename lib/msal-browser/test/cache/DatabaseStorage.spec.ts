import { INDEXED_DB_INFO } from "../../src/cache/AsyncMemoryStorage";
import { DatabaseStorage } from "../../src/cache/DatabaseStorage";
import { DBTableNames } from "../../src/utils/BrowserConstants";

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
    db.createObjectStore(DBTableNames.asymmetricKeys);
    db.createObjectStore(DBTableNames.symmetricKeys);

}

const populateDb = (e: Event) => {
    const event = e as IDBOpenDBRequestEvent;
    const db = event.target.result;
    // Add asymmetric testKeyPair
    const asymTransaction = db.transaction([DBTableNames.asymmetricKeys], "readwrite");
    const asymKeystore = asymTransaction.objectStore(DBTableNames.asymmetricKeys);
    asymKeystore.put(testKeyPairEntry.value, testKeyPairEntry.key);
    // Add symmetric key
    const symTransaction = db.transaction([DBTableNames.symmetricKeys], "readwrite");
    const symKeystore = symTransaction.objectStore(DBTableNames.symmetricKeys);
    symKeystore.put(testSymmetricKeyEntry.value, testSymmetricKeyEntry.key);
}

const clearDb = (e: Event) => {
    const event = e as IDBOpenDBRequestEvent;
    const db = event.target.result;
    const transaction = db.transaction([DBTableNames.asymmetricKeys, DBTableNames.symmetricKeys], "readwrite");
    const asymKeystore = transaction.objectStore(DBTableNames.asymmetricKeys);
    const symKeystore = transaction.objectStore(DBTableNames.symmetricKeys);
    asymKeystore.clear();
    symKeystore.clear();
}

describe("DatabaseStorage.ts unit tests", () => {
    // Test get API
    let asymmetricKeys: DatabaseStorage<CryptoKeyPair>;
    let symmetricKeys: DatabaseStorage<CryptoKey>;

    beforeAll(() => {
        asymmetricKeys = new DatabaseStorage<CryptoKeyPair>(INDEXED_DB_INFO, DBTableNames.asymmetricKeys);
        symmetricKeys = new DatabaseStorage<CryptoKey>(INDEXED_DB_INFO, DBTableNames.symmetricKeys);
        const openDbReq = indexedDB.open(INDEXED_DB_INFO.name, INDEXED_DB_INFO.version);
        openDbReq.onupgradeneeded = setupDb;
    });

    describe("get", () => {
        beforeEach(() => {
            const openDbReq = indexedDB.open(INDEXED_DB_INFO.name, INDEXED_DB_INFO.version);
            openDbReq.onsuccess = populateDb;
        });

        afterEach(() =>{
            const openDbReq = indexedDB.open(INDEXED_DB_INFO.name, INDEXED_DB_INFO.version);
            openDbReq.onsuccess = clearDb;
        });

        it("successfully retrieves an asymmetric keypair", async () => {
            const cachedAsymmetricKey = await asymmetricKeys.getItem(testKeyPairEntry.key);
            expect(cachedAsymmetricKey).toStrictEqual(testKeyPairEntry.value);
        });

        it("successfully retrieves a symmetric key", async () => {
            const cachedSymmetrickey = await symmetricKeys.getItem(testSymmetricKeyEntry.key);
            expect(cachedSymmetrickey).toStrictEqual(testSymmetricKeyEntry.value);
        });
    });
})
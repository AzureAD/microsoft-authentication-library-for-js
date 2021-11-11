import { Logger, LogLevel } from "@azure/msal-common";
import { BrowserAuthError } from "../../src";
import { AsyncMemoryStorage } from "../../src/cache/AsyncMemoryStorage";

let mockDatabase = {
    "TestDb.keys": {}
};

let mockInMemoryCache = {
    "TestDb.keys": {}
}

const TEST_DB_TABLE_NAME = "TestDb.keys";

const callCounter = {
    getItemPersistent: 0,
    setItemPersistent: 0,
    removeItemPersistent: 0,
    getItem: 0,
    setItem: 0,
    removeItem: 0
}

// Mock DatabaseStorage
jest.mock("../../src/cache/DatabaseStorage", () => {
    return {
        DatabaseStorage: jest.fn().mockImplementation(() => {
            return {
                dbName: "TestDB",
                version: 1,
                tableName: TEST_DB_TABLE_NAME,
                open: () => {},
                getItem: (kid: string) => {
                    callCounter.getItemPersistent += 1;
                    const item = mockDatabase[TEST_DB_TABLE_NAME][kid];

                    if (item === DB_UNAVAILABLE) {
                        throw BrowserAuthError.createDatabaseUnavailableError();
                    }

                    return item;
                },
                setItem: (kid: string, payload: any) => {
                    callCounter.setItemPersistent += 1;

                    if (payload === DB_UNAVAILABLE) {
                        throw BrowserAuthError.createDatabaseUnavailableError();
                    }

                    mockDatabase[TEST_DB_TABLE_NAME][kid] = payload;
                    return mockDatabase[TEST_DB_TABLE_NAME][kid];
                },
                removeItem: (kid: string) => {
                    callCounter.removeItemPersistent += 1;
                    const item = mockDatabase[TEST_DB_TABLE_NAME][kid];

                    if (item === DB_UNAVAILABLE) {
                        throw BrowserAuthError.createDatabaseUnavailableError();
                    }

                    delete mockDatabase[TEST_DB_TABLE_NAME][kid];
                },
                containsKey: (kid: string) => {
                    return !!(mockDatabase[TEST_DB_TABLE_NAME][kid]);
                }
            }
        })
    }
});

// Mock MemoryStorage
jest.mock("../../src/cache/MemoryStorage", () => {
    return {
        MemoryStorage: jest.fn().mockImplementation(() => {
            return {
                getItem: (kid: string) => {
                    callCounter.getItem += 1;
                    return mockInMemoryCache[TEST_DB_TABLE_NAME][kid];
                },
                setItem: (kid: string, payload: any) => {
                    callCounter.setItem += 1;
                    mockInMemoryCache[TEST_DB_TABLE_NAME][kid] = payload;
                    return mockInMemoryCache[TEST_DB_TABLE_NAME][kid];
                },
                removeItem: (kid: string) => {
                    callCounter.removeItem += 1;
                    delete mockInMemoryCache[TEST_DB_TABLE_NAME][kid];
                },
                containsKey: (kid: string) => {
                    return !!(mockInMemoryCache[TEST_DB_TABLE_NAME][kid]);
                }
            }
      })
    }
});

let logMessages = new Array<Object>();

const TEST_CACHE_ITEMS = {
    TestItem: {
        key: "TestItem",
        value: "A test storage item."
    }
}

const resetCallCounter = () => {
    Object.keys(callCounter).forEach((key, value) => {
        callCounter[key] = 0;
    })
}

const DB_UNAVAILABLE = "DB_UNAVAILABLE";

describe("AsyncMemoryStorage Unit Tests", () => {
    describe("IndexedDB available", () => {
        const asyncMemoryStorage = new AsyncMemoryStorage<string>(new Logger({
            loggerCallback: (level: LogLevel, message: string) => {
                logMessages.push({ level: level, message: message });
            },
            logLevel: LogLevel.Verbose
        }));

        describe("getItem", () =>{
            beforeEach(() => {
                resetCallCounter();
                logMessages = [];
                mockDatabase[TEST_DB_TABLE_NAME] = {};
                mockInMemoryCache[TEST_DB_TABLE_NAME] = {};
            });

            it("should get item from in-memory cache when in-memory cache contains item", async () => {
                mockInMemoryCache[TEST_DB_TABLE_NAME][TEST_CACHE_ITEMS.TestItem.key] = TEST_CACHE_ITEMS.TestItem.value;
                const item = await asyncMemoryStorage.getItem(TEST_CACHE_ITEMS.TestItem.key);
                expect(callCounter.getItem).toBe(1);
                expect(callCounter.getItemPersistent).toBe(0);
                expect(item).toBe(TEST_CACHE_ITEMS.TestItem.value);
            });

            it("should get item from persistent cache when in-memory cache doesn't contain item", async () =>{
                mockDatabase[TEST_DB_TABLE_NAME][TEST_CACHE_ITEMS.TestItem.key] = TEST_CACHE_ITEMS.TestItem.value;
                const item = await asyncMemoryStorage.getItem(TEST_CACHE_ITEMS.TestItem.key);
                expect(callCounter.getItem).toBe(1);
                expect(callCounter.getItemPersistent).toBe(1);
                expect(logMessages[0]["level"]).toBe(3);
                expect(logMessages[0]["message"].indexOf("Queried item not found in in-memory cache, now querying persistent storage.")).not.toBe(-1);
                expect(item).toBe(TEST_CACHE_ITEMS.TestItem.value);
            });
        });

        describe("setItem", () =>{
            beforeEach(() => {
                resetCallCounter();
                logMessages = [];
                mockDatabase[TEST_DB_TABLE_NAME] = {};
                mockInMemoryCache[TEST_DB_TABLE_NAME] = {};
            });

            it("should set item in in-memory cache and persistent storage", async () => {
                await asyncMemoryStorage.setItem(TEST_CACHE_ITEMS.TestItem.key, TEST_CACHE_ITEMS.TestItem.value);
                const memoryItem = mockInMemoryCache[TEST_DB_TABLE_NAME][TEST_CACHE_ITEMS.TestItem.key];
                const persistedItem = mockDatabase[TEST_DB_TABLE_NAME][TEST_CACHE_ITEMS.TestItem.key];
                expect(callCounter.setItem).toBe(1);
                expect(callCounter.setItemPersistent).toBe(1);
                expect(memoryItem).toBe(TEST_CACHE_ITEMS.TestItem.value);
                expect(persistedItem).toBe(TEST_CACHE_ITEMS.TestItem.value);
            });
        });

        describe("removeItem", () =>{
            beforeEach(() => {
                resetCallCounter();
                logMessages = [];
                mockDatabase[TEST_DB_TABLE_NAME] = {};
                mockInMemoryCache[TEST_DB_TABLE_NAME] = {};
            });

            it("should remove item from in-memory cache and persistent storage", async () => {
                mockInMemoryCache[TEST_DB_TABLE_NAME][TEST_CACHE_ITEMS.TestItem.key] = TEST_CACHE_ITEMS.TestItem.value;
                mockDatabase[TEST_DB_TABLE_NAME][TEST_CACHE_ITEMS.TestItem.key] = TEST_CACHE_ITEMS.TestItem.value;
                await asyncMemoryStorage.removeItem(TEST_CACHE_ITEMS.TestItem.key);
                expect(callCounter.removeItem).toBe(1);
                expect(callCounter.removeItemPersistent).toBe(1);
                expect(mockInMemoryCache[TEST_DB_TABLE_NAME][TEST_CACHE_ITEMS.TestItem.key]).toBe(undefined);
                expect(mockDatabase[TEST_DB_TABLE_NAME][TEST_CACHE_ITEMS.TestItem.key]).toBe(undefined);
            });
        });
    });

    describe("IndexedDB Unavailable", () => {
        const asyncMemoryStorage = new AsyncMemoryStorage<string>(new Logger({
            loggerCallback: (level: LogLevel, message: string) => {
                logMessages.push({ level: level, message: message });
            },
            logLevel: LogLevel.Verbose
        }));

        describe("getItem", () =>{
            beforeEach(() => {
                resetCallCounter();
                logMessages = [];
                mockDatabase[TEST_DB_TABLE_NAME] = {};
                mockInMemoryCache[TEST_DB_TABLE_NAME] = {};
            });

            it("should log an error if persistent storage is unavailable or inaccessible", async () => {
                mockDatabase[TEST_DB_TABLE_NAME][TEST_CACHE_ITEMS.TestItem.key] = DB_UNAVAILABLE;
                const item = await asyncMemoryStorage.getItem(TEST_CACHE_ITEMS.TestItem.key);
                const lastLog = logMessages[logMessages.length - 1];
                expect(callCounter.getItem).toBe(1);
                expect(callCounter.getItemPersistent).toBe(1);
                expect(item).toBe(undefined);
                expect(lastLog["level"]).toBe(0);
                expect(lastLog["message"].indexOf("Could not access persistent storage. This may be caused by browser privacy features which block persistent storage in third-party contexts.")).not.toBe(-1);
            });
        });

        describe("setItem", () =>{
            beforeEach(() => {
                resetCallCounter();
                logMessages = [];
                mockDatabase[TEST_DB_TABLE_NAME] = {};
                mockInMemoryCache[TEST_DB_TABLE_NAME] = {};
            });

            it("should log an error if persistent storage is unavailable or inaccessible", async () => {
                const item = await asyncMemoryStorage.setItem(TEST_CACHE_ITEMS.TestItem.key, DB_UNAVAILABLE);
                const lastLog = logMessages[logMessages.length - 1];
                expect(callCounter.setItem).toBe(1);
                expect(callCounter.setItemPersistent).toBe(1);
                expect(item).toBe(undefined);
                expect(lastLog["level"]).toBe(0);
                expect(lastLog["message"].indexOf("Could not access persistent storage. This may be caused by browser privacy features which block persistent storage in third-party contexts.")).not.toBe(-1);
            });
        });

        describe("removeItem", () =>{
            beforeEach(() => {
                resetCallCounter();
                logMessages = [];
                mockDatabase[TEST_DB_TABLE_NAME] = {};
                mockInMemoryCache[TEST_DB_TABLE_NAME] = {};
            });

            it("should log an error if persistent storage is unavailable or inaccessible", async () => {
                mockDatabase[TEST_DB_TABLE_NAME][TEST_CACHE_ITEMS.TestItem.key] = DB_UNAVAILABLE;
                await asyncMemoryStorage.removeItem(TEST_CACHE_ITEMS.TestItem.key);
                const lastLog = logMessages[logMessages.length - 1];
                expect(callCounter.removeItem).toBe(1);
                expect(callCounter.removeItemPersistent).toBe(1);
                expect(lastLog["level"]).toBe(0);
                expect(lastLog["message"].indexOf("Could not access persistent storage. This may be caused by browser privacy features which block persistent storage in third-party contexts.")).not.toBe(-1);
            });
        });
    });
});
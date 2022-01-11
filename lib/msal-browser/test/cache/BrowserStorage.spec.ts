import { BrowserStorage } from "../../src/cache/BrowserStorage";
import { BrowserCacheLocation } from "../../src/utils/BrowserConstants";

describe("BrowserStorage.ts unit tests", () => {
    describe("Non enumarable context (proxy for storage)", () => {
        class ProxyStorage {
            private browserStorage: any

            constructor(storage: any) {
                this.browserStorage = storage

                Object.defineProperty(this, "browserStorage", {
                    enumerable: false
                })
            }

            key(n: number) {
                return this.browserStorage.key(n);
            }

            setItem (key: string, value: string) {
                this.browserStorage.setItem(key, value);
            }

            getItem(key: string) {
                return this.browserStorage.getItem(key);
            }

            removeItem(key: string) {
                this.browserStorage.removeItem(key)
            }

            clear() {
                this.browserStorage.clear();
            }

            get length() {
                return this.browserStorage.length
            }
        }

        const localStorage = new ProxyStorage(window[BrowserCacheLocation.LocalStorage]);
        const sessionStorage = new ProxyStorage(window[BrowserCacheLocation.SessionStorage]);

        Object.defineProperty(globalThis, BrowserCacheLocation.LocalStorage, {
            get: () => localStorage
        });
        Object.defineProperty(globalThis, BrowserCacheLocation.SessionStorage, {
            get: () => sessionStorage
        });

        const browserLocalStorage = new BrowserStorage(BrowserCacheLocation.LocalStorage);
        const browserSessionStorage = new BrowserStorage(BrowserCacheLocation.SessionStorage);

        const msalKey = 'test';
        const msalKey2 = 'test2';
        const val = 'value';

        beforeEach(() => {
            browserLocalStorage.setItem(msalKey, val);
            browserSessionStorage.setItem(msalKey2, val);
        });

        afterEach(async () => {
            for (const key in browserLocalStorage.getKeys()) {
                browserLocalStorage.removeItem(key)
            }

            for (const key in browserSessionStorage.getKeys()) {
                browserSessionStorage.removeItem(key)
            }
        });

        it("getKeys()", () => {
            // Old version of getKeys was using Object.keys
            expect(Object.keys(localStorage)).toHaveLength(0);
            expect(Object.keys(sessionStorage)).toHaveLength(0);

            expect(localStorage.length).toEqual(1);
            expect(sessionStorage.length).toEqual(1);
            expect(browserLocalStorage.getKeys()).toHaveLength(1);
            expect(browserSessionStorage.getKeys()).toHaveLength(1);
            expect(browserLocalStorage.getItem(msalKey)).toEqual(val);
            expect(browserSessionStorage.getItem(msalKey2)).toEqual(val);
        })
    })
})

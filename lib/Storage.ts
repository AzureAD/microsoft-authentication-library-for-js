"use strict";

namespace Msal {

    /**
    * @hidden
    */
    export class Storage {// Singleton

        private static _instance: Storage;
        private _localStorageSupported: boolean;
        private _sessionStorageSupported: boolean;
        private _cacheLocation: string;

        constructor(cacheLocation: string) {
            if (Storage._instance) {
                return Storage._instance;
            }

            this._cacheLocation = cacheLocation;
            this._localStorageSupported = typeof window[this._cacheLocation] != "undefined" && window[this._cacheLocation] != null;
            this._sessionStorageSupported = typeof window[cacheLocation] != "undefined" && window[cacheLocation] != null;
            Storage._instance = this;
            if (!this._localStorageSupported && !this._sessionStorageSupported) {
                throw new Error("localStorage and sessionStorage not supported");
            }

            return Storage._instance;
        }

        // add value to storage
        setItem(key: string, value: string): void {
            if (window[this._cacheLocation]) {
                window[this._cacheLocation].setItem(key, value);
            } else {
                throw new Error("localStorage and sessionStorage are not supported");
            }
        }

        // get one item by key from storage
        getItem(key: string): string {
            if (window[this._cacheLocation]) {
                return window[this._cacheLocation].getItem(key);
            } else {
                throw new Error("localStorage and sessionStorage are not supported");
            }
        }

        // remove value from storage
        removeItem(key: string): void {
            if (window[this._cacheLocation]) {
                return window[this._cacheLocation].removeItem(key);
            } else {
                throw new Error("localStorage and sessionStorage are not supported");
            }
        }

        // clear storage (remove all items from it)
        clear(): void {
            if (window[this._cacheLocation]) {
                return window[this._cacheLocation].clear();
            } else {
                throw new Error("localStorage and sessionStorage are not supported");
            }
        }

        getAllAccessTokens(clientId: string, userIdentifier: string): Array<AccessTokenCacheItem> {
            const results: Array<AccessTokenCacheItem> = [];
            let accessTokenCacheItem: AccessTokenCacheItem;
            const storage = window[this._cacheLocation];
            if (storage) {
                let key: string;
                for (key in storage) {
                    if (storage.hasOwnProperty(key)) {
                        if (key.match(clientId) && key.match(userIdentifier)) {
                            let value = this.getItem(key);
                            if (value) {
                                accessTokenCacheItem = new AccessTokenCacheItem(JSON.parse(key), JSON.parse(value));
                                results.push(accessTokenCacheItem);
                            }
                        }
                    }
                }
            } else {
                throw new Error("localStorage and sessionStorage are not supported");
            }

            return results;
        }

        removeAcquireTokenEntries(acquireTokenUser: string, acquireTokenStatus: string): void {
            const storage = window[this._cacheLocation];
            if (storage) {
                let key: string;
                for (key in storage) {
                    if (storage.hasOwnProperty(key)) {
                        if ((key.indexOf(acquireTokenUser) > -1) || (key.indexOf(acquireTokenStatus) > -1)) {
                            this.removeItem(key);
                        }
                    }
                }
            } else {
                throw new Error("localStorage and sessionStorage are not supported");
            }
        }

        resetCacheItems(): void {
            const storage = window[this._cacheLocation];
            if (storage) {
                let key: string;
                for (key in storage) {
                    if (storage.hasOwnProperty(key)) {
                        storage[key] = "";
                    }
                }
            } else {
                throw new Error("localStorage and sessionStorage are not supported");
            }
        }
    }
}

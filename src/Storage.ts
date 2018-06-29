/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { Constants } from "./Constants";
import { AccessTokenCacheItem } from "./AccessTokenCacheItem";

export interface CacheProvider {
  [key: string]: any;

  clear(): void;
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

export const CacheLocations = {
  localStorage: "localStorage",
  sessionStorage: "sessionStorage"
};

export type CacheLocation = "localStorage"|"sessionStorage";

/*
 * @hidden
 */
export class Storage {
  static usingCustomCache(customCache: CacheProvider): Storage {
    return new Storage(customCache);
  }

  private static _instances: { [key: string]: Storage } = {};
  static usingBrowserCache(cacheLocation: CacheLocation): Storage {
    if (Storage._instances[cacheLocation]) {
      return Storage._instances[cacheLocation];
    }

    if (!(cacheLocation in CacheLocations)) {
      throw new Error("cacheLocation " + cacheLocation + " not valid. Possible values are: " +
        CacheLocations.localStorage + " and " + CacheLocations.sessionStorage);
    }

    const storageSupported = typeof window[cacheLocation] !== "undefined" && !!window[cacheLocation];
    if (!storageSupported) {
      throw new Error("cacheLocation " + cacheLocation + " not supported by current environment");
    }

    let storage = new Storage(window[cacheLocation]);
    Storage._instances[cacheLocation] = storage;
    return storage;
  }

  private constructor(private _cacheLocation: CacheProvider) {
    // No Logic
  }

  // add value to storage
  setItem(key: string, value: string): void {
    this._cacheLocation.setItem(key, value);
  }

  // get one item by key from storage
  getItem(key: string): string {
    return this._cacheLocation.getItem(key);
  }

  // remove value from storage
  removeItem(key: string): void {
    return this._cacheLocation.removeItem(key);
  }

  // clear storage (remove all items from it)
  clear(): void {
    return this._cacheLocation.clear();
  }

  getAllAccessTokens(clientId: string, userIdentifier: string): Array<AccessTokenCacheItem> {
    const results: Array<AccessTokenCacheItem> = [];
    let accessTokenCacheItem: AccessTokenCacheItem;
    let key: string;
    for (key in this._cacheLocation) {
      if (this._cacheLocation.hasOwnProperty(key)) {
        if (key.match(clientId) && key.match(userIdentifier)) {
          let value = this.getItem(key);
          if (value) {
            accessTokenCacheItem = new AccessTokenCacheItem(JSON.parse(key), JSON.parse(value));
            results.push(accessTokenCacheItem);
          }
        }
      }
    }

    return results;
  }

  removeAcquireTokenEntries(authorityKey: string, acquireTokenUserKey: string): void {
    let key: string;
    for (key in this._cacheLocation) {
      if (this._cacheLocation.hasOwnProperty(key)) {
          if ((authorityKey != "" && key.indexOf(authorityKey) > -1) || (acquireTokenUserKey!= "" && key.indexOf(acquireTokenUserKey) > -1)) {
          this.removeItem(key);
        }
      }
    }
  }

  resetCacheItems(): void {
    let key: string;
    for (key in this._cacheLocation) {
        if (this._cacheLocation.hasOwnProperty(key) && key.indexOf(Constants.msal) !== -1) {
            this.setItem(key,"");
        }
        if (this._cacheLocation.hasOwnProperty(key) && key.indexOf(Constants.renewStatus) !== -1)
            this.removeItem(key);
    }
  }
}

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

/*
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
    this._localStorageSupported = typeof window[this._cacheLocation] !== "undefined" && window[this._cacheLocation] != null;
    this._sessionStorageSupported = typeof window[cacheLocation] !== "undefined" && window[cacheLocation] != null;
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

  removeAcquireTokenEntries(authorityKey: string, acquireTokenUserKey: string): void {
    const storage = window[this._cacheLocation];
    if (storage) {
      let key: string;
      for (key in storage) {
        if (storage.hasOwnProperty(key)) {
            if ((authorityKey != "" && key.indexOf(authorityKey) > -1) || (acquireTokenUserKey!= "" && key.indexOf(acquireTokenUserKey) > -1)) {
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
          if (storage.hasOwnProperty(key) && key.indexOf(Constants.msal) !== -1) {
              this.setItem(key,"");
          }
          if (storage.hasOwnProperty(key) && key.indexOf(Constants.renewStatus) !== -1)
              this.removeItem(key);
      }
    } else {
      throw new Error("localStorage and sessionStorage are not supported");
    }
  }
}

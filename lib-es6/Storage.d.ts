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
import { AccessTokenCacheItem } from "./AccessTokenCacheItem";
export interface StorageProvider {
    setItem(key: string, value: string): void;
    getItem(key: string): string;
    removeItem(key: string): void;
    clear(): void;
    getAllAccessTokens(clientId: string, userIdentifier: string): Array<AccessTokenCacheItem>;
    removeAcquireTokenEntries(authorityKey: string, acquireTokenUserKey: string): void;
    resetCacheItems(): void;
}
export declare const CacheLocations: {
    localStorage: string;
    sessionStorage: string;
};
export declare type CacheLocation = "localStorage" | "sessionStorage";
export declare class Storage implements StorageProvider {
    private static _instances;
    private _cacheLocation;
    constructor(cacheLocation: CacheLocation);
    setItem(key: string, value: string): void;
    getItem(key: string): string;
    removeItem(key: string): void;
    clear(): void;
    getAllAccessTokens(clientId: string, userIdentifier: string): Array<AccessTokenCacheItem>;
    removeAcquireTokenEntries(authorityKey: string, acquireTokenUserKey: string): void;
    resetCacheItems(): void;
}

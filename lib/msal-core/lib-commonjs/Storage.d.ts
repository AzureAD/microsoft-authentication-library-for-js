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
export declare class Storage {
    private static _instance;
    private _localStorageSupported;
    private _sessionStorageSupported;
    private _cacheLocation;
    constructor(cacheLocation: string);
    setItem(key: string, value: string, enableCookieStorage?: boolean): void;
    getItem(key: string, enableCookieStorage?: boolean): string;
    removeItem(key: string): void;
    clear(): void;
    getAllAccessTokens(clientId: string, userIdentifier: string): Array<AccessTokenCacheItem>;
    removeAcquireTokenEntries(authorityKey: string, acquireTokenUserKey: string): void;
    resetCacheItems(): void;
    setItemCookie(cName: string, cValue: string, expires?: number): void;
    getItemCookie(cName: string): string;
    setExpirationCookie(cookieLife: number): string;
    clearCookie(): void;
}

import { AccessTokenCacheItem } from "./AccessTokenCacheItem";
export declare class Storage {
    private static _instance;
    private _localStorageSupported;
    private _sessionStorageSupported;
    private _cacheLocation;
    constructor(cacheLocation: string);
    setItem(key: string, value: string): void;
    getItem(key: string): string;
    removeItem(key: string): void;
    clear(): void;
    getAllAccessTokens(clientId: string, userIdentifier: string): Array<AccessTokenCacheItem>;
    removeAcquireTokenEntries(acquireTokenUser: string, acquireTokenStatus: string): void;
    resetCacheItems(): void;
}

import { LogLevel, Logger, ClientAuthError } from '@azure/msal-common';
import { Storage } from './../../src/cache/Storage';
import { TokenCache } from '../../src/cache/TokenCache';
import { debug } from 'debug';
import { promises as fs } from 'fs';

describe("TokenCache tests", () => {

    let logger: Logger;

    beforeEach(() => {
        const loggerOptions = {
            loggerCallback: (
                level: LogLevel,
                message: string,
                containsPii: boolean
            ) => {
                debug(`msal:${LogLevel[level]}${containsPii ? '-Pii' : ''}`)(message);
            },
            piiLoggingEnabled: false,
            logLevel: LogLevel.Info,
        };
        logger = new Logger(loggerOptions!);
    });

    it("Constructor tests builds default token cache", () => {
        let storage: Storage = new Storage(logger);
        const tokenCache = new TokenCache(storage, logger);
        expect(tokenCache).toBeInstanceOf(TokenCache);
        expect(tokenCache.cacheHasChanged()).toEqual(false);
        expect(tokenCache.getAllAccounts()).toEqual([]);
    });

    it("TokenCache serialize/deserialize", () => {
        const cache = require('./cache-test-files/default-cache.json');
        const storage: Storage = new Storage(logger);
        const tokenCache = new TokenCache(storage, logger);

        tokenCache.deserialize(JSON.stringify(cache));
        expect(tokenCache.cacheHasChanged()).toEqual(true);

        const tokenCacheAfterSerialization = tokenCache.serialize();
        expect(JSON.parse(tokenCacheAfterSerialization)).toEqual(cache);
        expect(tokenCache.cacheHasChanged()).toEqual(false);
    });

    it("TokenCache serialize/deserialize, does not remove unrecognized entities", () => {
        // TokenCache should not remove unrecognized entities from JSON file, even if they
        // are deeply nested, and should write them back out 
        const cache = require('./cache-test-files/cache-unrecognized-entities.json');
        const storage: Storage = new Storage(logger);
        const tokenCache = new TokenCache(storage, logger);

        tokenCache.deserialize(JSON.stringify(cache));
        expect(tokenCache.cacheHasChanged()).toEqual(true);

        const tokenCacheAfterSerialization = tokenCache.serialize();
        expect(JSON.parse(tokenCacheAfterSerialization)).toEqual(cache);
        expect(tokenCache.cacheHasChanged()).toEqual(false);
    });

    it("TokenCache.mergeRemovals removes entities from the cache, but does not remove other entities", () => {
        // TokenCache should not remove unrecognized entities from JSON file, even if they
        // are deeply nested, and should write them back out 
        const cache = require('./cache-test-files/cache-unrecognized-entities.json');
        const storage: Storage = new Storage(logger);
        const tokenCache = new TokenCache(storage, logger);

        tokenCache.deserialize(JSON.stringify(cache));
        tokenCache.removeAccount(tokenCache.getAllAccounts()[0]);
        expect(tokenCache.cacheHasChanged()).toEqual(true);

        const tokenCacheAfterSerialization = JSON.parse(tokenCache.serialize());
        expect(tokenCache.cacheHasChanged()).toEqual(false);
        expect(tokenCacheAfterSerialization.Account).toEqual({});
        expect(tokenCacheAfterSerialization.RefreshToken).toEqual({});
        expect(tokenCacheAfterSerialization.AccessToken).toEqual({});
        expect(tokenCacheAfterSerialization.IdToken).toEqual({});
        expect(tokenCacheAfterSerialization.Unrecognized_Entity).toEqual(cache.Unrecognized_Entity);
    });

    it("TokenCache.readToPersistence and writeToPersistence throw error if no cache plug in is set", () => {
        const storage = new Storage(logger);
        const tokenCache = new TokenCache(storage, logger);
        expect(tokenCache.readFromPersistence()).rejects.toThrow(ClientAuthError);
        expect(tokenCache.writeToPersistence()).rejects.toThrow(ClientAuthError);
    });

    it("TokenCache.readToPersistence and writeToPersistence", async () => {

        const readFromStorage = () => {
            return fs.readFile("./test/cache/cache-test-files/cache-unrecognized-entities.json", "utf-8");
        };
        const cachePath = "./test/cache/cache-test-files/temp-cache.json";
        function writeToStorage(getMergedState: (oldState: string) => string): Promise<void> {
            return readFromStorage().then(oldFile => {
                const mergedState = getMergedState(oldFile);
                return fs.writeFile(cachePath, mergedState);
            })
        };

        const cachePlugin = {
            readFromStorage,
            writeToStorage
        };

        const storage = new Storage(logger);
        const tokenCache = new TokenCache(storage, logger, cachePlugin);

        await tokenCache.readFromPersistence()
        expect(tokenCache.cacheHasChanged()).toBe(true);
        expect(tokenCache.getAllAccounts().length).toBe(1);

        await tokenCache.writeToPersistence();
        expect(tokenCache.cacheHasChanged()).toBe(false);
        expect(require('./cache-test-files/temp-cache.json')).toEqual(require('./cache-test-files/cache-unrecognized-entities.json'));

        // try and clean up
        try {
            await fs.unlink(cachePath);
        } catch (err) {
            if (err.code == "ENOENT") {
                console.log("Tried to delete temp cache file but it does not exist");
            }
        }
    });
});

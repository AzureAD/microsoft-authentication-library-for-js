import { LogLevel, Logger, TokenCacheContext, ICachePlugin } from '@azure/msal-common';
import { NodeStorage } from '../../src/cache/NodeStorage';
import { TokenCache } from '../../src/cache/TokenCache';
import { promises as fs } from 'fs';
import { version, name } from '../../package.json';
import { DEFAULT_CRYPTO_IMPLEMENTATION, TEST_CONSTANTS } from '../utils/TestConstants';
import * as msalCommon from '@azure/msal-common';
import { Deserializer } from '../../src/cache/serializer/Deserializer';
import { JsonCache } from '../../src';

describe("TokenCache tests", () => {

    let logger: Logger;

    beforeEach(() => {
        const loggerOptions = {
            loggerCallback: () => {
                // allow users to not set loggerCallback
            },
            piiLoggingEnabled: false,
            logLevel: LogLevel.Info,
        };
        logger = new Logger(loggerOptions!, name, version);
        jest.restoreAllMocks();
    });

    it("Constructor tests builds default token cache", async () => {
        let storage: NodeStorage = new NodeStorage(logger, TEST_CONSTANTS.CLIENT_ID, DEFAULT_CRYPTO_IMPLEMENTATION);
        const tokenCache = new TokenCache(storage, logger);
        expect(tokenCache).toBeInstanceOf(TokenCache);
        expect(tokenCache.hasChanged()).toEqual(false);
        expect(await tokenCache.getAllAccounts()).toEqual([]);
    });

    it("TokenCache serialize/deserialize", () => {
        const cache = require('./cache-test-files/default-cache.json');
        const storage: NodeStorage = new NodeStorage(logger, TEST_CONSTANTS.CLIENT_ID, DEFAULT_CRYPTO_IMPLEMENTATION);
        const tokenCache = new TokenCache(storage, logger);

        tokenCache.deserialize(JSON.stringify(cache));
        expect(tokenCache.hasChanged()).toEqual(true);

        const tokenCacheAfterSerialization = tokenCache.serialize();
        expect(JSON.parse(tokenCacheAfterSerialization)).toEqual(cache);
        expect(tokenCache.hasChanged()).toEqual(false);
    });

    it("TokenCache should not fail when attempting to deserialize an empty string", () => {
        const cache = "";
        const storage: NodeStorage = new NodeStorage(logger, TEST_CONSTANTS.CLIENT_ID, DEFAULT_CRYPTO_IMPLEMENTATION);
        const tokenCache = new TokenCache(storage, logger);

        tokenCache.deserialize(cache);
        expect(tokenCache.hasChanged()).toEqual(false);
    });

    it("TokenCache serialize/deserialize, does not remove unrecognized entities", () => {
        const cache = require('./cache-test-files/cache-unrecognized-entities.json');
        const storage: NodeStorage = new NodeStorage(logger, TEST_CONSTANTS.CLIENT_ID, DEFAULT_CRYPTO_IMPLEMENTATION);
        const tokenCache = new TokenCache(storage, logger);

        tokenCache.deserialize(JSON.stringify(cache));
        expect(tokenCache.hasChanged()).toEqual(true);

        const tokenCacheAfterSerialization = tokenCache.serialize();
        expect(JSON.parse(tokenCacheAfterSerialization)).toEqual(cache);
        expect(tokenCache.hasChanged()).toEqual(false);
    });

    it("TokenCache.mergeRemovals removes entities from the cache, but does not remove other entities", async () => {
        // TokenCache should not remove unrecognized entities from JSON file, even if they
        // are deeply nested, and should write them back out
        const cache = require('./cache-test-files/cache-unrecognized-entities.json');
        const storage: NodeStorage = new NodeStorage(logger, TEST_CONSTANTS.CLIENT_ID, DEFAULT_CRYPTO_IMPLEMENTATION);
        const tokenCache = new TokenCache(storage, logger);

        tokenCache.deserialize(JSON.stringify(cache));
        const accounts = await tokenCache.getAllAccounts();
        await tokenCache.removeAccount(accounts[0]);
        expect(tokenCache.hasChanged()).toEqual(true);

        const tokenCacheAfterSerialization = JSON.parse(tokenCache.serialize());
        expect(tokenCache.hasChanged()).toEqual(false);
        expect(tokenCacheAfterSerialization.Account).toEqual({});
        expect(tokenCacheAfterSerialization.RefreshToken).toEqual({});
        expect(tokenCacheAfterSerialization.AccessToken).toEqual({});
        expect(tokenCacheAfterSerialization.IdToken).toEqual({});
        expect(tokenCacheAfterSerialization.Unrecognized_Entity).toEqual(cache.Unrecognized_Entity);
    });

    it("TokenCache beforeCacheAccess and afterCacheAccess", async () => {

        const beforeCacheAccess = async (context: TokenCacheContext) => {
            context.tokenCache.deserialize(await fs.readFile("./test/cache/cache-test-files/cache-unrecognized-entities.json", "utf-8"));
        };
        const cachePath = "./test/cache/cache-test-files/temp-cache.json";
        const afterCacheAccess = async (context: TokenCacheContext) => {
            await fs.writeFile(cachePath, context.tokenCache.serialize());
        }

        const cachePlugin: ICachePlugin = {
            beforeCacheAccess,
            afterCacheAccess
        };

        const storage = new NodeStorage(logger, TEST_CONSTANTS.CLIENT_ID, DEFAULT_CRYPTO_IMPLEMENTATION);
        const tokenCache = new TokenCache(storage, logger, cachePlugin);

        const mockTokenCacheContextInstance = {
            hasChanged: false,
            cache: tokenCache,
            cacheHasChanged: false,
            tokenCache
        }

        jest.spyOn(msalCommon, 'TokenCacheContext')
            .mockImplementation(() => mockTokenCacheContextInstance as unknown as TokenCacheContext)

        const accounts = await tokenCache.getAllAccounts();
        expect(msalCommon.TokenCacheContext).toHaveBeenCalled();
        expect(accounts.length).toBe(1);
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

    it('should return an empty KV store if TokenCache is empty', () => {
        const storage: NodeStorage = new NodeStorage(logger, TEST_CONSTANTS.CLIENT_ID, DEFAULT_CRYPTO_IMPLEMENTATION);
        const tokenCache = new TokenCache(storage, logger);

        expect(tokenCache.getKVStore()).toEqual({});
    })

    it('should return stored entities in KV store', () => {
        const cache: JsonCache = require('./cache-test-files/default-cache.json');
        const storage: NodeStorage = new NodeStorage(logger, TEST_CONSTANTS.CLIENT_ID, DEFAULT_CRYPTO_IMPLEMENTATION);
        const tokenCache = new TokenCache(storage, logger);

        tokenCache.deserialize(JSON.stringify(cache));

        const expectedCachedEntities = Deserializer.deserializeAllCache(cache);

        const kvStore = tokenCache.getKVStore();

        Object.values(expectedCachedEntities).forEach(expectedCacheSection => {
            Object.keys(expectedCacheSection).forEach(cacheKey => {
                expect(kvStore[cacheKey]).toEqual(expectedCacheSection[cacheKey]);
            })
        })
    })

});

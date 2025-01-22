/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    LogLevel,
    Logger,
    TokenCacheContext,
    ICachePlugin,
    buildStaticAuthorityOptions,
} from "@azure/msal-common";
import { NodeStorage } from "../../src/cache/NodeStorage.js";
import { TokenCache } from "../../src/cache/TokenCache.js";
import { existsSync, watch, promises, FSWatcher } from "fs";
import { version, name } from "../../package.json";
import {
    DEFAULT_CRYPTO_IMPLEMENTATION,
    ID_TOKEN_CLAIMS,
} from "../utils/TestConstants.js";
import { Deserializer } from "../../src/cache/serializer/Deserializer.js";
import { JsonCache } from "../../src/index.js";
import { MSALCommonModule } from "../utils/MockUtils.js";

const msalCommon: MSALCommonModule = jest.requireActual(
    "@azure/msal-common/node"
);

describe("TokenCache tests", () => {
    let logger: Logger;
    let storage: NodeStorage;
    let watcher: FSWatcher;

    beforeEach(() => {
        const loggerOptions = {
            loggerCallback: () => {
                // allow users to not set loggerCallback
            },
            piiLoggingEnabled: false,
            logLevel: LogLevel.Info,
        };
        logger = new Logger(loggerOptions!, name, version);
        storage = new NodeStorage(
            logger,
            "mock_client_id",
            {
                ...DEFAULT_CRYPTO_IMPLEMENTATION,
                base64Decode: (): string => {
                    return JSON.stringify(ID_TOKEN_CLAIMS);
                },
            },
            buildStaticAuthorityOptions({
                authority: "https://login.microsoftonline.com/common",
            })
        );
        jest.restoreAllMocks();
    });

    afterEach(() => {
        if (watcher) {
            watcher.close();
        }
    });

    it("Constructor tests builds default token cache", async () => {
        const tokenCache = new TokenCache(storage, logger);
        expect(tokenCache).toBeInstanceOf(TokenCache);
        expect(tokenCache.hasChanged()).toEqual(false);
        expect(await tokenCache.getAllAccounts()).toEqual([]);
    });

    it("TokenCache serialize/deserialize", () => {
        const cache = require("./cache-test-files/default-cache.json");
        const tokenCache = new TokenCache(storage, logger);

        tokenCache.deserialize(JSON.stringify(cache));
        expect(tokenCache.hasChanged()).toEqual(true);

        const tokenCacheAfterSerialization = tokenCache.serialize();
        expect(JSON.parse(tokenCacheAfterSerialization)).toEqual(cache);
        expect(tokenCache.hasChanged()).toEqual(false);
    });

    it("TokenCache should not fail when attempting to deserialize an empty string", () => {
        const cache = "";
        const tokenCache = new TokenCache(storage, logger);

        tokenCache.deserialize(cache);
        expect(tokenCache.hasChanged()).toEqual(false);
    });

    it("TokenCache serialize/deserialize, does not remove unrecognized entities", () => {
        const cache = require("./cache-test-files/cache-unrecognized-entities.json");
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
        const cache = require("./cache-test-files/cache-unrecognized-entities.json");

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
        expect(tokenCacheAfterSerialization.Unrecognized_Entity).toEqual(
            cache.Unrecognized_Entity
        );
    });

    it("TokenCache beforeCacheAccess and afterCacheAccess", async () => {
        const beforeCacheAccess = async (context: TokenCacheContext) => {
            context.tokenCache.deserialize(
                await promises.readFile(
                    "./test/cache/cache-test-files/cache-unrecognized-entities.json",
                    "utf-8"
                )
            );
        };
        const cachePath = "./test/cache/cache-test-files/temp-cache.json";
        const afterCacheAccess = async (context: TokenCacheContext) => {
            await promises.writeFile(cachePath, context.tokenCache.serialize());
        };

        const cachePlugin: ICachePlugin = {
            beforeCacheAccess,
            afterCacheAccess,
        };

        const tokenCache = new TokenCache(storage, logger, cachePlugin);

        const mockTokenCacheContextInstance = {
            hasChanged: false,
            cache: tokenCache,
            cacheHasChanged: false,
            tokenCache,
        };

        jest.spyOn(msalCommon, "TokenCacheContext").mockImplementation(
            () => mockTokenCacheContextInstance as unknown as TokenCacheContext
        );

        const accounts = await tokenCache.getAllAccounts();
        expect(msalCommon.TokenCacheContext).toHaveBeenCalled();
        expect(accounts.length).toBe(1);
        expect(require("./cache-test-files/temp-cache.json")).toEqual(
            require("./cache-test-files/cache-unrecognized-entities.json")
        );

        // try and clean up
        try {
            await promises.unlink(cachePath);
        } catch (err) {
            const errnoException = err as NodeJS.ErrnoException;
            if (errnoException.code == "ENOENT") {
                console.log(
                    "Tried to delete temp cache file but it does not exist"
                );
            }
        }
    });

    it("getAllAccounts doesn't write to cache", async () => {
        const cachePath =
            "./test/cache/cache-test-files/cache-unrecognized-entities.json";
        if (existsSync(cachePath)) {
            watcher = watch(cachePath, (eventType: string) => {
                if (eventType === "change") {
                    throw new Error("test cache changed");
                }
            });
        } else {
            throw new Error("error in watching test cache");
        }

        const beforeCacheAccess = jest.fn(
            async (context: TokenCacheContext) => {
                if (context.hasChanged == true) {
                    throw new Error("hasChanged should be false");
                }
                return promises.readFile(cachePath, "utf-8").then((data) => {
                    context.tokenCache.deserialize(data);
                });
            }
        );

        const afterCacheAccess = jest.fn(async (context: TokenCacheContext) => {
            if (context.hasChanged == true) {
                throw new Error("hasChanged should be false");
            }
            return Promise.resolve();
        });

        const cachePlugin: ICachePlugin = {
            beforeCacheAccess,
            afterCacheAccess,
        };

        const tokenCache = new TokenCache(storage, logger, cachePlugin);

        const accounts = await tokenCache.getAllAccounts();
        expect(accounts.length).toBe(1);
        expect(beforeCacheAccess).toHaveBeenCalled();
        expect(afterCacheAccess).toHaveBeenCalled();
    });

    it("should return an empty KV store if TokenCache is empty", () => {
        const tokenCache = new TokenCache(storage, logger);

        expect(tokenCache.getKVStore()).toEqual({});
    });

    it("should return stored entities in KV store", () => {
        const cache: JsonCache = require("./cache-test-files/default-cache.json");
        const tokenCache = new TokenCache(storage, logger);

        tokenCache.deserialize(JSON.stringify(cache));

        const expectedCachedEntities = Deserializer.deserializeAllCache(cache);

        const kvStore = tokenCache.getKVStore();

        Object.values(expectedCachedEntities).forEach(
            (expectedCacheSection) => {
                Object.keys(expectedCacheSection).forEach((cacheKey) => {
                    expect(kvStore[cacheKey]).toEqual(
                        expectedCacheSection[cacheKey]
                    );
                });
            }
        );
    });
});

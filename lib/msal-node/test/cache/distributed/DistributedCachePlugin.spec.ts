/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DistributedCachePlugin } from "../../../src/cache/distributed/DistributedCachePlugin.js";
import {
    AccountEntity,
    ICachePlugin,
    TokenCacheContext,
} from "@azure/msal-common";
import { TokenCache } from "../../../src/cache/TokenCache.js";
import {
    MockCache,
    MOCK_CACHE_STRING,
    MOCK_PARTITION_KEY,
    MOCK_CACHE_STORAGE,
} from "../cacheConstants.js";
import { IPartitionManager } from "../../../src/cache/distributed/IPartitionManager.js";
import { ICacheClient } from "../../../src/cache/distributed/ICacheClient.js";

describe("Distributed Cache Plugin Tests for msal-node", () => {
    let distributedCachePluginInstance: ICachePlugin;
    let cacheHasChanged = true;
    const tokenCache = {
        serialize: jest.fn().mockImplementation((): string => {
            cacheHasChanged = false;
            return MOCK_CACHE_STRING();
        }),
        deserialize: jest.fn(),
        getKVStore: jest.fn().mockImplementation(() => ({
            [MockCache.idTKey]: MockCache.idT,
            [MockCache.accKey]: MockCache.acc,
        })),
        getAllAccounts: jest
            .fn()
            .mockImplementation(async () => [MockCache.acc]),
        removeAccount: jest.fn().mockImplementation(async () => {
            const cacheStorage = MOCK_CACHE_STORAGE;

            (cacheStorage[MOCK_PARTITION_KEY].Account as any) = {};
            (cacheStorage[MOCK_PARTITION_KEY].IdToken as any) = {};
            (cacheStorage[MOCK_PARTITION_KEY].AccessToken as any) = {};
            (cacheStorage[MOCK_PARTITION_KEY].RefreshToken as any) = {};
            (cacheStorage[MOCK_PARTITION_KEY].AppMetadata as any) = {};

            cacheHasChanged = true;
        }),
        hasChanged: jest.fn().mockImplementation(() => cacheHasChanged),
    } as unknown as TokenCache;
    const tokenCacheContext = {
        cacheHasChanged,
        tokenCache,
    } as unknown as TokenCacheContext;
    const partitionManager = {
        getKey: jest
            .fn()
            .mockImplementation(
                async (): Promise<string> => MOCK_PARTITION_KEY
            ),
        extractKey: jest
            .fn()
            .mockImplementation(
                async (accountEntity: AccountEntity): Promise<string> =>
                    accountEntity.homeAccountId
            ),
    } as IPartitionManager;
    const cacheClient = {
        get: jest
            .fn()
            .mockImplementation(
                async (_: string): Promise<string> => MOCK_CACHE_STRING()
            ),
        set: jest
            .fn()
            .mockImplementation(
                async (_: string, __: string): Promise<string> => "OK"
            ),
    } as ICacheClient;

    beforeEach(() => {
        distributedCachePluginInstance = new DistributedCachePlugin(
            cacheClient,
            partitionManager
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("properly handles beforeCacheAccess", async () => {
        // Make the action
        await distributedCachePluginInstance.beforeCacheAccess(
            tokenCacheContext
        );

        // Confirm the intended effects
        expect(partitionManager.getKey).toHaveBeenCalled();
        expect(cacheClient.get).toHaveBeenCalledWith(MOCK_PARTITION_KEY);
        expect(tokenCache.deserialize).toHaveBeenCalledWith(
            MOCK_CACHE_STRING()
        );
    });

    it("properly handles afterCacheAccess", async () => {
        // Make the action
        await distributedCachePluginInstance.afterCacheAccess(
            tokenCacheContext
        );

        // Confirm the intended effects
        expect(tokenCache.getKVStore).toHaveBeenCalled();
        expect(partitionManager.extractKey).toHaveBeenCalledWith(MockCache.acc);
        expect(tokenCache.serialize).toHaveBeenCalled();
        expect(cacheClient.set).toHaveBeenCalledWith(
            MockCache.acc.homeAccountId,
            MOCK_CACHE_STRING()
        );
    });

    it("removes the specified account from the cache", async () => {
        const accounts = await tokenCache.getAllAccounts();
        await tokenCache.removeAccount(accounts[0]);
        expect(tokenCache.hasChanged()).toEqual(true);

        const tokenCacheAfterSerialization = JSON.parse(tokenCache.serialize());

        expect(tokenCache.hasChanged()).toEqual(false);
        expect(
            tokenCacheAfterSerialization[MOCK_PARTITION_KEY].Account
        ).toEqual({});
        expect(
            tokenCacheAfterSerialization[MOCK_PARTITION_KEY].RefreshToken
        ).toEqual({});
        expect(
            tokenCacheAfterSerialization[MOCK_PARTITION_KEY].AccessToken
        ).toEqual({});
        expect(
            tokenCacheAfterSerialization[MOCK_PARTITION_KEY].IdToken
        ).toEqual({});
    });
});

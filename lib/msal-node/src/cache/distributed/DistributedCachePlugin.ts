/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccountEntity,
    ICachePlugin,
    TokenCacheContext,
} from "@azure/msal-common/node";
import { TokenCache } from "../TokenCache.js";
import { IPartitionManager } from "./IPartitionManager.js";
import { ICacheClient } from "./ICacheClient.js";

/**
 * Cache plugin that serializes data to the cache and deserializes data from the cache
 * @public
 */
export class DistributedCachePlugin implements ICachePlugin {
    private client: ICacheClient;
    private partitionManager: IPartitionManager;

    constructor(client: ICacheClient, partitionManager: IPartitionManager) {
        this.client = client;
        this.partitionManager = partitionManager;
    }

    /**
     * Deserializes the cache before accessing it
     * @param cacheContext - TokenCacheContext
     */
    public async beforeCacheAccess(
        cacheContext: TokenCacheContext
    ): Promise<void> {
        const partitionKey = await this.partitionManager.getKey();
        const cacheData = await this.client.get(partitionKey);
        cacheContext.tokenCache.deserialize(cacheData);
    }

    /**
     * Serializes the cache after accessing it
     * @param cacheContext - TokenCacheContext
     */
    public async afterCacheAccess(
        cacheContext: TokenCacheContext
    ): Promise<void> {
        const { cacheHasChanged, tokenCache } = cacheContext;

        if (!cacheHasChanged) return;

        const kvStore = (tokenCache as TokenCache).getKVStore();

        const accountEntities = Object.values(kvStore).filter((value) =>
            AccountEntity.isAccountEntity(value as object)
        );

        const partitionKey = await this.getPartitionKey(
            accountEntities as AccountEntity[]
        );

        if (partitionKey) {
            const serializedTokenCache = tokenCache.serialize();

            await this.client.set(partitionKey, serializedTokenCache);
        }
    }

    private async getPartitionKey(
        accountEntities: AccountEntity[]
    ): Promise<string> {
        if (accountEntities.length) {
            return this.partitionManager.extractKey(accountEntities[0]);
        }

        return this.partitionManager.getKey();
    }
}

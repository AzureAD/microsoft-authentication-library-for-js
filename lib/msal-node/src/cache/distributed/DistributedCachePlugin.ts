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

export class DistributedCachePlugin implements ICachePlugin {
    private client: ICacheClient;
    private partitionManager: IPartitionManager;

    constructor(client: ICacheClient, partitionManager: IPartitionManager) {
        this.client = client;
        this.partitionManager = partitionManager;
    }

    public async beforeCacheAccess(
        cacheContext: TokenCacheContext
    ): Promise<void> {
        const partitionKey = await this.partitionManager.getKey();
        const cacheData = await this.client.get(partitionKey);
        cacheContext.tokenCache.deserialize(cacheData);
    }

    public async afterCacheAccess(
        cacheContext: TokenCacheContext
    ): Promise<void> {
        if (cacheContext.cacheHasChanged) {
            const kvStore = (
                cacheContext.tokenCache as TokenCache
            ).getKVStore();
            const accountEntities = Object.values(kvStore).filter((value) =>
                AccountEntity.isAccountEntity(value as object)
            );

            if (accountEntities.length > 0) {
                const accountEntity = accountEntities[0] as AccountEntity;
                const partitionKey = await this.partitionManager.extractKey(
                    accountEntity
                );

                await this.client.set(
                    partitionKey,
                    cacheContext.tokenCache.serialize()
                );
            }
        }
    }
}

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICachePlugin, TokenCacheContext } from "@azure/msal-common";
import { TokenCache } from "../../TokenCache";
import { IPartitionManager } from "../IPartitionManager";
import { IPersistenceManager } from "../IPersistenceManager";
import { IRedisClient } from "./IRedisClient";
import { RedisPersistenceManager } from "./RedisPersistenceManager";

export class RedisCachePlugin implements ICachePlugin {
    private partitionManager?: IPartitionManager;
    private persistenceManager: IPersistenceManager;

    constructor(client: IRedisClient, partitionManager?: IPartitionManager) {
        this.partitionManager = partitionManager;
        this.persistenceManager = new RedisPersistenceManager(client);
    }
  
    public async beforeCacheAccess(cacheContext: TokenCacheContext): Promise<void> {
        if (this.partitionManager) {
            const partitionKey = await this.partitionManager.getKey();
            const cacheData = await this.persistenceManager.get(partitionKey);
            cacheContext.tokenCache.deserialize(cacheData);
        }
    }
  
    public async afterCacheAccess(cacheContext: TokenCacheContext): Promise<void> {
        if (cacheContext.cacheHasChanged && this.partitionManager) {
            const kvStore = (cacheContext.tokenCache as TokenCache).getKVStore();
  
            if (Object.keys(kvStore).length >= 2) {
                const accountEntity = Object.values(kvStore)[1]; // the second entity is the account
                const partitionKey = await this.partitionManager.extractKey(accountEntity);
                          
                await this.persistenceManager.set(partitionKey, cacheContext.tokenCache.serialize());           
            }
        }
    }

    public setPartitionManager(partitionManager: IPartitionManager): void {
        this.partitionManager = partitionManager;
    }
}

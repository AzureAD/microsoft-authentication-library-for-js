/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IPartitionManager } from "../IPartitionManager";
import { IPersistenceManager } from "../IPersistenceManager";
import { IRedisClient } from "./IRedisClient";
import { RedisPersistenceManager } from "./RedisPersistenceManager";

export class RedisCachePlugin {
    private partitionManager: IPartitionManager;
    private persistenceManager: IPersistenceManager;

    constructor(client: IRedisClient, partitionManager: IPartitionManager) {
      this.partitionManager = partitionManager;
      this.persistenceManager = new RedisPersistenceManager(client);
    }
  
    public async beforeCacheAccess(cacheContext) {
      const partitionKey = await this.partitionManager.getKey();
      const cacheData = await this.persistenceManager.get(partitionKey);
      cacheContext.tokenCache.deserialize(cacheData);
    }
  
    public async afterCacheAccess(cacheContext) {
        if (cacheContext.cacheHasChanged) {
            const kvStore = cacheContext.tokenCache.getKVStore();
  
            if (Object.keys(kvStore).length >= 2) {
                const accountEntity = Object.values(kvStore)[1]; // the second entity is the account
                const partitionKey = await this.partitionManager.extractKey(accountEntity);
                          
                await this.persistenceManager.set(partitionKey, cacheContext.tokenCache.serialize());           
            }
        }
    }
}
  
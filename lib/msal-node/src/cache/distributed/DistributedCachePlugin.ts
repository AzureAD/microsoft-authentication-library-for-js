/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountEntity, ICachePlugin, TokenCacheContext } from "@azure/msal-common";
import { TokenCache } from "../TokenCache";
import { IPartitionManager } from "./IPartitionManager";
import { ICacheClient } from "./ICacheClient";

export class DistributedCachePlugin implements ICachePlugin {
    private client: ICacheClient;
    private partitionManager?: IPartitionManager;

    constructor(client: ICacheClient, partitionManager?: IPartitionManager) {
        this.client = client;
        this.partitionManager = partitionManager;
    }
  
    public async beforeCacheAccess(cacheContext: TokenCacheContext): Promise<void> {
        if (this.partitionManager) {
            const partitionKey = await this.partitionManager.getKey();
            const cacheData = await this.client.get(partitionKey);
            cacheContext.tokenCache.deserialize(cacheData);
        }
    }
  
    public async afterCacheAccess(cacheContext: TokenCacheContext): Promise<void> {
        if (cacheContext.cacheHasChanged && this.partitionManager) {
            const kvStore = (cacheContext.tokenCache as TokenCache).getKVStore();
  
            if (Object.keys(kvStore).length >= 2) {
                const accountEntity = Object.values(kvStore)[1] as AccountEntity; // the second entity is the account
                const partitionKey = await this.partitionManager.extractKey(accountEntity);
                          
                await this.client.set(partitionKey, cacheContext.tokenCache.serialize());           
            }
        }
    }
}

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ICacheClient,
    ICachePlugin,
    TokenCacheContext,
} from "@azure/msal-node";
import { performance } from "perf_hooks";

/**
 * This class implements the ICachePlugin interface, which allows for the
 * customization of the token cache. For more information, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/caching.md
 */
class CustomCachePlugin implements ICachePlugin {
    private client: ICacheClient;
    private partitionKey: string;

    constructor(client: ICacheClient, partitionKey: string) {
        this.client = client;
        this.partitionKey = partitionKey;
    }

    public async beforeCacheAccess(
        cacheContext: TokenCacheContext
    ): Promise<void> {
        performance.mark("beforeCacheAccess-start");
        const cacheData = await this.client.get(this.partitionKey);
        cacheContext.tokenCache.deserialize(cacheData);
        performance.mark("beforeCacheAccess-end");
        performance.measure(
            "beforeCacheAccess",
            "beforeCacheAccess-start",
            "beforeCacheAccess-end"
        );
    }

    public async afterCacheAccess(
        cacheContext: TokenCacheContext
    ): Promise<void> {
        if (cacheContext.cacheHasChanged) {
            performance.mark("afterCacheAccess-start");
            await this.client.set(
                this.partitionKey,
                cacheContext.tokenCache.serialize()
            );
            performance.mark("afterCacheAccess-end");
            performance.measure(
                "afterCacheAccess",
                "afterCacheAccess-start",
                "afterCacheAccess-end"
            );
        }
    }
}

export default CustomCachePlugin;

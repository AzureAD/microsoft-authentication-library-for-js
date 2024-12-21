/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICacheClient } from "@azure/msal-node";
import { RedisClientType } from "redis";

const CACHE_TTL = 60 * 60 * 24 * 90; // 90 days max
const MAX_MEMORY = "4000mb";
const EVICTION_POLICY = "volatile-lru";

const EMPTY_STRING = "";

/**
 * Simple persistence client helper, using Redis (node-redis). You must have redis installed
 * on your machine and have redis server listening. Note that this is only for illustration,
 * and you'll need to consider cache eviction policies and handle cache server connection
 * issues. For more information, visit: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/caching.md
 */
class RedisClientWrapper implements ICacheClient {
    cacheClient: RedisClientType;

    constructor(cacheClient: RedisClientType) {
        this.cacheClient = cacheClient;

        /**
         * Example eviction policy. If you are using Azure Redis, follow the best practices
         * outlined at: https://learn.microsoft.com/azure/azure-cache-for-redis/cache-best-practices-memory-management
         */
        this.cacheClient.configSet("maxmemory", MAX_MEMORY);
        this.cacheClient.configSet("maxmemory-policy", EVICTION_POLICY);
    }

    /**
     * Get the data from cache given partition key
     * @param key cache partition key
     * @returns
     */
    public async get(key: string): Promise<string> {
        try {
            return (await this.cacheClient.get(key)) || EMPTY_STRING;
        } catch (error) {
            console.error(error);
        }

        return EMPTY_STRING;
    }

    /**
     * Set the data in cache given partition key and value
     * @param key cache partition key
     * @param value value to be set in cache
     * @returns
     */
    public async set(key: string, value: string): Promise<string> {
        try {
            return (
                (await this.cacheClient.set(key, value, {
                    EX: CACHE_TTL,
                })) || EMPTY_STRING
            );
        } catch (error) {
            console.error(error);
        }

        return EMPTY_STRING;
    }
}

export default RedisClientWrapper;

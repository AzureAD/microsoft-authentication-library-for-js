/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface ICacheClient {
    /**
     * Retrieve the value from the cache
     * 
     * @param key string
     * @returns Promise<string>
     */
    get(key: string): Promise<string>

    /**
     * Save the required value using the provided key to cache
     * 
     * @param key string
     * @param value string
     * @returns Promise<string>
     */
    set(key: string, value: string): Promise<string>
}

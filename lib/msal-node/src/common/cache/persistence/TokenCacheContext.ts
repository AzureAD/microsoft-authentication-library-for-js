/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ISerializableTokenCache } from "../interface/ISerializableTokenCache.js";

// Monotonic versions prevent overlapping cache accesses from clearing an
// earlier context's obligation to persist a bounded-cache trim.
const persistenceChangeVersions = new WeakMap<
    ISerializableTokenCache,
    number
>();

/** @internal */
export function notifyTokenCacheContextPersistenceChanged(
    tokenCache: ISerializableTokenCache
): void {
    persistenceChangeVersions.set(
        tokenCache,
        (persistenceChangeVersions.get(tokenCache) || 0) + 1
    );
}

/**
 * This class instance helps track the memory changes facilitating
 * decisions to read from and write to the persistent cache
 */ export class TokenCacheContext {
    /**
     * boolean indicating cache change
     */
    hasChanged: boolean;
    /**
     * serializable token cache interface
     */
    cache: ISerializableTokenCache;
    private readonly persistenceChangeVersion: number;

    constructor(tokenCache: ISerializableTokenCache, hasChanged: boolean) {
        this.cache = tokenCache;
        this.hasChanged = hasChanged;
        this.persistenceChangeVersion =
            persistenceChangeVersions.get(tokenCache) || 0;
    }

    /**
     * boolean which indicates the changes in cache
     */
    get cacheHasChanged(): boolean {
        return (
            this.hasChanged ||
            (persistenceChangeVersions.get(this.cache) || 0) >
                this.persistenceChangeVersion
        );
    }

    /**
     * function to retrieve the token cache
     */
    get tokenCache(): ISerializableTokenCache {
        return this.cache;
    }
}

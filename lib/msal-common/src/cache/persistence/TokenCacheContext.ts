/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ISerializableTokenCache } from "../interface/ISerializableTokenCache";

export class TokenCacheContext {
    hasChanged: boolean;
    cache: ISerializableTokenCache;

    constructor(tokenCache: ISerializableTokenCache, hasChanged: boolean) {
        this.cache = tokenCache;
        this.hasChanged = hasChanged;
    }

    get cacheHasChanged(): boolean {
        return this.hasChanged;
    }

    get tokenCache(): ISerializableTokenCache {
        return this.cache;
    }
}

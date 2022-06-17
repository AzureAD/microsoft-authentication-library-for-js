/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ValidCacheType } from "@azure/msal-common";

/**
 * Key value store for in-memory cache
 * @public
 */
export type CacheKVStore = Map<string, ValidCacheType>;

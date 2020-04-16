/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccessTokenEntity } from "../unifiedCache/entities/AccessTokenEntity";
import { IdTokenEntity } from "../unifiedCache/entities/IdTokenEntity";
import { RefreshTokenEntity } from "../unifiedCache/entities/RefreshTokenEntity";
import { AccountEntity } from "../unifiedCache/entities/AccountEntity";
import { AppMetadataEntity } from "../unifiedCache/entities/AppMetadataEntity";

/**
 * Key-Value type to support queryParams, extraQueryParams and claims
 */
export type StringDict = { [key: string]: string };
export type AccessTokenCache = { [key: string]: AccessTokenEntity };
export type IdTokenCache = { [key: string]: IdTokenEntity };
export type RefreshTokenCache = { [key: string]: RefreshTokenEntity };
export type AccountCache = { [key: string]: AccountEntity };
export type AppMetadataCache = { [key: string]: AppMetadataEntity };

export type CacheEntity = AccessTokenCache | IdTokenCache | RefreshTokenCache | AccessTokenCache | AppMetadataCache;

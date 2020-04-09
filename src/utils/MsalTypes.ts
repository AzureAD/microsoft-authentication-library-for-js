/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccessTokenEntity } from "../uCache/entities/AccessTokenEntity";
import { IdTokenEntity } from "../uCache/entities/IdTokenEntity";
import { RefreshTokenEntity } from "../uCache/entities/RefreshTokenEntity";
import { AccountEntity } from "../uCache/entities/AccountEntity";
import { AppMetadataEntity } from "../uCache/entities/AppMetadataEntity";

/**
 * Key-Value type to support queryParams, extraQueryParams and claims
 */
export type StringDict = { [key: string]: string };
export type AccessTokenCache = { [key: string]: AccessTokenEntity };
export type IdTokenCache = { [key: string]: IdTokenEntity };
export type RefreshTokenCache = { [key: string]: RefreshTokenEntity };
export type AccountCache = { [key: string]: AccountEntity };
export type AppMetadataCache = { [key: string]: AppMetadataEntity };

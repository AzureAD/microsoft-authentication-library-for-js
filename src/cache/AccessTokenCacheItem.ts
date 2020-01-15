/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
// Token Cache
import { AccessTokenKey } from "./AccessTokenKey";
import { AccessTokenValue } from "./AccessTokenValue";

/**
 * Access token cache item which is used to manage tokens and token renewal.
 */
export class AccessTokenCacheItem {

    key: AccessTokenKey;
    value: AccessTokenValue;

    constructor(key: AccessTokenKey, value: AccessTokenValue) {
        this.key = key;
        this.value = value;
    }
}

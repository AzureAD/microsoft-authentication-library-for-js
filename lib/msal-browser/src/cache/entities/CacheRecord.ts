/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccessTokenEntity,
    AccountEntity,
    AppMetadataEntity,
    CacheRecord as CommonCacheRecord,
    IdTokenEntity,
    RefreshTokenEntity,
} from "@azure/msal-common";

export class CacheRecord extends CommonCacheRecord {
    account: AccountEntity;

    constructor(
        accountEntity: AccountEntity,
        idTokenEntity?: IdTokenEntity | null,
        accessTokenEntity?: AccessTokenEntity | null,
        refreshTokenEntity?: RefreshTokenEntity | null,
        appMetadataEntity?: AppMetadataEntity | null
    ) {
        super(
            accountEntity,
            idTokenEntity,
            accessTokenEntity,
            refreshTokenEntity,
            appMetadataEntity
        );
        this.account = accountEntity;
    }
}

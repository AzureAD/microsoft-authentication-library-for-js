/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IdTokenEntity } from "./IdTokenEntity";
import { AccessTokenEntity } from "./AccessTokenEntity";
import { RefreshTokenEntity } from "./RefreshTokenEntity";
import { AccountEntity } from "./AccountEntity";
import { AppMetadataEntity } from "./AppMetadataEntity";

export class CacheRecord {
    account: AccountEntity;
    idToken: IdTokenEntity;
    accessToken: AccessTokenEntity;
    refreshToken: RefreshTokenEntity;
    appMetadata: AppMetadataEntity;

    constructor(accountEntity?: AccountEntity, idTokenEntity?: IdTokenEntity, accessTokenEntity?: AccessTokenEntity, refreshTokenEntity?: RefreshTokenEntity, appMetadataEntity?: AppMetadataEntity) {
        this.account = accountEntity;
        this.idToken = idTokenEntity;
        this.accessToken = accessTokenEntity;
        this.refreshToken = refreshTokenEntity;
        this.appMetadata = appMetadataEntity;
    }
}

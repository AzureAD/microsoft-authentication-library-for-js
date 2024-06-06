/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IdTokenEntity } from "./IdTokenEntity";
import { AccessTokenEntity } from "./AccessTokenEntity";
import { RefreshTokenEntity } from "./RefreshTokenEntity";
import { AccountEntity } from "./AccountEntity";
import { AppMetadataEntity } from "./AppMetadataEntity";

/** @internal */
export class CacheRecord {
    account: AccountEntity | null;
    idToken: IdTokenEntity | null;
    accessToken: AccessTokenEntity | null;
    refreshToken: RefreshTokenEntity | null;
    appMetadata: AppMetadataEntity | null;

    constructor(
        accountEntity?: AccountEntity | null,
        idTokenEntity?: IdTokenEntity | null,
        accessTokenEntity?: AccessTokenEntity | null,
        refreshTokenEntity?: RefreshTokenEntity | null,
        appMetadataEntity?: AppMetadataEntity | null
    ) {
        this.account = accountEntity || null;
        this.idToken = idTokenEntity || null;
        this.accessToken = accessTokenEntity || null;
        this.refreshToken = refreshTokenEntity || null;
        this.appMetadata = appMetadataEntity || null;
    }
}

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountEntity } from "./AccountEntity";
import { IdTokenEntity } from "./IdTokenEntity";
import { AccessTokenEntity } from "./AccessTokenEntity";
import { RefreshTokenEntity } from "./RefreshTokenEntity";

export class CacheRecord {
    account: AccountEntity;
    idToken: IdTokenEntity;
    accessToken: AccessTokenEntity;
    refreshToken: RefreshTokenEntity;
}

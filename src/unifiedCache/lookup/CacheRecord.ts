/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountEntity } from "../entities/AccountEntity";
import { IdTokenEntity } from "../entities/IdTokenEntity";
import { AccessTokenEntity } from "../entities/AccessTokenEntity";
import { RefreshTokenEntity } from "../entities/RefreshTokenEntity";

export type CacheRecord = {
    account: AccountEntity,
    idToken: IdTokenEntity,
    accessToken: AccessTokenEntity,
    refreshToken: RefreshTokenEntity
};

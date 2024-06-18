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
export type CacheRecord = {
    account?: AccountEntity | null;
    idToken?: IdTokenEntity | null;
    accessToken?: AccessTokenEntity | null;
    refreshToken?: RefreshTokenEntity | null;
    appMetadata?: AppMetadataEntity | null;
};

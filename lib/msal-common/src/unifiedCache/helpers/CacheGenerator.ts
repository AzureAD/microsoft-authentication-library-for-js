/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccessTokenEntity } from "../entities/AccessTokenEntity";
import { IdTokenEntity } from "../entities/IdTokenEntity";
import { RefreshTokenEntity } from "../entities/RefreshTokenEntity";

export class CacheGenerator {
    // create refresh token cache
    static createRefreshTokenCacheEntity(): RefreshTokenEntity {
        return null;
    }

    // // create access token cache
    // static createAccessTokenCacheEntity(
    //     homeAccountId: string,
    //     request: Request,
    //     secret: string,
    //     expiresOn: string
    // ): AccessTokenCache {
    //     let accessToken: AccessTokenCache = new AccessTokenCache();

    //     accessToken.credentialType = "AccessToken";
    //     accessToken.homeAccountId = homeAccountId;
    //     accessToken.environment = request.authority;
    //     accessToken.clientId = request.clientId;
    //     accessToken.secret = secret;
    //     accessToken.realm = request.tenant;
    //     accessToken.target = request.scopes;

    //     const date = new Date();
    //     const currentTime = date.getMilliseconds() / 1000;
    //     accessToken.cachedAt = currentTime.toString();
    //     accessToken.expiresOn = expiresOn;
    //     accessToken.extendedExpiresOn = expiresOn;

    //     return accessToken;
    // }

    // // create id token cache
    // static createIdTokenCacheEntity(
    //     homeAccountId: string,
    //     request: Request,
    //     secret: string
    // ): IdTokenCache {
    //     let idToken: IdTokenCache = new IdTokenCache();

    //     idToken.credentialType = "IdToken";
    //     idToken.homeAccountId = homeAccountId;
    //     idToken.environment = request.authority;
    //     idToken.clientId = request.clientId;
    //     idToken.secret = secret;
    //     idToken.realm = request.tenant;

    //     return idToken;
    // }
}


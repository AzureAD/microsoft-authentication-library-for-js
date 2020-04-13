/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccessTokenEntity } from "../entities/AccessTokenEntity";
import { IdTokenEntity } from "../entities/IdTokenEntity";
import { RefreshTokenEntity } from "../entities/RefreshTokenEntity";
import { AuthorizationCodeRequest } from '../../request/AuthorizationCodeRequest';

export class TokenCacheGenerator {

    // create access token cache
    static createAccessTokenCacheEntity(clientId: string, request: AuthorizationCodeRequest, secret: string, expiresOn: string): AccessTokenEntity {
        let accessToken: AccessTokenEntity = new AccessTokenEntity();

        // accessToken.credentialType = "AccessToken";
        // accessToken.homeAccountId = homeAccountId;

        // accessToken.environment = request.authority;
        // accessToken.clientId = clientId;

        // accessToken.secret = secret;

        // accessToken.realm = request.tenant;
        // accessToken.target = request.scopes;

        // const date = new Date();
        // const currentTime = date.getMilliseconds() / 1000;
        // accessToken.cachedAt = currentTime.toString();
        // accessToken.expiresOn = expiresOn;
        // accessToken.extendedExpiresOn = expiresOn;

        return accessToken;
    }

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

    // create refresh token cache
    static createRefreshTokenCacheEntity(): RefreshTokenEntity {
        return null;
    }
}


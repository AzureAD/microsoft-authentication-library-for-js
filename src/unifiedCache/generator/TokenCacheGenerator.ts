/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccessTokenEntity } from "../entities/AccessTokenEntity";
import { IdTokenEntity } from "../entities/IdTokenEntity";
import { RefreshTokenEntity } from "../entities/RefreshTokenEntity";
import { AuthenticationResult } from "../../response/AuthenticationResult";

export class TokenCacheGenerator {
    /**
     * Create IdTokenEntity
     * @param homeAccountId
     * @param authenticationResult
     * @param clientId
     * @param authority
     */
    static createIdTokenEntity(
        homeAccountId: string,
        authenticationResult: AuthenticationResult,
        clientId: string,
        environment: string
    ): IdTokenEntity {
        const idTokenEntity = new IdTokenEntity();

        idTokenEntity.credentialType = "IdToken";
        idTokenEntity.homeAccountId = homeAccountId;
        idTokenEntity.environment = environment;
        idTokenEntity.clientId = clientId;
        idTokenEntity.secret = authenticationResult.idToken;
        idTokenEntity.realm = authenticationResult.tenantId;

        return idTokenEntity;
    }

    /**
     * Create AccessTokenEntity
     * @param homeAccountId
     * @param authenticationResult
     * @param clientId
     * @param authority
     */
    static createAccessTokenEntity(
        homeAccountId: string,
        authenticationResult: AuthenticationResult,
        clientId: string,
        environment: string
    ): AccessTokenEntity {
        const atEntity: AccessTokenEntity = new AccessTokenEntity();

        atEntity.homeAccountId = homeAccountId;
        atEntity.credentialType = "AccessToken";
        atEntity.secret = authenticationResult.accessToken;

        const date = new Date();
        const currentTime = date.getMilliseconds() / 1000;
        atEntity.cachedAt = currentTime.toString();

        // TODO: Crosscheck the exact conversion UTC
        // Token expiry time.
        // This value should be  calculated based on the current UTC time measured locally and the value  expires_in Represented as a string in JSON.
        atEntity.expiresOn = authenticationResult.expiresOn
            .getMilliseconds()
            .toString();
        atEntity.extendedExpiresOn = authenticationResult.extExpiresOn
            .getMilliseconds()
            .toString();

        atEntity.environment = environment;
        atEntity.clientId = clientId;
        atEntity.realm = authenticationResult.tenantId;
        atEntity.target = authenticationResult.scopes.join(" ");

        return atEntity;
    }

    /**
     * Create RefreshTokenEntity
     * @param homeAccountId
     * @param authenticationResult
     * @param clientId
     * @param authority
     */
    static createRefreshTokenEntity(
        homeAccountId: string,
        authenticationResult: AuthenticationResult,
        clientId: string,
        environment: string
    ): RefreshTokenEntity {
        const rtEntity = new RefreshTokenEntity();

        rtEntity.clientId = clientId;
        rtEntity.credentialType = "RefreshToken";
        rtEntity.environment = environment;
        rtEntity.homeAccountId = homeAccountId;
        rtEntity.secret = authenticationResult.refreshToken;

        if (authenticationResult.familyId)
            rtEntity.familyId = authenticationResult.familyId;

        return rtEntity;
    }
}

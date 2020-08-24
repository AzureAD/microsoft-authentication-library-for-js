/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CredentialEntity } from "./CredentialEntity";
import { CredentialType } from "../../utils/Constants";
import { CacheManager } from "../CacheManager";
import { AccountInfo } from "../../account/AccountInfo";

/**
 * REFRESH_TOKEN Cache
 * 
 * Key:Value Schema:
 * 
 * Key Example: uid.utid-login.microsoftonline.com-refreshtoken-clientId--
 * 
 * Value:
 * {
 *      homeAccountId: home account identifier for the auth scheme,
 *      environment: entity that issued the token, represented as a full host
 *      credentialType: Type of credential as a string, can be one of the following: RefreshToken, AccessToken, IdToken, Password, Cookie, Certificate, Other
 *      clientId: client ID of the application
 *      secret: Actual credential as a string
 *      familyId: Family ID identifier, '1' represents Microsoft Family
 *      realm: Full tenant or organizational identifier that the account belongs to
 *      target: Permissions that are included in the token, or for refresh tokens, the resource identifier.
 * }
 */
export class RefreshTokenEntity extends CredentialEntity {
    familyId?: string;

    /**
     * Create RefreshTokenEntity
     * @param homeAccountId
     * @param authenticationResult
     * @param clientId
     * @param authority
     */
    static createRefreshTokenEntity(
        homeAccountId: string,
        environment: string,
        refreshToken: string,
        clientId: string,
        familyId?: string
    ): RefreshTokenEntity {
        const rtEntity = new RefreshTokenEntity();

        rtEntity.clientId = clientId;
        rtEntity.credentialType = CredentialType.REFRESH_TOKEN;
        rtEntity.environment = environment;
        rtEntity.homeAccountId = homeAccountId;
        rtEntity.secret = refreshToken;

        if (familyId)
            rtEntity.familyId = familyId;

        return rtEntity;
    }

    /**
     * fetches refreshToken from cache if present
     * @param request
     */
    static readRefreshTokenFromCache(cacheManager: CacheManager, clientId: string, account: AccountInfo): RefreshTokenEntity {
        const refreshTokenKey: string = CredentialEntity.generateCredentialCacheKey(
            account.homeAccountId,
            account.environment,
            CredentialType.REFRESH_TOKEN,
            clientId
        );
        return cacheManager.getCredential(refreshTokenKey) as RefreshTokenEntity;
    }
}

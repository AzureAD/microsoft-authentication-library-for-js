/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CredentialEntity } from "./CredentialEntity";
import { AuthenticationScheme, CredentialType } from "../../utils/Constants";
import { StringUtils } from "../../utils/StringUtils";
import { ClientAuthError } from "../../error/ClientAuthError";

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
    tokenType?: string;
    kid?: string; // for Bound Refresh Tokens

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
        familyId?: string,
        oboAssertion?: string,
        kid?: string,
        tokenType?: string
    ): RefreshTokenEntity {
        const rtEntity = new RefreshTokenEntity();

        rtEntity.clientId = clientId;
        rtEntity.credentialType = CredentialType.REFRESH_TOKEN;
        rtEntity.environment = environment;
        rtEntity.homeAccountId = homeAccountId;
        rtEntity.secret = refreshToken;
        rtEntity.oboAssertion = oboAssertion;

        if (familyId) {
            rtEntity.familyId = familyId;
        }

        rtEntity.tokenType = StringUtils.isEmpty(tokenType) ? AuthenticationScheme.BEARER : tokenType;

        // Create Refresh Token With AuthScheme instead of bearer refresh token
        if (rtEntity.tokenType === AuthenticationScheme.BOUND) {
            rtEntity.credentialType = CredentialType.REFRESH_TOKEN_WITH_AUTH_SCHEME;
            // Make sure keyId is present and add it to credential
            if (!kid) {
                throw ClientAuthError.createNoStkKidInServerResponseError();
            }
            rtEntity.kid = kid;
        }

        return rtEntity;
    }

    /**
     * Validates an entity: checks for all expected params
     * @param entity
     */
    static isRefreshTokenEntity(entity: object): boolean {

        if (!entity) {
            return false;
        }

        return (
            entity.hasOwnProperty("homeAccountId") &&
            entity.hasOwnProperty("environment") &&
            entity.hasOwnProperty("credentialType") &&
            entity.hasOwnProperty("clientId") &&
            entity.hasOwnProperty("secret") &&
            entity["credentialType"] === CredentialType.REFRESH_TOKEN || entity["credentialType"] === CredentialType.REFRESH_TOKEN_WITH_AUTH_SCHEME
        );
    }
}

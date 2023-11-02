/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { extractTokenClaims } from "../../account/AuthToken";
import { TokenClaims } from "../../account/TokenClaims";
import {
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../../error/ClientAuthError";
import {
    AuthenticationScheme,
    CredentialType,
    SERVER_TELEM_CONSTANTS,
    Separators,
} from "../../utils/Constants";
import { TimeUtils } from "../../utils/TimeUtils";
import { AccessTokenEntity } from "../entities/AccessTokenEntity";
import { CredentialEntity } from "../entities/CredentialEntity";
import { IdTokenEntity } from "../entities/IdTokenEntity";
import { RefreshTokenEntity } from "../entities/RefreshTokenEntity";

/**
 * Cache Key: <home_account_id>-<environment>-<credential_type>-<client_id or familyId>-<realm>-<scopes>-<claims hash>-<scheme>
 * IdToken Example: uid.utid-login.microsoftonline.com-idtoken-app_client_id-contoso.com
 * AccessToken Example: uid.utid-login.microsoftonline.com-accesstoken-app_client_id-contoso.com-scope1 scope2--pop
 * RefreshToken Example: uid.utid-login.microsoftonline.com-refreshtoken-1-contoso.com
 * @param credentialEntity
 * @returns
 */
export function generateCredentialKey(
    credentialEntity: CredentialEntity
): string {
    const credentialKey = [
        generateAccountId(credentialEntity),
        generateCredentialId(credentialEntity),
        generateTarget(credentialEntity),
        generateClaimsHash(credentialEntity),
        generateScheme(credentialEntity),
    ];

    return credentialKey.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
}

/**
 * Create IdTokenEntity
 * @param homeAccountId
 * @param authenticationResult
 * @param clientId
 * @param authority
 */
export function createIdTokenEntity(
    homeAccountId: string,
    environment: string,
    idToken: string,
    clientId: string,
    tenantId: string
): IdTokenEntity {
    const idTokenEntity: IdTokenEntity = {
        credentialType: CredentialType.ID_TOKEN,
        homeAccountId: homeAccountId,
        environment: environment,
        clientId: clientId,
        secret: idToken,
        realm: tenantId,
    };

    return idTokenEntity;
}

/**
 * Create AccessTokenEntity
 * @param homeAccountId
 * @param environment
 * @param accessToken
 * @param clientId
 * @param tenantId
 * @param scopes
 * @param expiresOn
 * @param extExpiresOn
 */
export function createAccessTokenEntity(
    homeAccountId: string,
    environment: string,
    accessToken: string,
    clientId: string,
    tenantId: string,
    scopes: string,
    expiresOn: number,
    extExpiresOn: number,
    base64Decode: (input: string) => string,
    refreshOn?: number,
    tokenType?: AuthenticationScheme,
    userAssertionHash?: string,
    keyId?: string,
    requestedClaims?: string,
    requestedClaimsHash?: string
): AccessTokenEntity {
    const atEntity: AccessTokenEntity = {
        homeAccountId: homeAccountId,
        credentialType: CredentialType.ACCESS_TOKEN,
        secret: accessToken,
        cachedAt: TimeUtils.nowSeconds().toString(),
        expiresOn: expiresOn.toString(),
        extendedExpiresOn: extExpiresOn.toString(),
        environment: environment,
        clientId: clientId,
        realm: tenantId,
        target: scopes,
        tokenType: tokenType || AuthenticationScheme.BEARER,
    };

    if (userAssertionHash) {
        atEntity.userAssertionHash = userAssertionHash;
    }

    if (refreshOn) {
        atEntity.refreshOn = refreshOn.toString();
    }

    if (requestedClaims) {
        atEntity.requestedClaims = requestedClaims;
        atEntity.requestedClaimsHash = requestedClaimsHash;
    }

    /*
     * Create Access Token With Auth Scheme instead of regular access token
     * Cast to lower to handle "bearer" from ADFS
     */
    if (
        atEntity.tokenType?.toLowerCase() !==
        AuthenticationScheme.BEARER.toLowerCase()
    ) {
        atEntity.credentialType = CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME;
        switch (atEntity.tokenType) {
            case AuthenticationScheme.POP:
                // Make sure keyId is present and add it to credential
                const tokenClaims: TokenClaims | null = extractTokenClaims(
                    accessToken,
                    base64Decode
                );
                if (!tokenClaims?.cnf?.kid) {
                    throw createClientAuthError(
                        ClientAuthErrorCodes.tokenClaimsCnfRequiredForSignedJwt
                    );
                }
                atEntity.keyId = tokenClaims.cnf.kid;
                break;
            case AuthenticationScheme.SSH:
                atEntity.keyId = keyId;
        }
    }

    return atEntity;
}

/**
 * Create RefreshTokenEntity
 * @param homeAccountId
 * @param authenticationResult
 * @param clientId
 * @param authority
 */
export function createRefreshTokenEntity(
    homeAccountId: string,
    environment: string,
    refreshToken: string,
    clientId: string,
    familyId?: string,
    userAssertionHash?: string
): RefreshTokenEntity {
    const rtEntity: RefreshTokenEntity = {
        credentialType: CredentialType.REFRESH_TOKEN,
        homeAccountId: homeAccountId,
        environment: environment,
        clientId: clientId,
        secret: refreshToken,
    };

    if (userAssertionHash) {
        rtEntity.userAssertionHash = userAssertionHash;
    }

    if (familyId) {
        rtEntity.familyId = familyId;
    }

    return rtEntity;
}

export function isCredentialEntity(entity: object): boolean {
    return (
        entity.hasOwnProperty("homeAccountId") &&
        entity.hasOwnProperty("environment") &&
        entity.hasOwnProperty("credentialType") &&
        entity.hasOwnProperty("clientId") &&
        entity.hasOwnProperty("secret")
    );
}

/**
 * Validates an entity: checks for all expected params
 * @param entity
 */
export function isAccessTokenEntity(entity: object): boolean {
    if (!entity) {
        return false;
    }

    return (
        isCredentialEntity(entity) &&
        entity.hasOwnProperty("realm") &&
        entity.hasOwnProperty("target") &&
        (entity["credentialType"] === CredentialType.ACCESS_TOKEN ||
            entity["credentialType"] ===
                CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME)
    );
}

/**
 * Validates an entity: checks for all expected params
 * @param entity
 */
export function isIdTokenEntity(entity: object): boolean {
    if (!entity) {
        return false;
    }

    return (
        isCredentialEntity(entity) &&
        entity.hasOwnProperty("realm") &&
        entity["credentialType"] === CredentialType.ID_TOKEN
    );
}

/**
 * Validates an entity: checks for all expected params
 * @param entity
 */
export function isRefreshTokenEntity(entity: object): boolean {
    if (!entity) {
        return false;
    }

    return (
        isCredentialEntity(entity) &&
        entity["credentialType"] === CredentialType.REFRESH_TOKEN
    );
}

/**
 * Generate Account Id key component as per the schema: <home_account_id>-<environment>
 */
function generateAccountId(credentialEntity: CredentialEntity): string {
    const accountId: Array<string> = [
        credentialEntity.homeAccountId,
        credentialEntity.environment,
    ];
    return accountId.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
}

/**
 * Generate Credential Id key component as per the schema: <credential_type>-<client_id>-<realm>
 */
function generateCredentialId(credentialEntity: CredentialEntity): string {
    const clientOrFamilyId =
        credentialEntity.credentialType === CredentialType.REFRESH_TOKEN
            ? credentialEntity.familyId || credentialEntity.clientId
            : credentialEntity.clientId;
    const credentialId: Array<string> = [
        credentialEntity.credentialType,
        clientOrFamilyId,
        credentialEntity.realm || "",
    ];

    return credentialId.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
}

/**
 * Generate target key component as per schema: <target>
 */
function generateTarget(credentialEntity: CredentialEntity): string {
    return (credentialEntity.target || "").toLowerCase();
}

/**
 * Generate requested claims key component as per schema: <requestedClaims>
 */
function generateClaimsHash(credentialEntity: CredentialEntity): string {
    return (credentialEntity.requestedClaimsHash || "").toLowerCase();
}

/**
 * Generate scheme key componenet as per schema: <scheme>
 */
function generateScheme(credentialEntity: CredentialEntity): string {
    /*
     * PoP Tokens and SSH certs include scheme in cache key
     * Cast to lowercase to handle "bearer" from ADFS
     */
    return credentialEntity.tokenType &&
        credentialEntity.tokenType.toLowerCase() !==
            AuthenticationScheme.BEARER.toLowerCase()
        ? credentialEntity.tokenType.toLowerCase()
        : "";
}

/**
 * validates if a given cache entry is "Telemetry", parses <key,value>
 * @param key
 * @param entity
 */
export function isServerTelemetryEntity(key: string, entity?: object): boolean {
    const validateKey: boolean =
        key.indexOf(SERVER_TELEM_CONSTANTS.CACHE_KEY) === 0;
    let validateEntity: boolean = true;

    if (entity) {
        validateEntity =
            entity.hasOwnProperty("failedRequests") &&
            entity.hasOwnProperty("errors") &&
            entity.hasOwnProperty("cacheHits");
    }

    return validateKey && validateEntity;
}

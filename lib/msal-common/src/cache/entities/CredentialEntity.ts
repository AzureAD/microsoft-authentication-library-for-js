/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Separators, CredentialType, CacheType, Constants } from "../../utils/Constants";
import { ClientAuthError } from "../../error/ClientAuthError";

/**
 * Base type for credentials to be stored in the cache: eg: ACCESS_TOKEN, ID_TOKEN etc
 *
 * Key:Value Schema:
 *
 * Key: <home_account_id*>-<environment>-<credential_type>-<client_id>-<realm*>-<target*>
 *
 * Value Schema:
 * {
 *      homeAccountId: home account identifier for the auth scheme,
 *      environment: entity that issued the token, represented as a full host
 *      credentialType: Type of credential as a string, can be one of the following: RefreshToken, AccessToken, IdToken, Password, Cookie, Certificate, Other
 *      clientId: client ID of the application
 *      secret: Actual credential as a string
 *      familyId: Family ID identifier, usually only used for refresh tokens
 *      realm: Full tenant or organizational identifier that the account belongs to
 *      target: Permissions that are included in the token, or for refresh tokens, the resource identifier.
 *      oboAssertion: access token passed in as part of OBO request
 * }
 */
export class CredentialEntity {
    homeAccountId: string;
    environment: string;
    credentialType: CredentialType;
    clientId: string;
    secret: string;
    familyId?: string;
    realm?: string;
    target?: string;
    oboAssertion?: string;

    /**
     * Generate Account Id key component as per the schema: <home_account_id>-<environment>
     */
    generateAccountId(): string {
        return CredentialEntity.generateAccountIdForCacheKey(this.homeAccountId, this.environment);
    }

    /**
     * Generate Credential Id key component as per the schema: <credential_type>-<client_id>-<realm>
     */
    generateCredentialId(): string {
        return CredentialEntity.generateCredentialIdForCacheKey(
            this.credentialType,
            this.clientId,
            this.realm,
            this.familyId
        );
    }

    /**
     * Generate target key component as per schema: <target>
     */
    generateTarget(): string {
        return CredentialEntity.generateTargetForCacheKey(this.target);
    }

    /**
     * generates credential key
     */
    generateCredentialKey(): string {
        return CredentialEntity.generateCredentialCacheKey(
            this.homeAccountId,
            this.environment,
            this.credentialType,
            this.clientId,
            this.realm,
            this.target,
            this.familyId
        );
    }

    /**
     * returns the type of the cache (in this case credential)
     */
    generateType(): number {
        switch (this.credentialType) {
            case CredentialType.ID_TOKEN:
                return CacheType.ID_TOKEN;
            case CredentialType.ACCESS_TOKEN:
                return CacheType.ACCESS_TOKEN;
            case CredentialType.REFRESH_TOKEN:
                return CacheType.REFRESH_TOKEN;
            default: {
                throw ClientAuthError.createUnexpectedCredentialTypeError();
            }
        }
    }

    /**
     * helper function to return `CredentialType`
     * @param key
     */
    static getCredentialType(key: string): string {
        // First keyword search will match all "AccessToken" and "AccessToken_With_AuthScheme" credentials
        if (key.indexOf(CredentialType.ACCESS_TOKEN.toLowerCase()) !== -1) {
            // Perform second search to differentiate between "AccessToken" and "AccessToken_With_AuthScheme" credential types
            if (key.indexOf(CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME.toLowerCase()) !== -1) {
                return CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME;
            }
            return CredentialType.ACCESS_TOKEN;
        } else if (key.indexOf(CredentialType.ID_TOKEN.toLowerCase()) !== -1) {
            return CredentialType.ID_TOKEN;
        } else if (key.indexOf(CredentialType.REFRESH_TOKEN.toLowerCase()) !== -1) {
            // Perform second search to differentiate between "RefreshToken" and "RefreshToken_With_AuthScheme" credential types
            if (key.indexOf(CredentialType.REFRESH_TOKEN_WITH_AUTH_SCHEME.toLowerCase()) !== -1) {
                return CredentialType.REFRESH_TOKEN_WITH_AUTH_SCHEME;
            }
            return CredentialType.REFRESH_TOKEN;
        }

        return Constants.NOT_DEFINED;
    }

    /**
     * generates credential key
     */
    static generateCredentialCacheKey(
        homeAccountId: string,
        environment: string,
        credentialType: CredentialType,
        clientId: string,
        realm?: string,
        target?: string,
        familyId?: string
    ): string {
        const credentialKey = [
            this.generateAccountIdForCacheKey(homeAccountId, environment),
            this.generateCredentialIdForCacheKey(credentialType, clientId, realm, familyId),
            this.generateTargetForCacheKey(target),
        ];

        return credentialKey.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }

    /**
     * generates Account Id for keys
     * @param homeAccountId
     * @param environment
     */
    private static generateAccountIdForCacheKey(
        homeAccountId: string,
        environment: string
    ): string {
        const accountId: Array<string> = [homeAccountId, environment];
        return accountId.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }

    /**
     * Generates Credential Id for keys
     * @param credentialType
     * @param realm
     * @param clientId
     * @param familyId
     */
    private static generateCredentialIdForCacheKey(
        credentialType: CredentialType,
        clientId: string,
        realm?: string,
        familyId?: string
    ): string {
        const clientOrFamilyId =
            credentialType === CredentialType.REFRESH_TOKEN
                ? familyId || clientId
                : clientId;
        const credentialId: Array<string> = [
            credentialType,
            clientOrFamilyId,
            realm || "",
        ];

        return credentialId.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }

    /**
     * Generate target key component as per schema: <target>
     */
    private static generateTargetForCacheKey(scopes?: string): string {
        return (scopes || "").toLowerCase();
    }
}

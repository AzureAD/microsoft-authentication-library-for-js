"use strict";
/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialEntity = void 0;
var Constants_1 = require("../../utils/Constants");
var ClientAuthError_1 = require("../../error/ClientAuthError");
/**
 * Base type for credentials to be stored in the cache: eg: ACCESS_TOKEN, ID_TOKEN etc
 *
 * Key:Value Schema:
 *
 * Key: <home_account_id*>-<environment>-<credential_type>-<client_id>-<realm*>-<target*>-<requestedClaims*>-<scheme*>
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
 *      tokenType: Matches the authentication scheme for which the token was issued (i.e. Bearer or pop)
 *      requestedClaimsHash: Matches the SHA 256 hash of the claims object included in the token request
 * }
 */
var CredentialEntity = /** @class */ (function () {
    function CredentialEntity() {
    }
    /**
     * Generate Account Id key component as per the schema: <home_account_id>-<environment>
     */
    CredentialEntity.prototype.generateAccountId = function () {
        return CredentialEntity.generateAccountIdForCacheKey(this.homeAccountId, this.environment);
    };
    /**
     * Generate Credential Id key component as per the schema: <credential_type>-<client_id>-<realm>
     */
    CredentialEntity.prototype.generateCredentialId = function () {
        return CredentialEntity.generateCredentialIdForCacheKey(this.credentialType, this.clientId, this.realm, this.familyId);
    };
    /**
     * Generate target key component as per schema: <target>
     */
    CredentialEntity.prototype.generateTarget = function () {
        return CredentialEntity.generateTargetForCacheKey(this.target);
    };
    /**
     * generates credential key
     */
    CredentialEntity.prototype.generateCredentialKey = function () {
        return CredentialEntity.generateCredentialCacheKey(this.homeAccountId, this.environment, this.credentialType, this.clientId, this.realm, this.target, this.familyId, this.tokenType, this.requestedClaimsHash);
    };
    /**
     * returns the type of the cache (in this case credential)
     */
    CredentialEntity.prototype.generateType = function () {
        switch (this.credentialType) {
            case Constants_1.CredentialType.ID_TOKEN:
                return Constants_1.CacheType.ID_TOKEN;
            case Constants_1.CredentialType.ACCESS_TOKEN:
            case Constants_1.CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME:
                return Constants_1.CacheType.ACCESS_TOKEN;
            case Constants_1.CredentialType.REFRESH_TOKEN:
                return Constants_1.CacheType.REFRESH_TOKEN;
            default: {
                throw ClientAuthError_1.ClientAuthError.createUnexpectedCredentialTypeError();
            }
        }
    };
    /**
     * helper function to return `CredentialType`
     * @param key
     */
    CredentialEntity.getCredentialType = function (key) {
        // First keyword search will match all "AccessToken" and "AccessToken_With_AuthScheme" credentials
        if (key.indexOf(Constants_1.CredentialType.ACCESS_TOKEN.toLowerCase()) !== -1) {
            // Perform second search to differentiate between "AccessToken" and "AccessToken_With_AuthScheme" credential types
            if (key.indexOf(Constants_1.CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME.toLowerCase()) !== -1) {
                return Constants_1.CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME;
            }
            return Constants_1.CredentialType.ACCESS_TOKEN;
        }
        else if (key.indexOf(Constants_1.CredentialType.ID_TOKEN.toLowerCase()) !== -1) {
            return Constants_1.CredentialType.ID_TOKEN;
        }
        else if (key.indexOf(Constants_1.CredentialType.REFRESH_TOKEN.toLowerCase()) !== -1) {
            return Constants_1.CredentialType.REFRESH_TOKEN;
        }
        return Constants_1.Constants.NOT_DEFINED;
    };
    /**
     * generates credential key
     * <home_account_id*>-\<environment>-<credential_type>-<client_id>-<realm\*>-<target\*>-<scheme\*>
     */
    CredentialEntity.generateCredentialCacheKey = function (homeAccountId, environment, credentialType, clientId, realm, target, familyId, tokenType, requestedClaimsHash) {
        var credentialKey = [
            this.generateAccountIdForCacheKey(homeAccountId, environment),
            this.generateCredentialIdForCacheKey(credentialType, clientId, realm, familyId),
            this.generateTargetForCacheKey(target),
            this.generateClaimsHashForCacheKey(requestedClaimsHash),
            this.generateSchemeForCacheKey(tokenType)
        ];
        return credentialKey.join(Constants_1.Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    };
    /**
     * generates Account Id for keys
     * @param homeAccountId
     * @param environment
     */
    CredentialEntity.generateAccountIdForCacheKey = function (homeAccountId, environment) {
        var accountId = [homeAccountId, environment];
        return accountId.join(Constants_1.Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    };
    /**
     * Generates Credential Id for keys
     * @param credentialType
     * @param realm
     * @param clientId
     * @param familyId
     */
    CredentialEntity.generateCredentialIdForCacheKey = function (credentialType, clientId, realm, familyId) {
        var clientOrFamilyId = credentialType === Constants_1.CredentialType.REFRESH_TOKEN
            ? familyId || clientId
            : clientId;
        var credentialId = [
            credentialType,
            clientOrFamilyId,
            realm || "",
        ];
        return credentialId.join(Constants_1.Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    };
    /**
     * Generate target key component as per schema: <target>
     */
    CredentialEntity.generateTargetForCacheKey = function (scopes) {
        return (scopes || "").toLowerCase();
    };
    /**
     * Generate requested claims key component as per schema: <requestedClaims>
     */
    CredentialEntity.generateClaimsHashForCacheKey = function (requestedClaimsHash) {
        return (requestedClaimsHash || "").toLowerCase();
    };
    /**
     * Generate scheme key componenet as per schema: <scheme>
     */
    CredentialEntity.generateSchemeForCacheKey = function (tokenType) {
        /*
         * PoP Tokens and SSH certs include scheme in cache key
         * Cast to lowercase to handle "bearer" from ADFS
         */
        return (tokenType && tokenType.toLowerCase() !== Constants_1.AuthenticationScheme.BEARER.toLowerCase()) ? tokenType.toLowerCase() : "";
    };
    return CredentialEntity;
}());
exports.CredentialEntity = CredentialEntity;
//# sourceMappingURL=CredentialEntity.js.map
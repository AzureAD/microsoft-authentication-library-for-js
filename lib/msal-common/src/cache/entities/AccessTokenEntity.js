"use strict";
/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessTokenEntity = void 0;
var tslib_1 = require("tslib");
var CredentialEntity_1 = require("./CredentialEntity");
var Constants_1 = require("../../utils/Constants");
var TimeUtils_1 = require("../../utils/TimeUtils");
var StringUtils_1 = require("../../utils/StringUtils");
var AuthToken_1 = require("../../account/AuthToken");
var ClientAuthError_1 = require("../../error/ClientAuthError");
/**
 * ACCESS_TOKEN Credential Type
 *
 * Key:Value Schema:
 *
 * Key Example: uid.utid-login.microsoftonline.com-accesstoken-clientId-contoso.com-user.read
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
 *      cachedAt: Absolute device time when entry was created in the cache.
 *      expiresOn: Token expiry time, calculated based on current UTC time in seconds. Represented as a string.
 *      extendedExpiresOn: Additional extended expiry time until when token is valid in case of server-side outage. Represented as string in UTC seconds.
 *      keyId: used for POP and SSH tokenTypes
 *      tokenType: Type of the token issued. Usually "Bearer"
 * }
 */
var AccessTokenEntity = /** @class */ (function (_super) {
    (0, tslib_1.__extends)(AccessTokenEntity, _super);
    function AccessTokenEntity() {
        return _super !== null && _super.apply(this, arguments) || this;
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
    AccessTokenEntity.createAccessTokenEntity = function (homeAccountId, environment, accessToken, clientId, tenantId, scopes, expiresOn, extExpiresOn, cryptoUtils, refreshOn, tokenType, oboAssertion, keyId, requestedClaims, requestedClaimsHash) {
        var _a, _b;
        var atEntity = new AccessTokenEntity();
        atEntity.homeAccountId = homeAccountId;
        atEntity.credentialType = Constants_1.CredentialType.ACCESS_TOKEN;
        atEntity.secret = accessToken;
        var currentTime = TimeUtils_1.TimeUtils.nowSeconds();
        atEntity.cachedAt = currentTime.toString();
        /*
         * Token expiry time.
         * This value should be  calculated based on the current UTC time measured locally and the value  expires_in Represented as a string in JSON.
         */
        atEntity.expiresOn = expiresOn.toString();
        atEntity.extendedExpiresOn = extExpiresOn.toString();
        if (refreshOn) {
            atEntity.refreshOn = refreshOn.toString();
        }
        atEntity.environment = environment;
        atEntity.clientId = clientId;
        atEntity.realm = tenantId;
        atEntity.target = scopes;
        atEntity.oboAssertion = oboAssertion;
        atEntity.tokenType = StringUtils_1.StringUtils.isEmpty(tokenType) ? Constants_1.AuthenticationScheme.BEARER : tokenType;
        if (requestedClaims) {
            atEntity.requestedClaims = requestedClaims;
            atEntity.requestedClaimsHash = requestedClaimsHash;
        }
        /*
         * Create Access Token With Auth Scheme instead of regular access token
         * Cast to lower to handle "bearer" from ADFS
         */
        if (((_a = atEntity.tokenType) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== Constants_1.AuthenticationScheme.BEARER.toLowerCase()) {
            atEntity.credentialType = Constants_1.CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME;
            switch (atEntity.tokenType) {
                case Constants_1.AuthenticationScheme.POP:
                    // Make sure keyId is present and add it to credential
                    var tokenClaims = AuthToken_1.AuthToken.extractTokenClaims(accessToken, cryptoUtils);
                    if (!((_b = tokenClaims === null || tokenClaims === void 0 ? void 0 : tokenClaims.cnf) === null || _b === void 0 ? void 0 : _b.kid)) {
                        throw ClientAuthError_1.ClientAuthError.createTokenClaimsRequiredError();
                    }
                    atEntity.keyId = tokenClaims.cnf.kid;
                    break;
                case Constants_1.AuthenticationScheme.SSH:
                    atEntity.keyId = keyId;
            }
        }
        return atEntity;
    };
    /**
     * Validates an entity: checks for all expected params
     * @param entity
     */
    AccessTokenEntity.isAccessTokenEntity = function (entity) {
        if (!entity) {
            return false;
        }
        return (entity.hasOwnProperty("homeAccountId") &&
            entity.hasOwnProperty("environment") &&
            entity.hasOwnProperty("credentialType") &&
            entity.hasOwnProperty("realm") &&
            entity.hasOwnProperty("clientId") &&
            entity.hasOwnProperty("secret") &&
            entity.hasOwnProperty("target") &&
            (entity["credentialType"] === Constants_1.CredentialType.ACCESS_TOKEN || entity["credentialType"] === Constants_1.CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME));
    };
    return AccessTokenEntity;
}(CredentialEntity_1.CredentialEntity));
exports.AccessTokenEntity = AccessTokenEntity;
//# sourceMappingURL=AccessTokenEntity.js.map
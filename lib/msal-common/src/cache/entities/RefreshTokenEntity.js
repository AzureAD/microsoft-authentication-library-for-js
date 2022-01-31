"use strict";
/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenEntity = void 0;
var tslib_1 = require("tslib");
var CredentialEntity_1 = require("./CredentialEntity");
var Constants_1 = require("../../utils/Constants");
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
var RefreshTokenEntity = /** @class */ (function (_super) {
    (0, tslib_1.__extends)(RefreshTokenEntity, _super);
    function RefreshTokenEntity() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Create RefreshTokenEntity
     * @param homeAccountId
     * @param authenticationResult
     * @param clientId
     * @param authority
     */
    RefreshTokenEntity.createRefreshTokenEntity = function (homeAccountId, environment, refreshToken, clientId, familyId, oboAssertion) {
        var rtEntity = new RefreshTokenEntity();
        rtEntity.clientId = clientId;
        rtEntity.credentialType = Constants_1.CredentialType.REFRESH_TOKEN;
        rtEntity.environment = environment;
        rtEntity.homeAccountId = homeAccountId;
        rtEntity.secret = refreshToken;
        rtEntity.oboAssertion = oboAssertion;
        if (familyId)
            rtEntity.familyId = familyId;
        return rtEntity;
    };
    /**
     * Validates an entity: checks for all expected params
     * @param entity
     */
    RefreshTokenEntity.isRefreshTokenEntity = function (entity) {
        if (!entity) {
            return false;
        }
        return (entity.hasOwnProperty("homeAccountId") &&
            entity.hasOwnProperty("environment") &&
            entity.hasOwnProperty("credentialType") &&
            entity.hasOwnProperty("clientId") &&
            entity.hasOwnProperty("secret") &&
            entity["credentialType"] === Constants_1.CredentialType.REFRESH_TOKEN);
    };
    return RefreshTokenEntity;
}(CredentialEntity_1.CredentialEntity));
exports.RefreshTokenEntity = RefreshTokenEntity;
//# sourceMappingURL=RefreshTokenEntity.js.map
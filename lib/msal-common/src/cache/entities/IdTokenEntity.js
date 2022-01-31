"use strict";
/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdTokenEntity = void 0;
var tslib_1 = require("tslib");
var CredentialEntity_1 = require("./CredentialEntity");
var Constants_1 = require("../../utils/Constants");
/**
 * ID_TOKEN Cache
 *
 * Key:Value Schema:
 *
 * Key Example: uid.utid-login.microsoftonline.com-idtoken-clientId-contoso.com-
 *
 * Value Schema:
 * {
 *      homeAccountId: home account identifier for the auth scheme,
 *      environment: entity that issued the token, represented as a full host
 *      credentialType: Type of credential as a string, can be one of the following: RefreshToken, AccessToken, IdToken, Password, Cookie, Certificate, Other
 *      clientId: client ID of the application
 *      secret: Actual credential as a string
 *      realm: Full tenant or organizational identifier that the account belongs to
 * }
 */
var IdTokenEntity = /** @class */ (function (_super) {
    (0, tslib_1.__extends)(IdTokenEntity, _super);
    function IdTokenEntity() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Create IdTokenEntity
     * @param homeAccountId
     * @param authenticationResult
     * @param clientId
     * @param authority
     */
    IdTokenEntity.createIdTokenEntity = function (homeAccountId, environment, idToken, clientId, tenantId, oboAssertion) {
        var idTokenEntity = new IdTokenEntity();
        idTokenEntity.credentialType = Constants_1.CredentialType.ID_TOKEN;
        idTokenEntity.homeAccountId = homeAccountId;
        idTokenEntity.environment = environment;
        idTokenEntity.clientId = clientId;
        idTokenEntity.secret = idToken;
        idTokenEntity.realm = tenantId;
        idTokenEntity.oboAssertion = oboAssertion;
        return idTokenEntity;
    };
    /**
     * Validates an entity: checks for all expected params
     * @param entity
     */
    IdTokenEntity.isIdTokenEntity = function (entity) {
        if (!entity) {
            return false;
        }
        return (entity.hasOwnProperty("homeAccountId") &&
            entity.hasOwnProperty("environment") &&
            entity.hasOwnProperty("credentialType") &&
            entity.hasOwnProperty("realm") &&
            entity.hasOwnProperty("clientId") &&
            entity.hasOwnProperty("secret") &&
            entity["credentialType"] === Constants_1.CredentialType.ID_TOKEN);
    };
    return IdTokenEntity;
}(CredentialEntity_1.CredentialEntity));
exports.IdTokenEntity = IdTokenEntity;
//# sourceMappingURL=IdTokenEntity.js.map
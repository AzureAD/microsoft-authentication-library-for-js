/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TokenClaims, TimeUtils, AuthToken } from "@azure/msal-common";
import { CryptoProvider } from "@azure/msal-node";
import { AuthorityConstants, AuthorityStrings } from "./Constants";
import { AppSettings } from "./Types";

export class TokenValidator {
    private appSettings: AppSettings;
    private cryptoProvider: CryptoProvider;

    /**
     * @param {AppSettings} appSettings
     * @param {Configuration} msalConfig
     * @constructor
     */
    constructor(appSettings: AppSettings, cryptoProvider: CryptoProvider) {
        this.appSettings = appSettings;
        this.cryptoProvider = cryptoProvider;
    }

    /**
     * Validates the signature of a JWT token
     * @param {string} rawAuthToken
     * @returns {Promise}
     */
    async validateTokenSignature(rawAuthToken: string): Promise<boolean> {
        /**
         * The OpenId Connect spec states:
         *
         *  "If the ID Token is received via direct communication between the Client and the Token Endpoint
         *  (which it is in this flow), the TLS server validation MAY be used to validate the issuer in place
         *  of checking the token signature." (https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation)
         *
         * If your application does make use of hybrid flow and/or does not serve over HTTPS, you need to validate
         * the signature of the token below and return the result as boolean below:
         */

        return true;
    };

    /**
     * Validates a JWT id token
     * @param {string} rawIdToken: raw Id token
     * @returns {Promise}
     */
    async validateIdToken(rawIdToken: string): Promise<boolean> {

        /**
         * A JWT token validation is a 2-step process comprising of: (1) signature validation, (2) claims validation
         * For more information, visit: https://learn.microsoft.com/azure/active-directory/develop/access-tokens#validate-tokens
         */

        try {
            const isTokenSignatureValid = await this.validateTokenSignature(rawIdToken);

            if (!isTokenSignatureValid) {
                return false;
            }

            const decodedIdTokenPayload = new AuthToken(rawIdToken, this.cryptoProvider).claims;
            return this.validateIdTokenClaims(decodedIdTokenPayload);
        } catch (error) {
            console.log(error);
            return false;
        }
    };

    /**
     * Validates the id token for a set of claims
     * @param {IdTokenClaims} idTokenClaims: decoded id token claims
     * @returns {boolean}
     */
    validateIdTokenClaims(idTokenClaims: TokenClaims): boolean {
        const now = TimeUtils.nowSeconds(); // current time in seconds

        /**
         * if a multi-tenant application only allows sign-in from specific tenants who have signed up
         * for their service, then it must check either the issuer value or the tid claim value
         * in the token to make sure that tenant is in their list of subscribers. If a multi-tenant
         * application only deals with individuals and doesn’t make any access decisions based on tenants,
         * then it can ignore the issuer value altogether. For more information, visit:
         * https://learn.microsoft.com/azure/active-directory/develop/howto-convert-app-to-be-multi-tenant#update-your-code-to-handle-multiple-issuer-values
         */
        const isMultiTenant = Object.values(AuthorityConstants).some(val => val === this.appSettings.credentials.tenantId);

        /**
         * At the very least, check for issuer, audience and expiry dates.
         * For more information on validating id tokens claims, visit:
         * https://docs.microsoft.com/azure/active-directory/develop/id-tokens#validating-an-id_token
         */
        const checkIssuer = isMultiTenant ? true : idTokenClaims.iss === `${AuthorityStrings.AAD}${this.appSettings.credentials.tenantId}/v2.0` ? true : false
        const checkAudience = idTokenClaims.aud === this.appSettings.credentials.clientId ? true : false;
        const checkTimestamp = idTokenClaims.iat <= now && idTokenClaims.exp >= now ? true : false;

        return checkIssuer && checkAudience && checkTimestamp;
    };
}

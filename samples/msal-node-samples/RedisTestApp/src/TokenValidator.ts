/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

import {
    StringUtils,
    Constants,
    TokenClaims
} from "@azure/msal-common";

import { Configuration } from "@azure/msal-node";

import {
    AppSettings,
    IdTokenClaims
} from "./Types";

import {
    ErrorMessages,
    AADAuthorityConstants
} from "./Constants";

export class TokenValidator {
    private appSettings: AppSettings;
    private msalConfig: Configuration;

    /**
     * @param {AppSettings} appSettings 
     * @param {Configuration} msalConfig
     * @constructor
     */
    constructor(appSettings: AppSettings, msalConfig: Configuration) {
        this.appSettings = appSettings;
        this.msalConfig = msalConfig;
    }

    /**
     * Verifies a given token's signature using jwks-rsa
     * @param {string} authToken 
     * @returns {Promise}
     */
    async verifyTokenSignature(authToken: string): Promise<TokenClaims | boolean> {
        if (StringUtils.isEmpty(authToken)) {
            console.log(ErrorMessages.TOKEN_NOT_FOUND);
            return false;
        }

        // we will first decode to get kid parameter in header
        let decodedToken;

        try {
            decodedToken = jwt.decode(authToken, { complete: true });
        } catch (error) {
            console.log(ErrorMessages.TOKEN_NOT_DECODED);
            console.log(error);
            return false;
        }

        // obtains signing keys from discovery endpoint
        let keys;

        try {
            keys = await this.getSigningKeys(decodedToken.header, decodedToken.payload.tid);
        } catch (error) {
            console.log(ErrorMessages.KEYS_NOT_OBTAINED);
            console.log(error);
            return false;
        }

        // verify the signature at header section using keys
        let verifiedToken: TokenClaims;

        try {
            verifiedToken = jwt.verify(authToken, keys);

            /**
             * if a multiplexer was used in place of tenantId i.e. if the app
             * is multi-tenant, the tenantId should be obtained from the user"s
             * token"s tid claim for verification purposes
             */
            if (
                this.appSettings.credentials.tenantId === AADAuthorityConstants.COMMON ||
                this.appSettings.credentials.tenantId === AADAuthorityConstants.ORGANIZATIONS ||
                this.appSettings.credentials.tenantId === AADAuthorityConstants.CONSUMERS
            ) {
                this.appSettings.credentials.tenantId = decodedToken.payload.tid;
            }

            return verifiedToken;
        } catch (error) {
            console.log(ErrorMessages.TOKEN_NOT_VERIFIED);
            console.log(error);
            return false;
        }
    };

    /**
     * Fetches signing keys of an access token
     * from the authority discovery endpoint
     * @param {Object} header: token header
     * @param {string} tid: tenant id
     * @returns {Promise}
     */
    private async getSigningKeys(header, tid: string): Promise<string> {
        let jwksUri;

        // Check if a B2C application i.e. app has b2cPolicies
        if (this.appSettings.policies) {
            jwksUri = `${this.msalConfig.auth.authority}/discovery/v2.0/keys`;
        } else {
            jwksUri = `https://${Constants.DEFAULT_AUTHORITY_HOST}/${tid}/discovery/v2.0/keys`;
        }

        const client = jwksClient({
            jwksUri: jwksUri,
        });

        return (await client.getSigningKeyAsync(header.kid)).getPublicKey();
    };

    /**
     * Verifies the access token for signature
     * @param {string} idToken: raw Id token
     * @returns {Promise}
     */
    async validateIdToken(idToken: string): Promise<boolean> {
        try {
            const verifiedToken = await this.verifyTokenSignature(idToken);

            if (verifiedToken) {
                return this.validateIdTokenClaims(verifiedToken as IdTokenClaims);
            } else {
                return false;
            }
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
    validateIdTokenClaims(idTokenClaims: IdTokenClaims): boolean {
        const now = Math.round(new Date().getTime() / 1000); // in UNIX format

        /**
         * At the very least, check for issuer, audience, issuer and expiry dates.
         * For more information on validating id tokens, visit:
         * https://docs.microsoft.com/azure/active-directory/develop/id-tokens#validating-an-id_token
         */
        const checkIssuer = idTokenClaims.iss.includes(this.appSettings.credentials.tenantId) ? true : false;
        const checkAudience = idTokenClaims.aud === this.msalConfig.auth.clientId ? true : false;
        const checkTimestamp = idTokenClaims.iat <= now && idTokenClaims.exp >= now ? true : false;

        return checkIssuer && checkAudience && checkTimestamp;
    };
}

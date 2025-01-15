/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import jwt from "jsonwebtoken";
import jwksClient, { JwksClient } from "jwks-rsa";
import { CryptoProvider, IdTokenClaims } from "@azure/msal-node";

import { AppConfig } from "./AuthProvider";

type AccessTokenClaims = IdTokenClaims & {
    scp?: string[];
};

/**
 * Provides basic validation for JWT access tokens. This is for demonstration purposes only.
 * In production, make sure to use a trusted token validation library instead.
 */
class TokenValidator {
    appConfig: AppConfig;

    private cryptoProvider: CryptoProvider;
    private keyClient: JwksClient;

    /**
     * @param {AppConfig} appConfig
     * @constructor
     */
    constructor(appConfig: AppConfig) {
        this.appConfig = appConfig;
        this.cryptoProvider = new CryptoProvider();

        this.keyClient = jwksClient({
            jwksUri: `${appConfig.instance}/${appConfig.tenantId}/discovery/v2.0/keys`,
        });
    }

    /**
     * Validates a JWT access token
     * @param {string} rawAccessToken
     * @returns {Promise}
     */
    async validateAccessToken(
        rawAccessToken: string,
        idTokenClaims: IdTokenClaims
    ): Promise<boolean> {
        /**
         * A JWT token validation is a 2-step process comprising of:
         *   (1) signature validation
         *   (2) claims validation

         * For more information, visit:
         * https://learn.microsoft.com/azure/active-directory/develop/access-tokens#validate-tokens
         */
        try {
            const isTokenSignatureValid = await this.validateTokenSignature(
                rawAccessToken
            );

            if (!isTokenSignatureValid) {
                return false;
            }

            return this.validateAccessTokenClaims(idTokenClaims);
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    /**
     * Validates the access token for a set of claims
     * @param {AccessTokenClaims} accessTokenClaims: decoded access token claims
     * @returns {boolean}
     */
    private validateAccessTokenClaims(
        accessTokenClaims: AccessTokenClaims
    ): boolean {
        const now = Math.round(new Date().getTime() / 1000.0); // current time in seconds

        /**
         * if a multi-tenant application only allows sign-in from specific tenants who have signed up
         * for their service, then it must check either the issuer value or the tid claim value
         * in the token to make sure that tenant is in their list of subscribers. If a multi-tenant
         * application only deals with individuals and doesn’t make any access decisions based on tenants,
         * then it can ignore the issuer value altogether. For more information, visit:
         * https://learn.microsoft.com/azure/active-directory/develop/howto-convert-app-to-be-multi-tenant#update-your-code-to-handle-multiple-issuer-values
         */
        const isMultiTenant = ["common", "organizations", "consumers"].some(
            (val) => this.appConfig.tenantId === val
        )
            ? true
            : false;

        /**
         * At the very least, check for issuer, audience and expiry dates. For more information
         * on validating access tokens claims, visit:
         * https://docs.microsoft.com/azure/active-directory/develop/access-tokens#validate-tokens
         */
        const checkIssuer = isMultiTenant
            ? true
            : accessTokenClaims.iss?.endsWith(`${this.appConfig.tenantId}/`)
            ? true
            : false;
        const checkAudience =
            accessTokenClaims.aud === this.appConfig.clientId ||
            accessTokenClaims.aud === `api://${this.appConfig.clientId}`
                ? true
                : false;
        const checkTimestamp =
            accessTokenClaims.iat &&
            accessTokenClaims.iat <= now &&
            accessTokenClaims.exp &&
            accessTokenClaims.exp >= now
                ? true
                : false;
        const checkPermissions =
            accessTokenClaims.scp &&
            accessTokenClaims.scp.includes(this.appConfig.permissions)
                ? true
                : false;
        return (
            checkIssuer && checkAudience && checkTimestamp && checkPermissions
        );
    }

    /**
     * Verifies a given tokens signature
     * @param {string} authToken
     * @returns {Promise}
     */
    private async validateTokenSignature(
        rawAuthToken: string
    ): Promise<boolean> {
        if (!rawAuthToken) {
            return false;
        }

        let decodedToken; // decode to get kid parameter in header

        try {
            decodedToken = jwt.decode(rawAuthToken, { complete: true });
        } catch (error) {
            console.error(error);
            return false;
        }

        let keys; // obtain signing keys from discovery endpoint

        try {
            keys =
                decodedToken &&
                (await this.getSigningKeys(decodedToken.header));
        } catch (error) {
            console.error(error);
            return false;
        }

        try {
            // verify the signature at header section using keys
            let verifiedToken = keys && jwt.verify(rawAuthToken, keys);
            return !!verifiedToken;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    /**
     * Fetches signing keys from the openid-configuration endpoint
     * @param {Object} header: token header
     * @returns {Promise}
     */
    private async getSigningKeys(header: any): Promise<string> {
        return (await this.keyClient.getSigningKey(header.kid)).getPublicKey();
    }
}

export default TokenValidator;

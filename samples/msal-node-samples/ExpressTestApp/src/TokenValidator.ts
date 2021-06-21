/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

import { Configuration } from '@azure/msal-node';

import { AppSettings } from './Types';
import { ErrorMessages } from './Errors';
import { AuthorityStrings } from './Constants';

export class TokenValidator {

    appSettings: AppSettings;
    msalConfig: Configuration;

    constructor(appSettings: AppSettings, msalConfig: Configuration) {
        this.appSettings = appSettings;
        this.msalConfig = msalConfig;
    }

    /**
     * Validates the id token for a set of claims
     * @param {Object} idTokenClaims: decoded id token claims
     */
    validateIdToken = (idTokenClaims): boolean => {
        const now = Math.round((new Date()).getTime() / 1000); // in UNIX format

        /**
         * At the very least, check for tenant, audience, issue and expiry dates. 
         * For more information on validating id tokens, visit: 
         * https://docs.microsoft.com/azure/active-directory/develop/id-tokens#validating-an-id_token
         */
        const checkAudience = idTokenClaims["aud"] === this.msalConfig.auth.clientId ? true : false;
        const checkTimestamp = idTokenClaims["iat"] <= now && idTokenClaims["exp"] >= now ? true : false;
        const checkTenant = (this.appSettings.policies && !idTokenClaims["tid"]) || idTokenClaims["tid"] === this.appSettings.credentials.tenantId ? true : false;

        return checkAudience && checkTimestamp && checkTenant;
    }

    /**
     * Validates the access token for signature and against a predefined set of claims
     * @param {string} accessToken: raw JWT token 
     * @param {string} protectedRoute: used for checking scope
     */
    validateAccessToken = async (accessToken, protectedRoute): Promise<boolean> => {
        const now = Math.round((new Date()).getTime() / 1000); // in UNIX format

        if (!accessToken || accessToken === "" || accessToken === "undefined") {
            console.log(ErrorMessages.TOKEN_NOT_FOUND);
            return false;
        }

        // we will first decode to get kid parameter in header
        let decodedToken;

        try {
            decodedToken = jwt.decode(accessToken, { complete: true });
        } catch (error) {
            console.log(ErrorMessages.TOKEN_NOT_DECODED);
            console.log(error);
            return false;
        }

        // obtains signing keys from discovery endpoint
        let keys;

        try {
            keys = await this.getSigningKeys(decodedToken.header);
        } catch (error) {
            console.log(ErrorMessages.KEYS_NOT_OBTAINED);
            console.log(error);
            return false;
        }

        // verify the signature at header section using keys
        let verifiedToken;

        try {
            verifiedToken = jwt.verify(accessToken, keys);
        } catch (error) {
            console.log(ErrorMessages.TOKEN_NOT_VERIFIED);
            console.log(error);
            return false;
        }

        /**
         * At the very least, validate the token with respect to issuer, audience, scope
         * and timestamp, though implementation and extent vary. For more information, visit:
         * https://docs.microsoft.com/azure/active-directory/develop/access-tokens#validating-tokens
         */
        const checkIssuer = verifiedToken['iss'].includes(this.appSettings.credentials.tenantId) ? true : false;
        const checkTimestamp = verifiedToken["iat"] <= now && verifiedToken["exp"] >= now ? true : false;
        const checkAudience = verifiedToken['aud'] === this.appSettings.credentials.clientId || verifiedToken['aud'] === 'api://' + this.appSettings.credentials.clientId ? true : false;
        const checkScopes = this.appSettings.protected.find(item => item.route === protectedRoute).scopes.every(scp => verifiedToken['scp'].includes(scp));

        if (checkAudience && checkIssuer && checkTimestamp && checkScopes) {
            return true
        }
        return false;
    }

    /**
     * Fetches signing keys of an access token 
     * from the authority discovery endpoint
     * @param {string} header
     */
    private getSigningKeys = async(header): Promise<string> => {
        let jwksUri;

        // Check if a B2C application i.e. app has policies
        if (this.appSettings.policies) {
            jwksUri = `${this.msalConfig.auth.authority}/discovery/v2.0/keys`
        } else {
            jwksUri =`${AuthorityStrings.AAD}${this.appSettings.credentials.tenantId}/discovery/v2.0/keys`
        }

        const client = jwksClient({
            jwksUri: jwksUri
        });

        return (await client.getSigningKeyAsync(header.kid)).getPublicKey();
    }
}
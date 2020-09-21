import { AuthResponse } from "../AuthResponse";
import { Account } from "../Account";
import { IdToken } from "../IdToken";
import { ServerHashParamKeys } from "./Constants";

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 */
export class ResponseUtils {

    static setResponseIdToken(originalResponse: AuthResponse, idTokenObj: IdToken) : AuthResponse {
        if (!originalResponse) {
            return null;
        } else if (!idTokenObj) {
            return originalResponse;
        }

        const exp = Number(idTokenObj.expiration);
        if (exp && !originalResponse.expiresOn) {
            originalResponse.expiresOn = new Date(exp * 1000);
        }
    
        return {
            ...originalResponse,
            idToken: idTokenObj,
            idTokenClaims: idTokenObj.claims,
            uniqueId: idTokenObj.objectId || idTokenObj.subject,
            tenantId: idTokenObj.tenantId,
        };
    }

    /**
     * Adds ID Token data to Access Token auth response. Returns null if access token is null.
     * @param idToken 
     * @param authResponse 
     */
    static buildTokenAuthResponse(idToken: IdToken, authResponse: AuthResponse): AuthResponse {
        return ResponseUtils.setResponseIdToken(authResponse, idToken);
    }

    /**
     * Returns an AuthResponse object that includes both a valid AccessToken and IdToken or null if either is 
     * missing or expired.
     * @param idToken 
     * @param serverAuthenticationRequest 
     * @param scopes 
     * @param account 
     */
    static buildIdTokenTokenAuthResponse(idToken: IdToken, authResponse: AuthResponse) : AuthResponse {
        // For id_token_token, either both are returned from the cache or both are requested from the server
        if (authResponse  && idToken) {
            return ResponseUtils.setResponseIdToken(authResponse, idToken);
        }
        return null;
    }

    /**
     * Returns an AuthResponse object that includes a valid IdToken or null if no valid
     * IdToken is passed in (found in the cache).
     * @param idToken 
     * @param serverAuthenticationRequest 
     * @param scopes 
     * @param account 
     */
    static buildIdTokenAuthResponse(idToken: IdToken, accountState: string, scopes: Array<string>, account: Account): AuthResponse {
        if(idToken) {
            const authResponse: AuthResponse = {
                uniqueId: "",
                tenantId: "",
                tokenType: ServerHashParamKeys.ID_TOKEN,
                idToken: null,
                idTokenClaims: null,
                accessToken: null,
                scopes: scopes,
                expiresOn: null,
                account: account,
                accountState: accountState,
                fromCache: true
            };
    
            return ResponseUtils.setResponseIdToken(authResponse, idToken);
        }
        // If no access token is found in cache, return null to trigger token renewal`
        return null;
    }
}

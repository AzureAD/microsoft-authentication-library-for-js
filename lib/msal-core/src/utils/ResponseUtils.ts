/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthResponse } from "../AuthResponse";
import { Account } from "../Account";
import { IdToken } from "../IdToken";
import { ResponseTypes, ServerHashParamKeys } from "./Constants";
import { ServerRequestParameters } from "../ServerRequestParameters";

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

    static buildAuthResponse(idToken: IdToken, authResponse: AuthResponse, serverAuthenticationRequest: ServerRequestParameters, account: Account, scopes: Array<string>, accountState: string): AuthResponse {
        switch(serverAuthenticationRequest.responseType) {
            case ResponseTypes.id_token:
                authResponse = {
                    ...authResponse,
                    tokenType: ServerHashParamKeys.ID_TOKEN,
                    account: account,
                    scopes: scopes,
                    accountState: accountState
                };
                
                authResponse = ResponseUtils.setResponseIdToken(authResponse, idToken);
                return (authResponse.idToken) ? authResponse : null;
            case ResponseTypes.id_token_token:
                authResponse = ResponseUtils.setResponseIdToken(authResponse, idToken);
                return (authResponse && authResponse.accessToken && authResponse.idToken) ? authResponse : null;
            case ResponseTypes.token:
                authResponse = ResponseUtils.setResponseIdToken(authResponse, idToken);
                return authResponse;
            default: 
                return null;
        }
    }
}

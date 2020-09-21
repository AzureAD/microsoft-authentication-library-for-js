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

    static validateAuthResponse(authResponse: AuthResponse, serverAuthenticationRequest: ServerRequestParameters, account: Account, accountState: string): AuthResponse {
        switch(serverAuthenticationRequest.responseType) {
            case ResponseTypes.id_token:
                authResponse = {
                    ...authResponse,
                    tokenType: ServerHashParamKeys.ID_TOKEN,
                    account: account,
                    accountState: accountState
                }
                return (authResponse.idToken) ? authResponse : null;
            case ResponseTypes.id_token_token:
                return (authResponse && authResponse.idToken) ? authResponse : null;
            case ResponseTypes.token:
                return authResponse;
            default: 
                return null;
        }
    }
}

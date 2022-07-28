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

    static setResponseIdToken(originalResponse: AuthResponse | null, idTokenObj: IdToken| null) : AuthResponse | null {
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

    static buildAuthResponse(idToken: IdToken | null, authResponse: AuthResponse | null, serverAuthenticationRequest: ServerRequestParameters, account: Account | null, scopes: Array<string>, accountState: string | undefined): AuthResponse | null {
        switch(serverAuthenticationRequest.responseType) {
            case ResponseTypes.id_token:
                let idTokenResponse: AuthResponse = {
                    ...authResponse!, // TODO bug: what if authResponse properties are undefined?
                    tokenType: ServerHashParamKeys.ID_TOKEN,
                    account: account,
                    scopes: scopes,
                    accountState: accountState
                };

                idTokenResponse = ResponseUtils.setResponseIdToken(idTokenResponse, idToken)!;
                return (idTokenResponse.idToken) ? idTokenResponse : null;
            case ResponseTypes.id_token_token:
                const idTokeTokenResponse = ResponseUtils.setResponseIdToken(authResponse, idToken);
                return (idTokeTokenResponse && idTokeTokenResponse.accessToken && idTokeTokenResponse.idToken) ? idTokeTokenResponse : null;
            case ResponseTypes.token:
                const tokenResponse = ResponseUtils.setResponseIdToken(authResponse, idToken);
                return tokenResponse;
            default:
                return null;
        }
    }
}

import { AuthResponse } from "../AuthResponse";
import { IdToken } from "../IdToken";
import { Storage } from "../Storage";
import { UrlUtils } from "./UrlUtils";
import { StringUtils } from "./StringUtils";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * @hidden
 */
export class ResponseUtils {

    /**
     * Set the Response from the idToken Object Data
     * @param originalResponse
     * @param idTokenObj
     */
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
}

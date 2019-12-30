/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Account } from "../auth/Account";
import { StringDict } from "../utils/MsalTypes";
import { AuthResponse } from "./AuthResponse";
import { IdToken } from "../auth/IdToken";

/**
 * TokenResponse type returned by library containing id, access and/or refresh tokens.
 * - uniqueId: account object id
 * - tenantId: id of home tenant for logged in user
 * - tokenType: type of token response - either idToken or accessToken
 * - idToken: id token jwt string
 * - idTokenClaims: claims in id token
 * - accessToken: access token jwt string
 * - refreshToken: refresh token string
 * - expiresOn: expiration of access token or id token (depends on token type)
 * - account: logged in account object
 */
export type TokenResponse = AuthResponse & {
    uniqueId: string;
    tenantId: string;
    scopes: Array<string>;
    tokenType: string;
    idToken: string;
    idTokenClaims: StringDict;
    accessToken: string;
    refreshToken: string;
    expiresOn: Date;
    account: Account;
};

export function setResponseIdToken(originalResponse: TokenResponse, idTokenObj: IdToken) : TokenResponse {
    if (!originalResponse) {
        return null;
    } else if (!idTokenObj) {
        return originalResponse;
    }

    const exp = Number(idTokenObj.claims.exp);
    if (exp && !originalResponse.expiresOn) {
        originalResponse.expiresOn = new Date(exp * 1000);
    }

    return {
        ...originalResponse,
        idToken: idTokenObj.rawIdToken,
        idTokenClaims: idTokenObj.claims,
        uniqueId: idTokenObj.claims.oid || idTokenObj.claims.sub,
        tenantId: idTokenObj.claims.tid,
    };
}

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { AuthResponse } from "./AuthResponse";
import { Account } from "../auth/Account";
import { StringDict } from "../utils/MsalTypes";

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

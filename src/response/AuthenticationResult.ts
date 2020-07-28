/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StringDict } from "../utils/MsalTypes";
import { AccountInfo } from "../account/AccountInfo";

/**
 * Result returned from the authority's token endpoint.
 * - uniqueId               - `oid` or `sub` claim from ID token
 * - tenantId               - `tid` claim from ID token
 * - scopes                 - Scopes that are validated for the respective token
 * - account                - An account object representation of the currently signed-in user
 * - idToken                - Id token received as part of the response
 * - idTokenClaims          - MSAL-relevant ID token claims
 * - accessToken            - Access token received as part of the response
 * - fromCache              - Boolean denoting whether token came from cache
 * - expiresOn              - Javascript Date object representing relative expiration of access token
 * - extExpiresOn           - Javascript Date object representing extended relative expiration of access token in case of server outage
 * - state                  - Value passed in by user in request
 * - familyId               - Family ID identifier, usually only used for refresh tokens
 */
export type AuthenticationResult = {
    uniqueId: string;
    tenantId: string;
    scopes: Array<string>;
    account: AccountInfo;
    idToken: string;
    idTokenClaims: StringDict;
    accessToken: string;
    fromCache: boolean;
    expiresOn: Date;
    extExpiresOn?: Date;
    state?: string;
    familyId?: string;
};

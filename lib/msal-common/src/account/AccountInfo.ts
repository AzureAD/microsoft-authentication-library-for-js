/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Account object with the following signature:
 * - homeAccountId          - Home account identifier for this account object
 * - environment            - Entity which issued the token represented by the domain of the issuer (e.g. login.microsoftonline.com)
 * - tenantId               - Full tenant or organizational id that this account belongs to
 * - username               - preferred_username claim of the id_token that represents this account
 * - localAccountId         - Local, tenant-specific account identifer for this account object, usually used in legacy cases
 * - name                   - Full name for the account, including given name and family name
 * - idTokenClaims          - Object contains claims from ID token
 * - localAccountId         - The user's local account ID 
 */
export type AccountInfo = {
    homeAccountId: string; /* home account id here*/
    environment: string;
    tenantId: string; /* tenant id here*/
    username: string;
    localAccountId: string; /* local acc id here*/
    name?: string; /* name here */
    idTokenClaims?: object;
};

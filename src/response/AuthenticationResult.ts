/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StringDict } from "../utils/MsalTypes";

/**
 * Result returned from the authority's token endpoint.
 */
export class AuthenticationResult {
    // TODO this is temp class, it will be updated.
    uniqueId: string;
    tenantId: string;
    scopes: Array<string>;
    tokenType: string;
    idToken: string;
    idTokenClaims: StringDict;
    accessToken: string;
    refreshToken: string;
    expiresOn: Date;
    extExpiresOn?: Date;
    account: Account;
    userRequestState: string;
};

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StringDict } from "../utils/MsalTypes";

/**
 * Result returned from the authority's token endpoint.
 */
export class AuthenticationResult {
    uniqueId: string;
    tenantId: string;
    scopes: Array<string>;
    idToken: string;
    idTokenClaims: StringDict;
    accessToken: string;
    expiresOn: Date;
    extExpiresOn?: Date;
    state?: string;
    familyId?: string;
}

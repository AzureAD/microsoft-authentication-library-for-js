/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StringDict } from "../utils/MsalTypes";

/**
 * Result returned from the authority's token endpoint.
 */
// TODO: Also consider making an external type and use this as internal
export class AuthenticationResult {
    // TODO this is temp class, it will be updated.
    uniqueId: string; // TODO: Check applicability
    tenantId: string; // TODO: Check applicability
    scopes: Array<string>;
    tokenType: string; // TODO: get rid of this if we can
    idToken: string;
    idTokenClaims: StringDict;
    accessToken: string;
    refreshToken: string; // TODO: Confirm if we need to return this to the user, follow up with msal-browser
    expiresOn: Date;
    extExpiresOn?: Date; // TODO: Check what this maps to in other libraries
    userRequestState?: string; // TODO: remove, just check how state is handled in other libraries
    familyId?: string; // TODO: Check wider audience
};

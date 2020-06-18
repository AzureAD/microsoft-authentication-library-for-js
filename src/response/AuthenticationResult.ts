/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StringDict } from "../utils/MsalTypes";
import { IAccount } from "../account/IAccount";

/**
 * Result returned from the authority's token endpoint.
 */
export class AuthenticationResult {
    uniqueId: string;
    tenantId: string;
    scopes: Array<string>;
    account: IAccount;
    idToken: string;
    idTokenClaims: StringDict;
    accessToken: string;
    fromCache: boolean;
    expiresOn: Date;
    extExpiresOn?: Date;
    state?: string;
    familyId?: string;
}

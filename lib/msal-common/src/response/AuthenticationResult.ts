/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StringDict } from "../utils/MsalTypes";
import { AccountInfo } from "../account/AccountInfo";

/**
 * Result returned from the authority's token endpoint.
 */
export type AuthenticationResult = {
    authority: string;
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
    cloudGraphHostName?: string;
    msGraphHost?: string; 
};

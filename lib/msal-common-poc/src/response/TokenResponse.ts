/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { MsalAccount } from "../auth/MsalAccount";
import { StringDict } from "../app/MsalTypes";
import { AuthResponse } from "./AuthResponse";

export type TokenResponse = AuthResponse & {
    uniqueId: string;
    tenantId: string;
    tokenType: string;
    idToken: string;
    idTokenClaims: StringDict;
    accessToken: string;
    scopes: Array<string>;
    expiresOn: Date;
    account: MsalAccount;
};

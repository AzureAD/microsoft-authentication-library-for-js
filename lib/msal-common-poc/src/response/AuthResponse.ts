/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { MsalAccount } from "../auth/MsalAccount";
import { IdToken } from "../auth/IdToken";
import { StringDict } from "../app/MsalTypes";

export type AuthResponse = {
    uniqueId: string;
    tenantId: string;
    tokenType: string;
    idToken: string;
    idTokenClaims: StringDict;
    accessToken: string;
    scopes: Array<string>;
    expiresOn: Date;
    account: MsalAccount;
    state: string;
};

export function buildResponseStateOnly(responseState: string) : AuthResponse {
    return {
        uniqueId: "",
        tenantId: "",
        tokenType: "",
        idToken: null,
        idTokenClaims: null,
        accessToken: "",
        scopes: null,
        expiresOn: null,
        account: null,
        state: responseState
    };
}

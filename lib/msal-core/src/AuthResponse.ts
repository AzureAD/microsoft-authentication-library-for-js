/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Account } from "./Account";
import { IdToken } from "./IdToken";
import { StringDict } from "./MsalTypes";

export type AuthResponse = {
    uniqueId: string | null;
    tenantId: string | null;
    tokenType: string;
    idToken: IdToken | null;
    idTokenClaims: StringDict | null;
    accessToken: string | null | undefined;
    scopes: Array<string> | null | undefined;
    expiresOn: Date | null;
    account: Account | null;
    accountState?: string;
    fromCache: boolean
};

export function buildResponseStateOnly(state?: string) : AuthResponse {
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
        accountState: state,
        fromCache: false
    };
}

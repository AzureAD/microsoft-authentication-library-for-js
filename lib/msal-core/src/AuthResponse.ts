// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Account } from "./Account";
import { IdToken } from "./IdToken";
import { Dict } from "./MsalTypes";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export type AuthResponse = {
    uniqueId: string;
    tenantId: string;
    tokenType: string;
    idToken: string;
    accessToken: string;
    scopes: Array<string>;
    expiresOn: Date;
    account: Account;
    accountState: string;
    claims: Dict;
};

export function buildResponseStateOnly(state: string) : AuthResponse {
    return {
        uniqueId: "",
        tenantId: "",
        tokenType: "",
        idToken: null,
        accessToken: "",
        scopes: null,
        expiresOn: null,
        account: null,
        accountState: state,
        claims: null
    };
}

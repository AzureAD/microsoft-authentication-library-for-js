// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Account } from "./Account";
import { IdToken } from "./IdToken";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export type AuthResponse = {
    uniqueId: string;
    tenantId: string;
    tokenType: string;
    idToken: IdToken;
    accessToken: object;
    scopes: Array<string>;
    expiresIn: Date;
    account: Account;
    accountState: string;
};

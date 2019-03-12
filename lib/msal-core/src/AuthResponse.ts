// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export type AuthResponse = {
    uniqueId: string;
    tenantId: string;
    tokenType: string;
    idToken: object;
    accessToken: object;
    scopes: Array<string>;
    expiresOn: Date;
    account: Account;
    userState: string;
};

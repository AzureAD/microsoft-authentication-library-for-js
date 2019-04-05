import { User } from "./User";
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
    expiresIn: string;
    account: User;
    userState: string;
};

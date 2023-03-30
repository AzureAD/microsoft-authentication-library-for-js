/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "./AccountInfo";

export type TokenResponse = {
    access_token: string;
    account: AccountInfo;
    client_info: string;
    expires_in: number;
    id_token: string;
    properties: TokenResponseProperties; // Not sure what this is for
    scope: string;
    state: string;
    shr?: string; // token binding enabled at native layer it is the access token, not the signing keys
    extendedLifetimeToken?: boolean;
};

export type TokenResponseProperties = {
    MATS?: string;
};

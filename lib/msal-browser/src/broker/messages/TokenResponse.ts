/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Account properties returned by broker
 * The values here are subset defined in MSAL.js
 */
export type AccountInfo = {
    homeAccountId: string;
    environment: string;
    tenantId: string;
    username: string;
    localAccountId: string;
    name?: string;
};

/**
 * Token response returned by broker
 */
export type TokenResponse = {
    authority: string,
    uniqueId: string,
    access_token: string;
    account: AccountInfo;
    client_info: string;
    expires_in: number;
    id_token: string;
    scope: string;
    state: string;
    shr?: string;
};

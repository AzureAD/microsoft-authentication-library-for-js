/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type WamAccountInfo = {
    id: string;
    properties: object;
    userName: string;
};

export type WamResponse = {
    access_token: string;
    account: WamAccountInfo;
    client_info: string;
    expires_in: number;
    id_token: string;
    properties: object;
    scopes: string;
    state: string;
    extendedLifetimeToken?: boolean;
};

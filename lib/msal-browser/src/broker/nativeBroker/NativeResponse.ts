/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Account properties returned by Native Platform e.g. WAM
 */
export type NativeAccountInfo = {
    id: string;
    properties: object;
    userName: string;
};

/**
 * Token response returned by Native Platform e.g. WAM
 */
export type NativeResponse = {
    access_token: string;
    account: NativeAccountInfo;
    client_info: string;
    expires_in: number;
    id_token: string;
    properties: object;
    scopes: string;
    state: string;
    extendedLifetimeToken?: boolean;
};

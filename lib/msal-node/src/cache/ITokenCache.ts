/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "@azure/msal-common";

export interface ITokenCache {
    getAllAccounts(): Promise<AccountInfo[]>;
    getAccountByHomeId(homeAccountId: string): Promise<AccountInfo | null>;
    getAccountByLocalId(localAccountId: string): Promise<AccountInfo | null>;
    removeAccount(account: AccountInfo): Promise<void>;
}

export const stubbedTokenCache: ITokenCache = {
    getAllAccounts: () => {
        return Promise.reject(NodeConfigurationAuthError.createStubTokenCacheCalledError());
    },
    getAccountByHomeId: () => {
        return Promise.reject(NodeConfigurationAuthError.createStubTokenCacheCalledError());
    },
    getAccountByLocalId: () => {
        return Promise.reject(NodeConfigurationAuthError.createStubTokenCacheCalledError());
    },
    removeAccount: () => {
        return Promise.reject(NodeConfigurationAuthError.createStubTokenCacheCalledError());
    },
};

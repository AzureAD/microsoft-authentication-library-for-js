/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TokenKeys } from "@azure/msal-common/browser";
import { StaticCacheKeys } from "../utils/BrowserConstants.js";
import { IWindowStorage } from "./IWindowStorage.js";

/**
 * Returns a list of cache keys for all known accounts
 * @param storage
 * @returns
 */
export function getAccountKeys(storage: IWindowStorage<string>): Array<string> {
    const accountKeys = storage.getItem(StaticCacheKeys.ACCOUNT_KEYS);
    if (accountKeys) {
        return JSON.parse(accountKeys);
    }

    return [];
}

/**
 * Returns a list of cache keys for all known tokens
 * @param clientId
 * @param storage
 * @returns
 */
export function getTokenKeys(
    clientId: string,
    storage: IWindowStorage<string>
): TokenKeys {
    const item = storage.getItem(`${StaticCacheKeys.TOKEN_KEYS}.${clientId}`);
    if (item) {
        const tokenKeys = JSON.parse(item);
        if (
            tokenKeys &&
            tokenKeys.hasOwnProperty("idToken") &&
            tokenKeys.hasOwnProperty("accessToken") &&
            tokenKeys.hasOwnProperty("refreshToken")
        ) {
            return tokenKeys as TokenKeys;
        }
    }

    return {
        idToken: [],
        accessToken: [],
        refreshToken: [],
    };
}

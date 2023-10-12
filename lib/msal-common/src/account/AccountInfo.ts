/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TokenClaims } from "./TokenClaims";
/**
 * Account object with the following signature:
 * - homeAccountId          - Home account identifier for this account object
 * - environment            - Entity which issued the token represented by the domain of the issuer (e.g. login.microsoftonline.com)
 * - tenantId               - Full tenant or organizational id that this account belongs to
 * - username               - preferred_username claim of the id_token that represents this account
 * - localAccountId         - Local, tenant-specific account identifer for this account object, usually used in legacy cases
 * - name                   - Full name for the account, including given name and family name
 * - idToken                - raw ID token
 * - idTokenClaims          - Object contains claims from ID token
 * - nativeAccountId        - The user's native account ID
 * - tenants                - Array of strings that represent a unique identifier for the tenants that the account has been authenticated with.
 */
export type AccountInfo = {
    homeAccountId: string;
    environment: string;
    tenantId: string;
    username: string;
    localAccountId: string;
    name?: string;
    idToken?: string;
    idTokenClaims?: TokenClaims & {
        [key: string]:
            | string
            | number
            | string[]
            | object
            | undefined
            | unknown;
    };
    nativeAccountId?: string;
    authorityType?: string;
    tenants?: string[];
};

export type ActiveAccountFilters = {
    homeAccountId: string;
    localAccountId: string;
    tenantId: string;
};

/**
 * Replaces account info that varies by tenant profile sourced from the ID token claims passed in with the tenant-specific account info
 * @param accountInfo
 * @param idTokenClaims
 * @returns
 */
export function updateTenantProfile(
    accountInfo: AccountInfo,
    idTokenClaims?: TokenClaims
): AccountInfo {
    if (idTokenClaims) {
        const updatedAccountInfo = accountInfo;
        const { oid, tid, name } = idTokenClaims;

        if (oid && oid !== accountInfo.localAccountId) {
            updatedAccountInfo.localAccountId = oid;
        }
        if (tid && tid !== accountInfo.tenantId) {
            updatedAccountInfo.tenantId = tid;
        }
        if (name && name !== accountInfo.name) {
            updatedAccountInfo.name = name;
        }

        updatedAccountInfo.idTokenClaims = idTokenClaims;

        return updatedAccountInfo;
    }

    return accountInfo;
}

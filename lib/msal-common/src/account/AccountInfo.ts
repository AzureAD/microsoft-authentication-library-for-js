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
 * - tenantProfiles         - Map of tenant profile objects for each tenant that the account has authenticated with in the browser
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
    tenantProfiles?: Map<string, TenantProfile>;
};

/**
 * Account details that vary across tenants for the same user
 *
 * - tenantId               - Full tenant or organizational id that this account belongs to
 * - localAccountId         - Local, tenant-specific account identifer for this account object, usually used in legacy cases
 * - name                   - Full name for the account, including given name and family name
 * - isHomeTenant           - True if this is the home tenant profile of the account, false if it's a guest tenant profile
 */
export type TenantProfile = Pick<
    AccountInfo,
    "tenantId" | "localAccountId" | "name"
> & {
    isHomeTenant?: boolean;
};

export type ActiveAccountFilters = {
    homeAccountId: string;
    localAccountId: string;
    tenantId?: string;
};

/**
 * Replaces account info that varies by tenant profile sourced from the ID token claims passed in with the tenant-specific account info
 * @param accountInfo
 * @param idTokenClaims
 * @returns
 */
export function updateAccountTenantProfileData(
    accountInfo: AccountInfo,
    tenantProfile?: TenantProfile,
    idTokenClaims?: TokenClaims
): AccountInfo {
    let updatedAccountInfo = accountInfo;
    // Tenant Profile overrides passed in account info
    if (tenantProfile) {
        updatedAccountInfo = { ...accountInfo, ...tenantProfile };
    }

    // ID token claims override passed in account info and tenant profile
    if (idTokenClaims) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { isHomeTenant, ...tenantProfile } =
            buildTenantProfileFromIdTokenClaims(
                accountInfo.homeAccountId,
                idTokenClaims
            );

        updatedAccountInfo = {
            ...updatedAccountInfo,
            ...tenantProfile,
        };

        updatedAccountInfo.idTokenClaims = idTokenClaims;
        return updatedAccountInfo;
    }

    return accountInfo;
}

export function buildTenantProfileFromIdTokenClaims(
    homeAccountId: string,
    idTokenClaims: TokenClaims
): TenantProfile {
    const { oid, sub, tid, name, tfp, acr } = idTokenClaims;

    const claimsTenantId = tid || tfp || acr;
    let tenantId: string | undefined;

    if (claimsTenantId) {
        // Downcase to match the realm case-insensitive comparison requirements
        tenantId = claimsTenantId.toLowerCase();
    }

    return {
        tenantId: tenantId || "",
        localAccountId: oid || sub || "",
        name: name,
        isHomeTenant: tenantIdMatchesHomeTenant(tenantId, homeAccountId),
    };
}

export function tenantIdMatchesHomeTenant(
    tenantId?: string,
    homeAccountId?: string
): boolean {
    return (
        !!tenantId &&
        !!homeAccountId &&
        tenantId === homeAccountId.split(".")[1]
    );
}

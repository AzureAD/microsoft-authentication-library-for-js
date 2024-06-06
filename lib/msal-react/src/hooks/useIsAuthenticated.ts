/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { useMemo } from "react";
import { useMsal } from "./useMsal";
import { AccountIdentifiers } from "../types/AccountIdentifiers";
import { AccountInfo, InteractionStatus } from "@azure/msal-browser";
import { getAccountByIdentifiers } from "../utils/utilities";

function isAuthenticated(
    allAccounts: AccountInfo[],
    matchAccount?: AccountIdentifiers
): boolean {
    if (
        matchAccount &&
        (matchAccount.username ||
            matchAccount.homeAccountId ||
            matchAccount.localAccountId)
    ) {
        return !!getAccountByIdentifiers(allAccounts, matchAccount);
    }

    return allAccounts.length > 0;
}

/**
 * Returns whether or not a user is currently signed-in. Optionally provide 1 or more accountIdentifiers to determine if a specific user is signed-in
 * @param matchAccount
 */
export function useIsAuthenticated(matchAccount?: AccountIdentifiers): boolean {
    const { accounts: allAccounts, inProgress } = useMsal();

    const isUserAuthenticated = useMemo(() => {
        if (inProgress === InteractionStatus.Startup) {
            return false;
        }
        return isAuthenticated(allAccounts, matchAccount);
    }, [allAccounts, inProgress, matchAccount]);

    return isUserAuthenticated;
}

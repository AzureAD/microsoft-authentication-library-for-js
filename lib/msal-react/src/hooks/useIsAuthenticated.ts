/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { useState, useEffect } from "react";
import { useMsal } from "./useMsal";
import { AccountIdentifiers } from "../types/AccountIdentifiers";
import { AccountInfo } from "@azure/msal-browser";
import { getAccountByIdentifiers } from "../utils/utilities";

function isAuthenticated(allAccounts: AccountInfo[], matchAccount?: AccountIdentifiers): boolean {
    if(matchAccount && (matchAccount.username || matchAccount.homeAccountId || matchAccount.localAccountId)) {
        return !!getAccountByIdentifiers(allAccounts, matchAccount);
    }   

    return allAccounts.length > 0;
}

/**
 * Returns whether or not a user is currently signed-in. Optionally provide 1 or more accountIdentifiers to determine if a specific user is signed-in
 * @param matchAccount 
 */
export function useIsAuthenticated(matchAccount?: AccountIdentifiers): boolean {
    const { accounts: allAccounts } = useMsal();

    const [hasAuthenticated, setHasAuthenticated] = useState<boolean>(() => isAuthenticated(allAccounts, matchAccount));

    useEffect(() => {
        setHasAuthenticated(isAuthenticated(allAccounts, matchAccount));
    }, [allAccounts, matchAccount]);

    return hasAuthenticated;
}

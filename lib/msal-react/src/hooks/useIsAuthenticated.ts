/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { useState, useEffect } from "react";
import { useMsal } from "./useMsal";
import { AccountIdentifiers } from "../types/AccountIdentifiers";
import { useAccount } from "./useAccount";
import { AccountInfo, InteractionStatus } from "@azure/msal-browser";

function isAuthenticated(allAccounts: AccountIdentifiers[], account: AccountInfo | null, matchAccount?: AccountIdentifiers): boolean {
    if(matchAccount && (matchAccount.username || matchAccount.homeAccountId || matchAccount.localAccountId)) {
        return !!account;
    }   

    return allAccounts.length > 0;
}

/**
 * Returns whether or not a user is currently signed-in. Optionally provide 1 or more accountIdentifiers to determine if a specific user is signed-in
 * @param matchAccount 
 */
export function useIsAuthenticated(matchAccount?: AccountIdentifiers): boolean {
    const { accounts: allAccounts, inProgress } = useMsal();
    const account = useAccount(matchAccount || {});

    const initialStateValue = inProgress === InteractionStatus.Startup ? false : isAuthenticated(allAccounts, account, matchAccount);
    const [hasAuthenticated, setHasAuthenticated] = useState<boolean>(initialStateValue);

    useEffect(() => {
        setHasAuthenticated(isAuthenticated(allAccounts, account, matchAccount));
    }, [allAccounts, account, matchAccount]);

    return hasAuthenticated;
}

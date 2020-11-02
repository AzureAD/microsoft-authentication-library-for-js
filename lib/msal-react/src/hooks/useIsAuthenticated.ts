/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { useState, useEffect } from "react";
import { useMsal } from "./useMsal";
import { AccountIdentifiers } from "../types/AccountIdentifiers";
import { useAccount } from "./useAccount";
import { AccountInfo } from "@azure/msal-browser";

function isAuthenticated(allAccounts: AccountInfo[], account: AccountInfo | null, accountIdentifiers?: AccountIdentifiers): boolean {
    if(accountIdentifiers && (accountIdentifiers.username || accountIdentifiers.homeAccountId)) {
        return !!account;
    }   

    return allAccounts.length > 0;
}

export function useIsAuthenticated(accountIdentifiers?: AccountIdentifiers): boolean {
    const { accounts: allAccounts } = useMsal();
    const account = useAccount(accountIdentifiers || {});

    const [hasAuthenticated, setHasAuthenticated] = useState<boolean>(isAuthenticated(allAccounts, account, accountIdentifiers));

    useEffect(() => {
        setHasAuthenticated(isAuthenticated(allAccounts, account, accountIdentifiers));
    }, [allAccounts, account, accountIdentifiers]);

    return hasAuthenticated;
}

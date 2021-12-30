/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { useState, useEffect } from "react";
import { AccountInfo, IPublicClientApplication, InteractionStatus, AccountEntity } from "@azure/msal-browser";
import { useMsal } from "./useMsal";
import { AccountIdentifiers } from "../types/AccountIdentifiers";

function getAccount(instance: IPublicClientApplication, accountIdentifiers?: AccountIdentifiers): AccountInfo | null {
    if (!accountIdentifiers || (!accountIdentifiers.homeAccountId && !accountIdentifiers.localAccountId && !accountIdentifiers.username)) {
        // If no account identifiers are provided, return active account
        return instance.getActiveAccount();
    }

    const allAccounts = instance.getAllAccounts();
    if (allAccounts.length > 0) {
        const matchedAccounts = allAccounts.filter(accountObj => {
            if (accountIdentifiers.username && accountIdentifiers.username.toLowerCase() !== accountObj.username.toLowerCase()) {
                return false;
            }
            if (accountIdentifiers.homeAccountId && accountIdentifiers.homeAccountId.toLowerCase() !== accountObj.homeAccountId.toLowerCase()) {
                return false;
            }
            if (accountIdentifiers.localAccountId && accountIdentifiers.localAccountId.toLowerCase() !== accountObj.localAccountId.toLowerCase()) {
                return false;
            }

            return true;
        });

        return matchedAccounts[0] || null;
    } else {
        return null;
    }
}

/**
 * Given 1 or more accountIdentifiers, returns the Account object if the user is signed-in
 * @param accountIdentifiers 
 */
export function useAccount(accountIdentifiers?: AccountIdentifiers): AccountInfo | null {
    const { instance, inProgress } = useMsal();

    const [account, setAccount] = useState<AccountInfo|null>(() => {
        // Lazy intialization ensures getAccount is only called on the first render
        return inProgress === InteractionStatus.Startup ? null : getAccount(instance, accountIdentifiers);
    });

    useEffect(() => {
        const currentAccount = getAccount(instance, accountIdentifiers);
        if (!AccountEntity.accountInfoIsEqual(account, currentAccount, true)) {
            setAccount(currentAccount);
        }
    }, [inProgress, accountIdentifiers, instance, account]);

    return account;
}

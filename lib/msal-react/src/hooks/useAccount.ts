/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { useState, useEffect } from "react";
import { AccountInfo, IPublicClientApplication, InteractionStatus } from "@azure/msal-browser";
import { useMsal } from "./useMsal";
import { AccountIdentifiers } from "../types/AccountIdentifiers";

function getAccount(instance: IPublicClientApplication, accountIdentifiers: AccountIdentifiers): AccountInfo | null {
    const allAccounts = instance.getAllAccounts();
    if (allAccounts.length > 0 && (accountIdentifiers.homeAccountId || accountIdentifiers.localAccountId || accountIdentifiers.username)) {
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
export function useAccount(accountIdentifiers: AccountIdentifiers): AccountInfo | null {
    const { instance, inProgress } = useMsal();

    const initialStateValue = inProgress === InteractionStatus.Startup ? null : getAccount(instance, accountIdentifiers);
    const [account, setAccount] = useState<AccountInfo|null>(initialStateValue);

    useEffect(() => {
        setAccount(getAccount(instance, accountIdentifiers));
    }, [inProgress, accountIdentifiers, instance]);

    return account;
}

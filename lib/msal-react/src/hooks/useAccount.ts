/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { useState, useEffect } from "react";
import { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { useMsal } from "./useMsal";
import { AccountIdentifiers } from "../types/AccountIdentifiers";

function getAccount(instance: IPublicClientApplication, accountIdentifiers: AccountIdentifiers): AccountInfo | null {
    if (accountIdentifiers.homeAccountId) {
        return instance.getAccountByHomeId(accountIdentifiers.homeAccountId);
    } else if (accountIdentifiers.username) {
        return instance.getAccountByUsername(accountIdentifiers.username);
    }

    return null;
}

export function useAccount(accountIdentifiers: AccountIdentifiers): AccountInfo | null {
    const { instance, loginInProgress } = useMsal();

    const [account, setAccount] = useState<AccountInfo|null>(null);

    useEffect(() => {
        setAccount(getAccount(instance, accountIdentifiers));
    }, [loginInProgress, accountIdentifiers, instance]);

    return account;
}

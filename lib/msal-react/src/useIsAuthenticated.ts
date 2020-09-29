import { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { useState, useEffect } from "react";

import { useMsal } from "./MsalProvider";

function isAuthenticated(instance: IPublicClientApplication, account?: Partial<AccountInfo>): boolean {
    /*
     * TODO Move this to msal-browser
     * Would we want to treat this like a filter? i.e. account must match all fields provided?
     */
    if (account?.homeAccountId) {
        return !!instance.getAccountByHomeId(account.homeAccountId);
    } else if (account?.username) {
        return !!instance.getAccountByUsername(account.username);
    }

    return instance.getAllAccounts().length > 0;
}

export function useIsAuthenticated(account?: Partial<AccountInfo>): boolean {
    const {
        state: { accounts },
        instance,
    } = useMsal();

    const [hasAuthenticated, setHasAuthenticated] = useState<boolean>(
        isAuthenticated(instance, account)
    );

    useEffect(() => {
        const result = isAuthenticated(instance, account);
        setHasAuthenticated(result);
    }, [accounts, account, instance]);

    return hasAuthenticated;
}

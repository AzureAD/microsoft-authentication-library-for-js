import { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { useState, useEffect } from "react";

import { useMsal } from "./MsalProvider";

export type AccountIdentifiers = Partial<Pick<AccountInfo, "homeAccountId"|"username">>;

function isAuthenticated(instance: IPublicClientApplication, account?: AccountIdentifiers): boolean {
    if (account?.homeAccountId) {
        return !!instance.getAccountByHomeId(account.homeAccountId);
    } else if (account?.username) {
        return !!instance.getAccountByUsername(account.username);
    }

    return instance.getAllAccounts().length > 0;
}

export function useIsAuthenticated(account?: AccountIdentifiers): boolean {
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

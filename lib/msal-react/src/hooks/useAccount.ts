/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { useState, useEffect } from "react";
import {
    AccountInfo,
    IPublicClientApplication,
    AccountEntity,
    InteractionStatus,
} from "@azure/msal-browser";
import { useMsal } from "./useMsal.js";
import { AccountIdentifiers } from "../types/AccountIdentifiers.js";
import { getAccountByIdentifiers } from "../utils/utilities.js";

function getAccount(
    instance: IPublicClientApplication,
    accountIdentifiers?: AccountIdentifiers
): AccountInfo | null {
    if (
        !accountIdentifiers ||
        (!accountIdentifiers.homeAccountId &&
            !accountIdentifiers.localAccountId &&
            !accountIdentifiers.username)
    ) {
        // If no account identifiers are provided, return active account
        return instance.getActiveAccount();
    }

    return getAccountByIdentifiers(
        instance.getAllAccounts(),
        accountIdentifiers
    );
}

/**
 * Given 1 or more accountIdentifiers, returns the Account object if the user is signed-in
 * @param accountIdentifiers
 */
export function useAccount(
    accountIdentifiers?: AccountIdentifiers
): AccountInfo | null {
    const { instance, inProgress, logger } = useMsal();

    const [account, setAccount] = useState<AccountInfo | null>(() => {
        if (inProgress === InteractionStatus.Startup) {
            return null;
        } else {
            return getAccount(instance, accountIdentifiers);
        }
    });

    useEffect(() => {
        if (inProgress !== InteractionStatus.Startup) {
            setAccount((currentAccount: AccountInfo | null) => {
                const nextAccount = getAccount(instance, accountIdentifiers);
                if (
                    !AccountEntity.accountInfoIsEqual(
                        currentAccount,
                        nextAccount,
                        true
                    )
                ) {
                    logger.info("useAccount - Updating account");
                    return nextAccount;
                }

                return currentAccount;
            });
        }
    }, [inProgress, accountIdentifiers, instance, logger]);

    return account;
}

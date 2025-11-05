/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { useState, useEffect, useCallback } from "react";
import {
    AccountInfo,
    IPublicClientApplication,
    InteractionStatus,
    EventMessage,
    EventType,
    InteractionType,
    IdTokenClaims,
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
 * Helper function to determine whether 2 accountInfo objects represent the same account
 * @param accountA
 * @param accountB
 */
export function accountInfoIsEqual(
    accountA: AccountInfo | null,
    accountB: AccountInfo | null
): boolean {
    if (!accountA || !accountB) {
        return false;
    }

    const accountAClaims = (accountA.idTokenClaims || {}) as IdTokenClaims;
    const accountBClaims = (accountB.idTokenClaims || {}) as IdTokenClaims;

    // issued at timestamp and nonce are expected to change each time a new id token is acquired
    const claimsMatch =
        accountAClaims.iat === accountBClaims.iat &&
        accountAClaims.nonce === accountBClaims.nonce;

    return (
        accountA.homeAccountId === accountB.homeAccountId &&
        accountA.localAccountId === accountB.localAccountId &&
        accountA.username === accountB.username &&
        accountA.tenantId === accountB.tenantId &&
        accountA.environment === accountB.environment &&
        accountA.nativeAccountId === accountB.nativeAccountId &&
        claimsMatch
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

    const updateAccount = useCallback(() => {
        const nextAccount = getAccount(instance, accountIdentifiers);
        setAccount((currentAccount: AccountInfo | null) => {
            if (!accountInfoIsEqual(currentAccount, nextAccount)) {
                logger.info("useAccount - Updating account", "");
                return nextAccount;
            }
            return currentAccount;
        });
    }, [accountIdentifiers, instance, logger]);

    useEffect(() => {
        if (inProgress !== InteractionStatus.Startup) {
            updateAccount();
        }

        const callbackId = instance.addEventCallback(
            (message: EventMessage) => {
                if (
                    message.eventType === EventType.ACTIVE_ACCOUNT_CHANGED ||
                    (message.eventType === EventType.LOGIN_SUCCESS &&
                        message.interactionType === InteractionType.Silent)
                ) {
                    updateAccount();
                }
            }
        );

        return () => {
            if (callbackId) {
                instance.removeEventCallback(callbackId);
            }
        };
    }, [updateAccount, inProgress, instance]);

    return account;
}

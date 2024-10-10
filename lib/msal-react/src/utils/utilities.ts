/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountIdentifiers } from "../types/AccountIdentifiers.js";
import { AccountInfo } from "@azure/msal-browser";

type FaaCFunction = <T>(args: T) => React.ReactNode;

export function getChildrenOrFunction<T>(
    children: React.ReactNode | FaaCFunction,
    args: T
): React.ReactNode {
    if (typeof children === "function") {
        return children(args);
    }
    return children;
}

/*
 * Utility types
 * Reference: https://github.com/piotrwitek/utility-types
 */
export type SetDifference<A, B> = A extends B ? never : A;
export type SetComplement<A, A1 extends A> = SetDifference<A, A1>;
export type Subtract<T extends T1, T1 extends object> = Pick<
    T,
    SetComplement<keyof T, keyof T1>
>;

/**
 * Helper function to determine whether 2 arrays are equal
 * Used to avoid unnecessary state updates
 * @param arrayA
 * @param arrayB
 */
export function accountArraysAreEqual(
    arrayA: Array<AccountIdentifiers>,
    arrayB: Array<AccountIdentifiers>
): boolean {
    if (arrayA.length !== arrayB.length) {
        return false;
    }

    const comparisonArray = [...arrayB];

    return arrayA.every((elementA) => {
        const elementB = comparisonArray.shift();
        if (!elementA || !elementB) {
            return false;
        }

        return (
            elementA.homeAccountId === elementB.homeAccountId &&
            elementA.localAccountId === elementB.localAccountId &&
            elementA.username === elementB.username
        );
    });
}

export function getAccountByIdentifiers(
    allAccounts: AccountInfo[],
    accountIdentifiers: AccountIdentifiers
): AccountInfo | null {
    if (
        allAccounts.length > 0 &&
        (accountIdentifiers.homeAccountId ||
            accountIdentifiers.localAccountId ||
            accountIdentifiers.username)
    ) {
        const matchedAccounts = allAccounts.filter((accountObj) => {
            if (
                accountIdentifiers.username &&
                accountIdentifiers.username.toLowerCase() !==
                    accountObj.username.toLowerCase()
            ) {
                return false;
            }
            if (
                accountIdentifiers.homeAccountId &&
                accountIdentifiers.homeAccountId.toLowerCase() !==
                    accountObj.homeAccountId.toLowerCase()
            ) {
                return false;
            }
            if (
                accountIdentifiers.localAccountId &&
                accountIdentifiers.localAccountId.toLowerCase() !==
                    accountObj.localAccountId.toLowerCase()
            ) {
                return false;
            }

            return true;
        });

        return matchedAccounts[0] || null;
    } else {
        return null;
    }
}

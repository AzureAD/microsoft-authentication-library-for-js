/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "@azure/msal-browser";
import { accountArraysAreEqual } from "../../src/utils/utilities";

const testAccount1: AccountInfo =  {
    localAccountId: "test-local-account-id-1",
    homeAccountId: "test-home-account-id-1",
    tenantId: "test-tenant",
    username: "test-username",
    environment: "test-environment"
};

const testAccount2: AccountInfo =  {
    localAccountId: "test-local-account-id-2",
    homeAccountId: "test-home-account-id-2",
    tenantId: "test-tenant",
    username: "test-username",
    environment: "test-environment"
};

const testAccount3: AccountInfo =  {
    localAccountId: "test-local-account-id-3",
    homeAccountId: "test-home-account-id-3",
    tenantId: "test-tenant",
    username: "test-username",
    environment: "test-environment"
};

describe("utilities tests", () => {
    describe("accountArraysAreEqual tests", () => {
        test("returns true if both arrays have the same accounts in the same order", () => {
            expect(accountArraysAreEqual([testAccount1, testAccount2], [testAccount1, testAccount2])).toBe(true);
        });

        test("returns false if arrays have different accounts", () => {
            expect(accountArraysAreEqual([testAccount1, testAccount2], [testAccount1, testAccount3])).toBe(false);
        });

        test("returns false if both arrays have the same accounts but in different order", () => {
            expect(accountArraysAreEqual([testAccount1, testAccount2], [testAccount2, testAccount1])).toBe(false);
        });

        test("returns false if arrays are different lengths", () => {
            expect(accountArraysAreEqual([testAccount1, testAccount2], [testAccount1])).toBe(false);
            expect(accountArraysAreEqual([testAccount1], [testAccount1, testAccount2])).toBe(false);
        });

        test("returns false if any element of either array is null or undefined", () => {
            // @ts-ignore
            expect(accountArraysAreEqual([testAccount1, null], [testAccount1, testAccount2])).toBe(false);
            // @ts-ignore
            expect(accountArraysAreEqual([testAccount1, testAccount2], [null, testAccount2])).toBe(false);
            // @ts-ignore
            expect(accountArraysAreEqual([testAccount1, undefined], [testAccount1, testAccount2])).toBe(false);
            // @ts-ignore
            expect(accountArraysAreEqual([testAccount1, testAccount2], [undefined, testAccount2])).toBe(false);
        });
    });
});
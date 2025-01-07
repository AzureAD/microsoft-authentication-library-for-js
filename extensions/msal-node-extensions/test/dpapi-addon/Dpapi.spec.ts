/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Dpapi } from "../../src/Dpapi";
import { DataProtectionScope } from "../../src/persistence/DataProtectionScope";
import { platform } from "process";

// DPAPI is only available on windows
describe("Test DPAPI addon", () => {
    if (platform === "win32") {
        test("Protect and Unprotect data", () => {
            const data = Buffer.from("DPAPITestString");

            const encryptedData = Dpapi.protectData(
                data,
                null,
                DataProtectionScope.CurrentUser
            );
            const decryptedData = Dpapi.unprotectData(
                encryptedData,
                null,
                DataProtectionScope.CurrentUser
            );
            expect(decryptedData).toEqual(data);
        });

        test("Protect and Unprotect data with entropy", () => {
            const data = Buffer.from("DPAPITestString");
            const entropy = Buffer.from("entropy");

            const encryptedData = Dpapi.protectData(
                data,
                entropy,
                DataProtectionScope.CurrentUser
            );
            const decryptedData = Dpapi.unprotectData(
                encryptedData,
                entropy,
                DataProtectionScope.CurrentUser
            );
            expect(decryptedData).toEqual(data);
        });

        test("Protect and Unprotect data with local machine scope", () => {
            const data = Buffer.from("DPAPITestString");

            const encryptedData = Dpapi.protectData(
                data,
                null,
                DataProtectionScope.LocalMachine
            );
            const decryptedData = Dpapi.unprotectData(
                encryptedData,
                null,
                DataProtectionScope.LocalMachine
            );
            expect(decryptedData).toEqual(data);
        });
    } else {
        test("Should throw on non-Windows", () => {
            const data = Buffer.from("DPAPITestString");
            expect(() =>
                Dpapi.protectData(data, null, DataProtectionScope.LocalMachine)
            ).toThrow();
        });
    }
});

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ManagedIdentityApplication } from "../../src/client/ManagedIdentityApplication";
import { ManagedIdentityConfiguration } from "../../src/config/Configuration";
import { ManagedIdentityRequestParams } from "../../src/request/ManagedIdentityRequestParams";
import {
    DEFAULT_NON_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT,
    DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT,
    MANAGED_IDENTITY_CLIENT_ID,
    MANAGED_IDENTITY_RESOURCE,
} from "../test_kit/StringConstants";

import { ManagedIdentityTestUtils } from "../test_kit/ManagedIdentityTestUtils";
import { DEFAULT_MANAGED_IDENTITY_ID } from "../../src/utils/Constants";
import { AuthenticationResult } from "@azure/msal-common";

describe("ManagedIdentityApplication unit tests", () => {
    let OLD_ENVS: NodeJS.ProcessEnv;
    beforeAll(() => {
        // make a copy of old environment
        OLD_ENVS = process.env;
    });
    afterAll(() => {
        // restore old environment
        process.env = OLD_ENVS;
    });

    const managedIdentityRequestParams: ManagedIdentityRequestParams = {
        resource: MANAGED_IDENTITY_RESOURCE,
    };

    const userAssignedClientIdConfig: ManagedIdentityConfiguration = {
        system: {
            networkClient:
                ManagedIdentityTestUtils.getManagedIdentityNetworkClient(
                    MANAGED_IDENTITY_CLIENT_ID
                ),
        },
        managedIdentityIdParams: {
            userAssignedClientId: MANAGED_IDENTITY_CLIENT_ID,
        },
    };

    const systemAssignedConfig: ManagedIdentityConfiguration = {
        system: {
            networkClient:
                ManagedIdentityTestUtils.getManagedIdentityNetworkClient(
                    DEFAULT_MANAGED_IDENTITY_ID
                ),
            // managedIdentityIdParams will be omitted for system-assigned
        },
    };

    describe("Constructor", () => {
        test("creates a ManagedIdentityApplication", () => {
            const managedIdentityApplication = new ManagedIdentityApplication(
                systemAssignedConfig
            );
            expect(managedIdentityApplication).not.toBeNull();
            expect(
                managedIdentityApplication instanceof ManagedIdentityApplication
            ).toBe(true);
        });
    });

    describe("Acquires a token successfully via an App Service Managed Identity", () => {
        beforeAll(() => {
            // make a copy
            process.env = { ...OLD_ENVS };

            process.env["IDENTITY_ENDPOINT"] = "fake_IDENTITY_ENDPOINT";
            process.env["IDENTITY_HEADER"] = "fake_IDENTITY_HEADER";
        });

        afterAll(() => {
            // restore old environment
            process.env = OLD_ENVS;
        });

        test("acquires a User Assigned Client Id token", async () => {
            const managedIdentityApplication = new ManagedIdentityApplication(
                userAssignedClientIdConfig
            );
            expect(ManagedIdentityTestUtils.isAppService()).toBe(true);

            const networkManagedIdentityResult: AuthenticationResult =
                await managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );

            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_NON_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );
        });

        describe("System-Assigned token", () => {
            let managedIdentityApplication: ManagedIdentityApplication;
            beforeEach(() => {
                managedIdentityApplication = new ManagedIdentityApplication(
                    systemAssignedConfig
                );
            });

            test("1: acquires a System-Assigned token", async () => {
                expect(ManagedIdentityTestUtils.isAppService()).toBe(true);

                const networkManagedIdentityResult: AuthenticationResult =
                    await managedIdentityApplication.acquireToken(
                        managedIdentityRequestParams
                    );
                expect(networkManagedIdentityResult.fromCache).toBe(false);

                expect(networkManagedIdentityResult.accessToken).toEqual(
                    DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
                );
            });

            test.skip("2: acquires a System-Assigned token, then returns it from the cache when another acquireToken call is made", async () => {
                expect(ManagedIdentityTestUtils.isAppService()).toBe(true);

                const networkManagedIdentityResult: AuthenticationResult =
                    await managedIdentityApplication.acquireToken({
                        resource: MANAGED_IDENTITY_RESOURCE,
                    });
                expect(networkManagedIdentityResult.fromCache).toBe(false);

                expect(networkManagedIdentityResult.accessToken).toEqual(
                    DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
                );

                const cacheManagedIdentityResult =
                    await managedIdentityApplication.acquireToken({
                        resource: MANAGED_IDENTITY_RESOURCE,
                    });
                expect(cacheManagedIdentityResult.fromCache).toBe(true);
                expect(cacheManagedIdentityResult.accessToken).toEqual(
                    DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
                );
            });
        });
    });

    describe("Acquires a token successfully via an IMDS Managed Identity", () => {
        // IMDS doesn't need an environment variable because there is a default IMDS endpoint

        test("acquires a User Assigned Client Id token", async () => {
            const managedIdentityApplication = new ManagedIdentityApplication(
                userAssignedClientIdConfig
            );
            expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

            const networkManagedIdentityResult: AuthenticationResult =
                await managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );

            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_NON_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );
        });

        describe("System-Assigned token", () => {
            let managedIdentityApplication: ManagedIdentityApplication;
            beforeEach(() => {
                managedIdentityApplication = new ManagedIdentityApplication(
                    systemAssignedConfig
                );
            });

            test("1: acquires a System-Assigned token", async () => {
                expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

                const networkManagedIdentityResult: AuthenticationResult =
                    await managedIdentityApplication.acquireToken(
                        managedIdentityRequestParams
                    );
                expect(networkManagedIdentityResult.fromCache).toBe(false);

                expect(networkManagedIdentityResult.accessToken).toEqual(
                    DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
                );
            });

            test.skip("2: acquires a System-Assigned token, then returns it from the cache when another acquireToken call is made", async () => {
                expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

                const networkManagedIdentityResult: AuthenticationResult =
                    await managedIdentityApplication.acquireToken({
                        resource: MANAGED_IDENTITY_RESOURCE,
                    });
                expect(networkManagedIdentityResult.fromCache).toBe(false);

                expect(networkManagedIdentityResult.accessToken).toEqual(
                    DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
                );

                const cacheManagedIdentityResult =
                    await managedIdentityApplication.acquireToken({
                        resource: MANAGED_IDENTITY_RESOURCE,
                    });
                expect(cacheManagedIdentityResult.fromCache).toBe(true);
                expect(cacheManagedIdentityResult.accessToken).toEqual(
                    DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
                );
            });
        });
    });
});

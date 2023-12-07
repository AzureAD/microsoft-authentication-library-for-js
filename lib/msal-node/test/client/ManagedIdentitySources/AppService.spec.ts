/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ManagedIdentityApplication } from "../../../src/client/ManagedIdentityApplication";
import {
    DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT,
    DEFAULT_USER_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT,
    MANAGED_IDENTITY_RESOURCE,
} from "../../test_kit/StringConstants";

import {
    ManagedIdentityTestUtils,
    userAssignedClientIdConfig,
    managedIdentityRequestParams,
    systemAssignedConfig,
} from "../../test_kit/ManagedIdentityTestUtils";
import { AuthenticationResult } from "@azure/msal-common";
import { ManagedIdentityClient } from "../../../src/client/ManagedIdentityClient";

describe("Acquires a token successfully via an App Service Managed Identity", () => {
    let OLD_ENVS: NodeJS.ProcessEnv;

    beforeAll(() => {
        // make a copy of old environment
        OLD_ENVS = process.env;

        process.env["IDENTITY_ENDPOINT"] = "fake_IDENTITY_ENDPOINT";
        process.env["IDENTITY_HEADER"] = "fake_IDENTITY_HEADER";
    });

    afterAll(() => {
        // restore old environment
        process.env = OLD_ENVS;
    });

    afterEach(() => {
        // reset static variables after each test
        ManagedIdentityClient.identitySource = undefined;
        ManagedIdentityApplication["nodeStorage"] = undefined;
    });

    test("acquires a User Assigned Client Id token", async () => {
        expect(ManagedIdentityTestUtils.isAppService()).toBe(true);

        const managedIdentityApplication: ManagedIdentityApplication =
            new ManagedIdentityApplication(userAssignedClientIdConfig);

        const networkManagedIdentityResult: AuthenticationResult =
            await managedIdentityApplication.acquireToken(
                managedIdentityRequestParams
            );

        expect(networkManagedIdentityResult.accessToken).toEqual(
            DEFAULT_USER_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
        );
    });

    describe("System Assigned", () => {
        let managedIdentityApplication: ManagedIdentityApplication;
        beforeEach(() => {
            managedIdentityApplication = new ManagedIdentityApplication(
                systemAssignedConfig
            );
        });

        test("acquires a token", async () => {
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

        test("returns an already acquired token from the cache", async () => {
            expect(ManagedIdentityTestUtils.isAppService()).toBe(true);

            const networkManagedIdentityResult: AuthenticationResult =
                await managedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                });
            expect(networkManagedIdentityResult.fromCache).toBe(false);

            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );

            const cachedManagedIdentityResult: AuthenticationResult =
                await managedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                });
            expect(cachedManagedIdentityResult.fromCache).toBe(true);
            expect(cachedManagedIdentityResult.accessToken).toEqual(
                DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );
        });
    });
});

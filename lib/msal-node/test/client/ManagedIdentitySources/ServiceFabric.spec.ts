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
import { ManagedIdentityEnvironmentVariableNames } from "../../../src/utils/Constants";

describe("Acquires a token successfully via an App Service Managed Identity", () => {
    beforeAll(() => {
        process.env[ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT] =
            "fake_IDENTITY_ENDPOINT";
        process.env[ManagedIdentityEnvironmentVariableNames.IDENTITY_HEADER] =
            "fake_IDENTITY_HEADER";
        process.env[
            ManagedIdentityEnvironmentVariableNames.IDENTITY_SERVER_THUMBPRINT
        ] = "fake_IDENTITY_SERVER_THUMBPRINT";
    });

    afterAll(() => {
        delete process.env[
            ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT
        ];
        delete process.env[
            ManagedIdentityEnvironmentVariableNames.IDENTITY_HEADER
        ];
        delete process.env[
            ManagedIdentityEnvironmentVariableNames.IDENTITY_SERVER_THUMBPRINT
        ];
    });

    afterEach(() => {
        // reset static variables after each test
        ManagedIdentityClient.identitySource = undefined;
        ManagedIdentityApplication["nodeStorage"] = undefined;
    });

    test("acquires a User Assigned Client Id token", async () => {
        expect(ManagedIdentityTestUtils.isServiceFabric()).toBe(true);

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
            expect(ManagedIdentityTestUtils.isServiceFabric()).toBe(true);

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
            expect(ManagedIdentityTestUtils.isServiceFabric()).toBe(true);

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

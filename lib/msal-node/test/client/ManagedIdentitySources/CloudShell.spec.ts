/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ManagedIdentityApplication } from "../../../src/client/ManagedIdentityApplication";
import {
    DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT,
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
import {
    AzureIdentitySdkManagedIdentitySourceNames,
    ManagedIdentityEnvironmentVariableNames,
} from "../../../src/utils/Constants";
import {
    ManagedIdentityErrorCodes,
    createManagedIdentityError,
} from "../../../src/error/ManagedIdentityError";

describe("Acquires a token successfully via an App Service Managed Identity", () => {
    beforeAll(() => {
        process.env[ManagedIdentityEnvironmentVariableNames.MSI_ENDPOINT] =
            "msi_IDENTITY_ENDPOINT";
    });

    afterAll(() => {
        delete process.env[
            ManagedIdentityEnvironmentVariableNames.MSI_ENDPOINT
        ];
    });

    afterEach(() => {
        // reset static variables after each test
        delete ManagedIdentityClient["identitySource"];
        delete ManagedIdentityApplication["nodeStorage"];
    });

    describe("System Assigned", () => {
        let managedIdentityApplication: ManagedIdentityApplication;
        beforeEach(() => {
            managedIdentityApplication = new ManagedIdentityApplication(
                systemAssignedConfig
            );
            expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
                AzureIdentitySdkManagedIdentitySourceNames.CLOUD_SHELL
            );
        });

        test("acquires a token", async () => {
            expect(ManagedIdentityTestUtils.isCloudShell()).toBe(true);

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
            expect(ManagedIdentityTestUtils.isCloudShell()).toBe(true);

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

    describe("Errors", () => {
        test("throws an error when a user assigned managed identity is used", async () => {
            expect(ManagedIdentityTestUtils.isCloudShell()).toBe(true);

            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(userAssignedClientIdConfig);
            expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
                AzureIdentitySdkManagedIdentitySourceNames.CLOUD_SHELL
            );

            await expect(
                managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                )
            ).rejects.toMatchObject(
                createManagedIdentityError(
                    ManagedIdentityErrorCodes.unableToCreateCloudShell
                )
            );
        });
    });
});

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ManagedIdentityApplication } from "../../../src/client/ManagedIdentityApplication.js";
import {
    DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT,
    DEFAULT_USER_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT,
    MANAGED_IDENTITY_MACHINE_LEARNING_NETWORK_REQUEST_400_ERROR,
    MANAGED_IDENTITY_RESOURCE,
    MANAGED_IDENTITY_RESOURCE_ID,
} from "../../test_kit/StringConstants.js";

import {
    userAssignedClientIdConfig,
    managedIdentityRequestParams,
    systemAssignedConfig,
    networkClient,
    ManagedIdentityNetworkErrorClient,
    userAssignedResourceIdConfig,
} from "../../test_kit/ManagedIdentityTestUtils.js";
import {
    AuthenticationResult,
    HttpStatus,
    ServerError,
} from "@azure/msal-common";
import { ManagedIdentityClient } from "../../../src/client/ManagedIdentityClient.js";
import {
    ManagedIdentityEnvironmentVariableNames,
    ManagedIdentitySourceNames,
} from "../../../src/utils/Constants.js";
import { ManagedIdentityUserAssignedIdQueryParameterNames } from "../../../src/client/ManagedIdentitySources/BaseManagedIdentitySource.js";

describe("Acquires a token successfully via an Machine Learning Managed Identity", () => {
    beforeAll(() => {
        process.env[ManagedIdentityEnvironmentVariableNames.MSI_ENDPOINT] =
            "fake_MSI_ENDPOINT";
        process.env[ManagedIdentityEnvironmentVariableNames.MSI_SECRET] =
            "fake_MSI_SECRET";
    });

    afterAll(() => {
        delete process.env[
            ManagedIdentityEnvironmentVariableNames.MSI_ENDPOINT
        ];
        delete process.env[ManagedIdentityEnvironmentVariableNames.MSI_SECRET];
    });

    afterEach(() => {
        // reset static variables after each test
        delete ManagedIdentityClient["identitySource"];
        delete ManagedIdentityClient["sourceName"];
        delete ManagedIdentityApplication["nodeStorage"];
        jest.restoreAllMocks();
    });

    describe("User Assigned", () => {
        test("acquires a User Assigned Client Id token", async () => {
            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(userAssignedClientIdConfig);
            expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
                ManagedIdentitySourceNames.MACHINE_LEARNING
            );

            const networkManagedIdentityResult: AuthenticationResult =
                await managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );

            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_USER_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );
        });

        test("acquires a User Assigned Resource Id token", async () => {
            const sendGetRequestAsyncSpy: jest.SpyInstance = jest.spyOn(
                networkClient,
                <any>"sendGetRequestAsync"
            );

            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(userAssignedResourceIdConfig);
            expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
                ManagedIdentitySourceNames.MACHINE_LEARNING
            );

            const networkManagedIdentityResult: AuthenticationResult =
                await managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );

            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_USER_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );

            const url: URLSearchParams = new URLSearchParams(
                sendGetRequestAsyncSpy.mock.lastCall[0]
            );
            expect(
                url.has(
                    ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_RESOURCE_ID_NON_IMDS
                )
            ).toBe(true);
            expect(
                url.get(
                    ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_RESOURCE_ID_NON_IMDS
                )
            ).toEqual(MANAGED_IDENTITY_RESOURCE_ID);
        });

        test("ensures that App Service is selected as the Managed Identity source when all App Service and Machine Learning environment variables are present", async () => {
            process.env[
                ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT
            ] = "fake_IDENTITY_ENDPOINT";
            process.env[
                ManagedIdentityEnvironmentVariableNames.IDENTITY_HEADER
            ] = "fake_IDENTITY_HEADER";

            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(userAssignedClientIdConfig);
            expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
                ManagedIdentitySourceNames.APP_SERVICE
            );

            delete process.env[
                ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT
            ];
            delete process.env[
                ManagedIdentityEnvironmentVariableNames.IDENTITY_HEADER
            ];
        });
    });

    describe("System Assigned", () => {
        let managedIdentityApplication: ManagedIdentityApplication;
        beforeEach(() => {
            managedIdentityApplication = new ManagedIdentityApplication(
                systemAssignedConfig
            );
            expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
                ManagedIdentitySourceNames.MACHINE_LEARNING
            );
        });

        test("acquires a token", async () => {
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
        test("ensures that the error format is correct", async () => {
            const managedIdentityNetworkErrorClient400 =
                new ManagedIdentityNetworkErrorClient(
                    MANAGED_IDENTITY_MACHINE_LEARNING_NETWORK_REQUEST_400_ERROR,
                    undefined,
                    HttpStatus.BAD_REQUEST
                );

            jest.spyOn(networkClient, <any>"sendGetRequestAsync")
                // permanently override the networkClient's sendGetRequestAsync method to return a 400
                .mockReturnValue(
                    managedIdentityNetworkErrorClient400.sendGetRequestAsync()
                );

            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(systemAssignedConfig);
            expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
                ManagedIdentitySourceNames.MACHINE_LEARNING
            );

            let serverError: ServerError = new ServerError();
            try {
                await managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );
            } catch (e) {
                serverError = e as ServerError;
            }

            expect(
                serverError.errorMessage.includes(
                    MANAGED_IDENTITY_MACHINE_LEARNING_NETWORK_REQUEST_400_ERROR.message as string
                )
            ).toBe(true);
            expect(
                serverError.errorMessage.includes(
                    MANAGED_IDENTITY_MACHINE_LEARNING_NETWORK_REQUEST_400_ERROR.correlation_id as string
                )
            ).toBe(true);
        });
    });
});

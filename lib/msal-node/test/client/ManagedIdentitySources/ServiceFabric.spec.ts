/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ManagedIdentityApplication } from "../../../src/client/ManagedIdentityApplication";
import {
    DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT,
    DEFAULT_USER_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT,
    MANAGED_IDENTITY_RESOURCE,
    MANAGED_IDENTITY_SERVICE_FABRIC_NETWORK_REQUEST_400_ERROR,
} from "../../test_kit/StringConstants";

import {
    userAssignedClientIdConfig,
    managedIdentityRequestParams,
    systemAssignedConfig,
    ManagedIdentityNetworkErrorClient,
    networkClient,
} from "../../test_kit/ManagedIdentityTestUtils";
import {
    AuthenticationResult,
    HttpStatus,
    ServerError,
} from "@azure/msal-common";
import { ManagedIdentityClient } from "../../../src/client/ManagedIdentityClient";
import {
    ManagedIdentityEnvironmentVariableNames,
    ManagedIdentitySourceNames,
} from "../../../src/utils/Constants";

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
        delete ManagedIdentityClient["identitySource"];
        delete ManagedIdentityApplication["nodeStorage"];
    });

    test("acquires a User Assigned Client Id token", async () => {
        const managedIdentityApplication: ManagedIdentityApplication =
            new ManagedIdentityApplication(userAssignedClientIdConfig);
        expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
            ManagedIdentitySourceNames.SERVICE_FABRIC
        );

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
            expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
                ManagedIdentitySourceNames.SERVICE_FABRIC
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
                    MANAGED_IDENTITY_SERVICE_FABRIC_NETWORK_REQUEST_400_ERROR,
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
                ManagedIdentitySourceNames.SERVICE_FABRIC
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
                    MANAGED_IDENTITY_SERVICE_FABRIC_NETWORK_REQUEST_400_ERROR.error as string
                )
            ).toBe(true);
            expect(
                serverError.errorMessage.includes(
                    MANAGED_IDENTITY_SERVICE_FABRIC_NETWORK_REQUEST_400_ERROR.error_description as string
                )
            ).toBe(true);
            MANAGED_IDENTITY_SERVICE_FABRIC_NETWORK_REQUEST_400_ERROR.error_codes?.forEach(
                (errorCode) => {
                    expect(serverError.errorMessage.includes(errorCode)).toBe(
                        true
                    );
                }
            );
            expect(
                serverError.errorMessage.includes(
                    MANAGED_IDENTITY_SERVICE_FABRIC_NETWORK_REQUEST_400_ERROR.timestamp as string
                )
            ).toBe(true);
            expect(
                serverError.errorMessage.includes(
                    MANAGED_IDENTITY_SERVICE_FABRIC_NETWORK_REQUEST_400_ERROR.trace_id as string
                )
            ).toBe(true);
            expect(
                serverError.errorMessage.includes(
                    MANAGED_IDENTITY_SERVICE_FABRIC_NETWORK_REQUEST_400_ERROR.correlation_id as string
                )
            ).toBe(true);

            jest.restoreAllMocks();
        });
    });
});

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ManagedIdentityApplication } from "../../../src/client/ManagedIdentityApplication.js";
import {
    DEFAULT_USER_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT,
    LINEAR_POLICY_MAX_RETRIES_IN_MS,
    MANAGED_IDENTITY_SERVICE_FABRIC_NETWORK_REQUEST_400_ERROR,
    MANAGED_IDENTITY_TOKEN_RETRIEVAL_ERROR_MESSAGE,
    ONE_HUNDRED_TIMES_FASTER,
} from "../../test_kit/StringConstants.js";

import {
    userAssignedClientIdConfig,
    managedIdentityRequestParams,
    systemAssignedConfig,
    ManagedIdentityNetworkErrorClient,
    networkClient,
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
import { DefaultManagedIdentityRetryPolicy } from "../../../src/retry/DefaultManagedIdentityRetryPolicy.js";

describe("Linear Retry Policy (App Service, Azure Arc, Cloud Shell, Machine Learning, Service Fabric)", () => {
    beforeAll(() => {
        // The managed identity's source will be set to Service Fabric for these tests
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

    beforeEach(() => {
        jest.spyOn(
            DefaultManagedIdentityRetryPolicy,
            "DEFAULT_MANAGED_IDENTITY_RETRY_DELAY_MS",
            "get"
        ).mockReturnValue(
            DefaultManagedIdentityRetryPolicy.DEFAULT_MANAGED_IDENTITY_RETRY_DELAY_MS *
                ONE_HUNDRED_TIMES_FASTER
        );
    });

    afterEach(() => {
        // reset static variables after each test
        delete ManagedIdentityClient["identitySource"];
        delete ManagedIdentityApplication["nodeStorage"];
        jest.restoreAllMocks();
    });

    const managedIdentityNetworkErrorClientDefault500 =
        new ManagedIdentityNetworkErrorClient();
    const managedIdentityNetworkErrorClient400 =
        new ManagedIdentityNetworkErrorClient(
            MANAGED_IDENTITY_SERVICE_FABRIC_NETWORK_REQUEST_400_ERROR,
            undefined,
            HttpStatus.BAD_REQUEST
        );

    describe("User Assigned", () => {
        let managedIdentityApplication: ManagedIdentityApplication;
        beforeEach(() => {
            managedIdentityApplication = new ManagedIdentityApplication(
                userAssignedClientIdConfig
            );
            expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
                ManagedIdentitySourceNames.SERVICE_FABRIC
            );
        });

        test("returns a 500 error response from the network request, just the first time", async () => {
            const sendGetRequestAsyncSpy: jest.SpyInstance = jest
                .spyOn(networkClient, <any>"sendGetRequestAsync")
                // override the networkClient's sendGetRequestAsync method to return a 500.
                // after this override, original functionality will be restored
                // and the network request will complete successfully
                .mockReturnValueOnce(
                    managedIdentityNetworkErrorClientDefault500.sendGetRequestAsync()
                );

            const networkManagedIdentityResult: AuthenticationResult =
                await managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );

            expect(sendGetRequestAsyncSpy).toHaveBeenCalledTimes(2);
            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_USER_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );
        });

        test("returns a 500 error response from the network request permanently", async () => {
            const sendGetRequestAsyncSpy: jest.SpyInstance = jest
                .spyOn(networkClient, <any>"sendGetRequestAsync")
                // permanently override the networkClient's sendGetRequestAsync method to return a 500
                .mockReturnValue(
                    managedIdentityNetworkErrorClientDefault500.sendGetRequestAsync()
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
                    MANAGED_IDENTITY_TOKEN_RETRIEVAL_ERROR_MESSAGE
                )
            ).toBe(true);

            expect(sendGetRequestAsyncSpy).toHaveBeenCalledTimes(4); // request + 3 retries
        });
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

        test("returns a 500 error response from the network request, just the first time, with no retry-after header", async () => {
            const sendGetRequestAsyncSpy: jest.SpyInstance = jest
                .spyOn(networkClient, <any>"sendGetRequestAsync")
                // override the networkClient's sendGetRequestAsync method to return a 500.
                // after this override, original functionality will be restored
                // and the network request will complete successfully
                .mockReturnValueOnce(
                    managedIdentityNetworkErrorClientDefault500.sendGetRequestAsync()
                );

            const timeBeforeNetworkRequest = new Date();

            const networkManagedIdentityResult: AuthenticationResult =
                await managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );

            const timeAfterNetworkRequest = new Date();

            // ensure that no extra time has elapsed between requests, because no retry-after header was sent
            expect(
                timeAfterNetworkRequest.valueOf() -
                    timeBeforeNetworkRequest.valueOf()
            ).toBeGreaterThanOrEqual(
                DefaultManagedIdentityRetryPolicy.DEFAULT_MANAGED_IDENTITY_RETRY_DELAY_MS
            ); // only 1 retry out of 3 possible

            expect(sendGetRequestAsyncSpy).toHaveBeenCalledTimes(2);
            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_USER_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );
        });

        test("returns a 500 error response from the network request, just the first time, with a retry-after header of 3 seconds", async () => {
            const headers: Record<string, string> = {
                "Retry-After": ".03", // 3 seconds, but make it one hundred times faster so the test completes quickly
            };
            const managedIdentityNetworkErrorClient =
                new ManagedIdentityNetworkErrorClient(undefined, headers);

            const sendGetRequestAsyncSpy: jest.SpyInstance = jest
                .spyOn(networkClient, <any>"sendGetRequestAsync")
                // override the networkClient's sendGetRequestAsync method to return a 500.
                // after this override, original functionality will be restored
                // and the network request will complete successfully
                .mockReturnValueOnce(
                    managedIdentityNetworkErrorClient.sendGetRequestAsync()
                );

            const timeBeforeNetworkRequest = new Date();

            const networkManagedIdentityResult: AuthenticationResult =
                await managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );

            const timeAfterNetworkRequest = new Date();

            // ensure that the number of seconds in the retry-after header elapsed before the second network request was made
            expect(
                timeAfterNetworkRequest.valueOf() -
                    timeBeforeNetworkRequest.valueOf()
            ).toBeGreaterThanOrEqual(
                LINEAR_POLICY_MAX_RETRIES_IN_MS * ONE_HUNDRED_TIMES_FASTER
            );

            expect(sendGetRequestAsyncSpy).toHaveBeenCalledTimes(2);
            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_USER_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );
        });

        test("returns a 500 error response from the network request, just the first time, with a retry-after header of 3 seconds (extrapolated from an http-date)", async () => {
            var retryAfterHttpDate = new Date();
            retryAfterHttpDate.setSeconds(
                retryAfterHttpDate.getSeconds() + 4 // 4 seconds. An extra second has been added to account for this date operation
            ); // this test can not be made one hundred times faster because it is based on a date
            const headers: Record<string, string> = {
                "Retry-After": retryAfterHttpDate.toString(),
            };
            const managedIdentityNetworkErrorClient =
                new ManagedIdentityNetworkErrorClient(undefined, headers);

            const sendGetRequestAsyncSpy: jest.SpyInstance = jest
                .spyOn(networkClient, <any>"sendGetRequestAsync")
                // override the networkClient's sendGetRequestAsync method to return a 500.
                // after this override, original functionality will be restored
                // and the network request will complete successfully
                .mockReturnValueOnce(
                    managedIdentityNetworkErrorClient.sendGetRequestAsync()
                );

            const timeBeforeNetworkRequest = new Date();

            const networkManagedIdentityResult: AuthenticationResult =
                await managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );

            const timeAfterNetworkRequest = new Date();

            // ensure that the number of seconds in the retry-after header elapsed before the second network request was made
            expect(
                timeAfterNetworkRequest.valueOf() -
                    timeBeforeNetworkRequest.valueOf()
            ).toBeGreaterThanOrEqual(LINEAR_POLICY_MAX_RETRIES_IN_MS);

            expect(sendGetRequestAsyncSpy).toHaveBeenCalledTimes(2);
            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_USER_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );
        });

        test("returns a 500 error response from the network request permanently", async () => {
            const sendGetRequestAsyncSpy: jest.SpyInstance = jest
                .spyOn(networkClient, <any>"sendGetRequestAsync")
                // permanently override the networkClient's sendGetRequestAsync method to return a 500
                .mockReturnValue(
                    managedIdentityNetworkErrorClientDefault500.sendGetRequestAsync()
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
                    MANAGED_IDENTITY_TOKEN_RETRIEVAL_ERROR_MESSAGE
                )
            ).toBe(true);
            expect(sendGetRequestAsyncSpy).toHaveBeenCalledTimes(4); // request + 3 retries
        });

        test("makes three acquireToken calls on the same managed identity application (which returns a 500 error response from the network request permanently) to ensure that retry policy lifetime is per request", async () => {
            const sendGetRequestAsyncSpyApp: jest.SpyInstance = jest
                .spyOn(networkClient, <any>"sendGetRequestAsync")
                // permanently override the networkClient's sendGetRequestAsync method to return a 500
                .mockReturnValue(
                    managedIdentityNetworkErrorClientDefault500.sendGetRequestAsync()
                );

            try {
                await managedIdentityApplication.acquireToken({
                    resource: "https://graph.microsoft1.com",
                });
            } catch (e) {
                expect(sendGetRequestAsyncSpyApp).toHaveBeenCalledTimes(4); // request + 3 retries
            }

            try {
                await managedIdentityApplication.acquireToken({
                    resource: "https://graph.microsoft2.com",
                });
            } catch (e) {
                expect(sendGetRequestAsyncSpyApp).toHaveBeenCalledTimes(8); // 8 total, 2 x (request + 3 retries)
            }

            try {
                await managedIdentityApplication.acquireToken({
                    resource: "https://graph.microsoft3.com",
                });
            } catch (e) {
                expect(sendGetRequestAsyncSpyApp).toHaveBeenCalledTimes(12); // 12 total, 3 x (request + 3 retries)
            }
        });

        test("ensures that a retry does not happen when the http status code from a failed network response is not included in the retry policy", async () => {
            const sendGetRequestAsyncSpyApp: jest.SpyInstance = jest
                .spyOn(networkClient, <any>"sendGetRequestAsync")
                // permanently override the networkClient's sendGetRequestAsync method to return a 400
                .mockReturnValue(
                    managedIdentityNetworkErrorClient400.sendGetRequestAsync()
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
                    MANAGED_IDENTITY_TOKEN_RETRIEVAL_ERROR_MESSAGE
                )
            ).toBe(true);
            expect(sendGetRequestAsyncSpyApp).toHaveBeenCalledTimes(1);
        });

        test("ensures that a retry does not happen when the http status code from a failed network response is included in the retry policy, but the retry policy has been disabled", async () => {
            const managedIdentityApplicationNoRetry: ManagedIdentityApplication =
                new ManagedIdentityApplication({
                    system: {
                        ...systemAssignedConfig.system,
                        disableInternalRetries: true,
                    },
                });
            expect(
                managedIdentityApplicationNoRetry.getManagedIdentitySource()
            ).toBe(ManagedIdentitySourceNames.SERVICE_FABRIC);

            const sendGetRequestAsyncSpy: jest.SpyInstance = jest
                .spyOn(networkClient, <any>"sendGetRequestAsync")
                // permanently override the networkClient's sendGetRequestAsync method to return a 500
                .mockReturnValue(
                    managedIdentityNetworkErrorClientDefault500.sendGetRequestAsync()
                );

            let serverError: ServerError = new ServerError();
            try {
                await managedIdentityApplicationNoRetry.acquireToken(
                    managedIdentityRequestParams
                );
            } catch (e) {
                serverError = e as ServerError;
            }

            expect(
                serverError.errorMessage.includes(
                    MANAGED_IDENTITY_TOKEN_RETRIEVAL_ERROR_MESSAGE
                )
            ).toBe(true);
            expect(sendGetRequestAsyncSpy).toHaveBeenCalledTimes(1);
        });
    });
});

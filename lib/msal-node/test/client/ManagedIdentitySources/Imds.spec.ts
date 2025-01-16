/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ManagedIdentityApplication } from "../../../src/client/ManagedIdentityApplication.js";
import { ManagedIdentityConfiguration } from "../../../src/config/Configuration.js";
import {
    DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT,
    DEFAULT_USER_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT,
    MANAGED_IDENTITY_IMDS_NETWORK_REQUEST_400_ERROR,
    MANAGED_IDENTITY_RESOURCE,
    MANAGED_IDENTITY_RESOURCE_BASE,
    MANAGED_IDENTITY_RESOURCE_ID,
    MANAGED_IDENTITY_RESOURCE_ID_2,
    MANAGED_IDENTITY_TOKEN_RETRIEVAL_ERROR_MESSAGE,
    TEST_CONFIG,
    THREE_SECONDS_IN_MILLI,
    getCacheKey,
} from "../../test_kit/StringConstants.js";
import {
    ManagedIdentityNetworkClient,
    ManagedIdentityNetworkErrorClient,
    networkClient,
    userAssignedClientIdConfig,
    managedIdentityRequestParams,
    systemAssignedConfig,
    userAssignedResourceIdConfig,
} from "../../test_kit/ManagedIdentityTestUtils.js";
import {
    DEFAULT_MANAGED_IDENTITY_ID,
    ManagedIdentitySourceNames,
} from "../../../src/utils/Constants.js";
import {
    AccessTokenEntity,
    AuthenticationResult,
    CacheHelpers,
    ClientConfigurationErrorCodes,
    createClientConfigurationError,
    DEFAULT_TOKEN_RENEWAL_OFFSET_SEC,
    HttpStatus,
    ServerError,
    TimeUtils,
} from "@azure/msal-common";
import { ManagedIdentityClient } from "../../../src/client/ManagedIdentityClient.js";
import {
    ManagedIdentityErrorCodes,
    createManagedIdentityError,
} from "../../../src/error/ManagedIdentityError.js";
import { mockCrypto } from "../ClientTestUtils.js";
// NodeJS 16+ provides a built-in version of setTimeout that is promise-based
import { setTimeout } from "timers/promises";
import { ClientCredentialClient } from "../../../src/client/ClientCredentialClient.js";
import { NodeStorage } from "../../../src/cache/NodeStorage.js";
import { CacheKVStore } from "../../../src/cache/serializer/SerializerTypes.js";
import { ManagedIdentityUserAssignedIdQueryParameterNames } from "../../../src/client/ManagedIdentitySources/BaseManagedIdentitySource.js";

describe("Acquires a token successfully via an IMDS Managed Identity", () => {
    // IMDS doesn't need environment variables because there is a default IMDS endpoint

    afterEach(() => {
        delete ManagedIdentityClient["identitySource"];
        delete ManagedIdentityApplication["nodeStorage"];
    });

    const managedIdentityNetworkErrorClientDefault500 =
        new ManagedIdentityNetworkErrorClient();
    const managedIdentityNetworkErrorClient400 =
        new ManagedIdentityNetworkErrorClient(
            MANAGED_IDENTITY_IMDS_NETWORK_REQUEST_400_ERROR,
            undefined,
            HttpStatus.BAD_REQUEST
        );

    const userAssignedObjectIdConfig: ManagedIdentityConfiguration = {
        system: {
            networkClient,
        },
        managedIdentityIdParams: {
            userAssignedObjectId: MANAGED_IDENTITY_RESOURCE_ID,
        },
    };

    describe("User Assigned", () => {
        test("acquires a User Assigned Client Id token", async () => {
            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(userAssignedClientIdConfig);
            expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
                ManagedIdentitySourceNames.DEFAULT_TO_IMDS
            );

            const networkManagedIdentityResult: AuthenticationResult =
                await managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );

            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_USER_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );
        });

        test("acquires a User Assigned Object Id token", async () => {
            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(userAssignedObjectIdConfig);
            expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
                ManagedIdentitySourceNames.DEFAULT_TO_IMDS
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
                ManagedIdentitySourceNames.DEFAULT_TO_IMDS
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
                    ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_RESOURCE_ID_IMDS
                )
            ).toBe(true);
            expect(
                url.get(
                    ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_RESOURCE_ID_IMDS
                )
            ).toEqual(MANAGED_IDENTITY_RESOURCE_ID);

            jest.restoreAllMocks();
        });
    });

    describe("System Assigned", () => {
        let managedIdentityApplication: ManagedIdentityApplication;
        beforeEach(() => {
            managedIdentityApplication = new ManagedIdentityApplication(
                systemAssignedConfig
            );
            expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
                ManagedIdentitySourceNames.DEFAULT_TO_IMDS
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

    describe("Managed Identity Retry Policy", () => {
        describe("User Assigned", () => {
            let managedIdentityApplication: ManagedIdentityApplication;
            beforeEach(() => {
                managedIdentityApplication = new ManagedIdentityApplication(
                    userAssignedClientIdConfig
                );
                expect(
                    managedIdentityApplication.getManagedIdentitySource()
                ).toBe(ManagedIdentitySourceNames.DEFAULT_TO_IMDS);
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

                jest.restoreAllMocks();
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

                jest.restoreAllMocks();
            });
        });

        describe("System Assigned", () => {
            let managedIdentityApplication: ManagedIdentityApplication;
            beforeEach(() => {
                managedIdentityApplication = new ManagedIdentityApplication(
                    systemAssignedConfig
                );
                expect(
                    managedIdentityApplication.getManagedIdentitySource()
                ).toBe(ManagedIdentitySourceNames.DEFAULT_TO_IMDS);
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
                ).toBeLessThan(THREE_SECONDS_IN_MILLI);

                expect(sendGetRequestAsyncSpy).toHaveBeenCalledTimes(2);
                expect(networkManagedIdentityResult.accessToken).toEqual(
                    DEFAULT_USER_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
                );

                jest.restoreAllMocks();
            });

            test("returns a 500 error response from the network request, just the first time, with a retry-after header of 3 seconds", async () => {
                const headers: Record<string, string> = {
                    "Retry-After": "3", // 3 seconds
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
                ).toBeGreaterThan(THREE_SECONDS_IN_MILLI);

                expect(sendGetRequestAsyncSpy).toHaveBeenCalledTimes(2);
                expect(networkManagedIdentityResult.accessToken).toEqual(
                    DEFAULT_USER_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
                );

                jest.restoreAllMocks();
            });

            test("returns a 500 error response from the network request, just the first time, with a retry-after header of 3 seconds (extrapolated from an http-date)", async () => {
                var retryAfterHttpDate = new Date();
                retryAfterHttpDate.setSeconds(
                    retryAfterHttpDate.getSeconds() + 4 // 4 seconds. An extra second has been added to account for this date operation
                );
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
                ).toBeGreaterThan(THREE_SECONDS_IN_MILLI);

                expect(sendGetRequestAsyncSpy).toHaveBeenCalledTimes(2);
                expect(networkManagedIdentityResult.accessToken).toEqual(
                    DEFAULT_USER_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
                );

                jest.restoreAllMocks();
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

                jest.restoreAllMocks();
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

                jest.restoreAllMocks();
            }, 15000); // triple the timeout value for this test because there are 3 acquireToken calls (3 x 1 second in between retries)

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

                jest.restoreAllMocks();
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
                ).toBe(ManagedIdentitySourceNames.DEFAULT_TO_IMDS);

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

                jest.restoreAllMocks();
            });
        });
    });

    describe("Miscellaneous", () => {
        let systemAssignedManagedIdentityApplication: ManagedIdentityApplication;
        beforeEach(() => {
            systemAssignedManagedIdentityApplication =
                new ManagedIdentityApplication(systemAssignedConfig);
            expect(
                systemAssignedManagedIdentityApplication.getManagedIdentitySource()
            ).toBe(ManagedIdentitySourceNames.DEFAULT_TO_IMDS);
        });

        test("acquires a token from the network and then the same token from the cache, then acquires a different token for another scope", async () => {
            let networkManagedIdentityResult: AuthenticationResult =
                await systemAssignedManagedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                });
            expect(networkManagedIdentityResult.fromCache).toBe(false);

            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );

            const cachedManagedIdentityResult: AuthenticationResult =
                await systemAssignedManagedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                });
            expect(cachedManagedIdentityResult.fromCache).toBe(true);
            expect(cachedManagedIdentityResult.accessToken).toEqual(
                DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );

            networkManagedIdentityResult =
                await systemAssignedManagedIdentityApplication.acquireToken({
                    // different resource id means the token will be different
                    resource: `${MANAGED_IDENTITY_RESOURCE}${Math.random().toString()}`,
                });
            expect(networkManagedIdentityResult.fromCache).toBe(false);

            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );
        });

        test("ignores a cached token when claims are provided", async () => {
            let networkManagedIdentityResult: AuthenticationResult =
                await systemAssignedManagedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                });
            expect(networkManagedIdentityResult.fromCache).toBe(false);

            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );

            const cachedManagedIdentityResult: AuthenticationResult =
                await systemAssignedManagedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                });
            expect(cachedManagedIdentityResult.fromCache).toBe(true);
            expect(cachedManagedIdentityResult.accessToken).toEqual(
                DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );

            networkManagedIdentityResult =
                await systemAssignedManagedIdentityApplication.acquireToken({
                    claims: TEST_CONFIG.CLAIMS,
                    resource: MANAGED_IDENTITY_RESOURCE,
                });
            expect(networkManagedIdentityResult.fromCache).toBe(false);
            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );
        });

        test("ignores a cached token when forceRefresh is set to true", async () => {
            let networkManagedIdentityResult: AuthenticationResult =
                await systemAssignedManagedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                });
            expect(networkManagedIdentityResult.fromCache).toBe(false);

            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );

            const cachedManagedIdentityResult: AuthenticationResult =
                await systemAssignedManagedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                });
            expect(cachedManagedIdentityResult.fromCache).toBe(true);
            expect(cachedManagedIdentityResult.accessToken).toEqual(
                DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );

            networkManagedIdentityResult =
                await systemAssignedManagedIdentityApplication.acquireToken({
                    forceRefresh: true,
                    resource: MANAGED_IDENTITY_RESOURCE,
                });
            expect(networkManagedIdentityResult.fromCache).toBe(false);

            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );
        });

        test("proactively refreshes a token in the background when its refresh_in value is expired.", async () => {
            let networkManagedIdentityResult: AuthenticationResult =
                await systemAssignedManagedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                });
            expect(networkManagedIdentityResult.fromCache).toBe(false);

            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );

            const nowSeconds: number = TimeUtils.nowSeconds();
            const expiredRefreshOn: number = nowSeconds - 3600;
            const fakeAccessTokenEntity: AccessTokenEntity =
                CacheHelpers.createAccessTokenEntity(
                    "", // homeAccountId
                    "https://login.microsoftonline.com/common/", // environment
                    "thisIs.an.accessT0ken", // accessToken
                    DEFAULT_MANAGED_IDENTITY_ID, // clientId
                    "managed_identity", // tenantId
                    [MANAGED_IDENTITY_RESOURCE_BASE].toString(), // scopes
                    nowSeconds + 3600, // expiresOn
                    nowSeconds + 3600, // extExpiresOn
                    mockCrypto.base64Decode, // cryptoUtils
                    expiredRefreshOn // refreshOn
                );
            jest.spyOn(
                ClientCredentialClient.prototype,
                <any>"readAccessTokenFromCache"
            ).mockReturnValueOnce(fakeAccessTokenEntity);

            let cachedManagedIdentityResult: AuthenticationResult =
                await systemAssignedManagedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                });

            expect(cachedManagedIdentityResult.fromCache).toBe(true);
            expect(cachedManagedIdentityResult.refreshOn).toEqual(
                new Date(expiredRefreshOn * 1000)
            );
            expect(
                TimeUtils.isTokenExpired(
                    (
                        cachedManagedIdentityResult.refreshOn !== undefined &&
                        cachedManagedIdentityResult.refreshOn.getTime() / 1000
                    ).toString(),
                    DEFAULT_TOKEN_RENEWAL_OFFSET_SEC
                )
            ).toBe(true);

            // wait two seconds
            await setTimeout(2000);

            // get the token from the cache again, but it should be refeshed after waiting two seconds
            cachedManagedIdentityResult =
                await systemAssignedManagedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                });

            expect(cachedManagedIdentityResult.fromCache).toBe(true);
            expect(cachedManagedIdentityResult.refreshOn).not.toEqual(
                new Date(expiredRefreshOn * 1000)
            );
            expect(
                TimeUtils.isTokenExpired(
                    (
                        cachedManagedIdentityResult.refreshOn !== undefined &&
                        cachedManagedIdentityResult.refreshOn.getTime() / 1000
                    ).toString(),
                    DEFAULT_TOKEN_RENEWAL_OFFSET_SEC
                )
            ).toBe(false);

            jest.restoreAllMocks();
        }, 10000); // double the timeout value for this test because it waits two seconds in between the acquireToken call and the cache lookup

        test("requests three tokens with two different resources while switching between user and system assigned, then requests them again to verify they are retrieved from the cache, then verifies that their cache keys are correct", async () => {
            // the imported systemAssignedManagedIdentityApplication is the default System Assigned Managed Identity Application.
            // for reference, in this case it is equivalent to systemAssignedManagedIdentityApplicationResource1

            const userAssignedClientIdManagedIdentityApplicationResource1: ManagedIdentityApplication =
                new ManagedIdentityApplication({
                    system: {
                        networkClient,
                    },
                    managedIdentityIdParams: {
                        userAssignedClientId: MANAGED_IDENTITY_RESOURCE_ID,
                    },
                });
            expect(
                userAssignedClientIdManagedIdentityApplicationResource1.getManagedIdentitySource()
            ).toBe(ManagedIdentitySourceNames.DEFAULT_TO_IMDS);

            const userAssignedObjectIdManagedIdentityApplicationResource2: ManagedIdentityApplication =
                new ManagedIdentityApplication({
                    system: {
                        networkClient: new ManagedIdentityNetworkClient(
                            MANAGED_IDENTITY_RESOURCE_ID_2
                        ),
                    },
                    managedIdentityIdParams: {
                        userAssignedObjectId: MANAGED_IDENTITY_RESOURCE_ID_2,
                    },
                });
            expect(
                userAssignedObjectIdManagedIdentityApplicationResource2.getManagedIdentitySource()
            ).toBe(ManagedIdentitySourceNames.DEFAULT_TO_IMDS);

            // ********** begin: return access tokens from a network request **********
            // resource R1 for system assigned - returned from a network request
            let networkManagedIdentityResult: AuthenticationResult =
                await systemAssignedManagedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );
            expect(networkManagedIdentityResult.fromCache).toBe(false);

            // not needed in production, but this resets the network client for the next application
            // since the network client is mocked for each application
            delete ManagedIdentityClient["identitySource"];

            // resource R2 for system assigned - returned from a network request
            networkManagedIdentityResult =
                await userAssignedClientIdManagedIdentityApplicationResource1.acquireToken(
                    managedIdentityRequestParams
                );
            expect(networkManagedIdentityResult.fromCache).toBe(false);

            // not needed in production, but this resets the network client for the next application
            // since the network client is mocked for each application
            delete ManagedIdentityClient["identitySource"];

            // resource R2 for user assigned - returned from a network request
            networkManagedIdentityResult =
                await userAssignedObjectIdManagedIdentityApplicationResource2.acquireToken(
                    managedIdentityRequestParams
                );
            expect(networkManagedIdentityResult.fromCache).toBe(false);
            // ********** end: return access tokens from a network request **********

            // ********** begin: return access tokens from the cache **********
            // resource R1 for system assigned - new application (to prove static cache persists), but same request as before, returned from the cache this time
            const systemAssignedManagedIdentityApplicationClone: ManagedIdentityApplication =
                new ManagedIdentityApplication(systemAssignedConfig);
            expect(
                systemAssignedManagedIdentityApplicationClone.getManagedIdentitySource()
            ).toBe(ManagedIdentitySourceNames.DEFAULT_TO_IMDS);
            let cachedManagedIdentityResult: AuthenticationResult =
                await systemAssignedManagedIdentityApplicationClone.acquireToken(
                    {
                        resource: MANAGED_IDENTITY_RESOURCE,
                    }
                );
            expect(cachedManagedIdentityResult.fromCache).toBe(true);

            // resource R2 for system assigned - new application (to prove static cache persists), but same request as before, returned from the cache this time
            const userAssignedClientIdManagedIdentityApplicationResource1Clone: ManagedIdentityApplication =
                new ManagedIdentityApplication({
                    system: {
                        networkClient,
                    },
                    managedIdentityIdParams: {
                        userAssignedClientId: MANAGED_IDENTITY_RESOURCE_ID,
                    },
                });
            expect(
                userAssignedClientIdManagedIdentityApplicationResource1Clone.getManagedIdentitySource()
            ).toBe(ManagedIdentitySourceNames.DEFAULT_TO_IMDS);
            cachedManagedIdentityResult =
                await userAssignedClientIdManagedIdentityApplicationResource1Clone.acquireToken(
                    {
                        resource: MANAGED_IDENTITY_RESOURCE,
                    }
                );
            expect(cachedManagedIdentityResult.fromCache).toBe(true);

            // resource R2 for user assigned - new application (to prove static cache persists), but same request as before, returned from the cache this time
            const userAssignedObjectIdManagedIdentityApplicationResource2Clone: ManagedIdentityApplication =
                new ManagedIdentityApplication({
                    system: {
                        networkClient: new ManagedIdentityNetworkClient(
                            MANAGED_IDENTITY_RESOURCE_ID_2 // client id
                        ),
                    },
                    managedIdentityIdParams: {
                        userAssignedObjectId: MANAGED_IDENTITY_RESOURCE_ID_2,
                    },
                });
            expect(
                userAssignedObjectIdManagedIdentityApplicationResource2Clone.getManagedIdentitySource()
            ).toBe(ManagedIdentitySourceNames.DEFAULT_TO_IMDS);
            cachedManagedIdentityResult =
                await userAssignedObjectIdManagedIdentityApplicationResource2Clone.acquireToken(
                    {
                        resource: MANAGED_IDENTITY_RESOURCE,
                    }
                );
            expect(cachedManagedIdentityResult.fromCache).toBe(true);
            // ********** end: return access tokens from the cache **********

            const cache: CacheKVStore = (
                ManagedIdentityApplication["nodeStorage"] as NodeStorage
            )["cache"];

            // the cache is static, and should have persisted across all six of the managed identity applications in this test
            // there should be three items in the cache
            expect(Object.keys(cache).length).toEqual(3);

            const cacheKeys: Array<string> = [
                getCacheKey(),
                getCacheKey(MANAGED_IDENTITY_RESOURCE_ID),
                getCacheKey(MANAGED_IDENTITY_RESOURCE_ID_2),
            ];

            // verify the cache keys
            const allCacheKeysExistandAreCorrect: boolean = cacheKeys.every(
                (key) => {
                    return Object.keys(cache).includes(key);
                }
            );
            expect(allCacheKeysExistandAreCorrect).toBe(true);
        });
    });

    describe("Errors", () => {
        let systemAssignedManagedIdentityApplication: ManagedIdentityApplication;
        beforeEach(() => {
            systemAssignedManagedIdentityApplication =
                new ManagedIdentityApplication(systemAssignedConfig);
            expect(
                systemAssignedManagedIdentityApplication.getManagedIdentitySource()
            ).toBe(ManagedIdentitySourceNames.DEFAULT_TO_IMDS);
        });

        test("throws an error when an invalid resource is provided", async () => {
            await expect(
                systemAssignedManagedIdentityApplication.acquireToken({
                    resource: "",
                })
            ).rejects.toMatchObject(
                createClientConfigurationError(
                    ClientConfigurationErrorCodes.urlEmptyError
                )
            );
        });

        test("throws an error when more than one managed identity type is provided", () => {
            const badUserAssignedClientIdConfig: ManagedIdentityConfiguration =
                {
                    system: {
                        networkClient,
                    },
                    managedIdentityIdParams: {
                        userAssignedClientId: MANAGED_IDENTITY_RESOURCE_ID,
                        userAssignedResourceId: MANAGED_IDENTITY_RESOURCE_ID_2,
                    },
                };

            expect(() => {
                new ManagedIdentityApplication(badUserAssignedClientIdConfig);
            }).toThrow(
                createManagedIdentityError(
                    ManagedIdentityErrorCodes.invalidManagedIdentityIdType
                )
            );
        });

        test("ensures that the error format is correct", async () => {
            jest.spyOn(networkClient, <any>"sendGetRequestAsync")
                // permanently override the networkClient's sendGetRequestAsync method to return a 400
                .mockReturnValue(
                    managedIdentityNetworkErrorClient400.sendGetRequestAsync()
                );

            let serverError: ServerError = new ServerError();
            try {
                await systemAssignedManagedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );
            } catch (e) {
                serverError = e as ServerError;
            }

            expect(
                serverError.errorMessage.includes(
                    MANAGED_IDENTITY_IMDS_NETWORK_REQUEST_400_ERROR.error as string
                )
            ).toBe(true);
            expect(
                serverError.errorMessage.includes(
                    MANAGED_IDENTITY_IMDS_NETWORK_REQUEST_400_ERROR.error_description as string
                )
            ).toBe(true);
            MANAGED_IDENTITY_IMDS_NETWORK_REQUEST_400_ERROR.error_codes?.forEach(
                (errorCode) => {
                    expect(serverError.errorMessage.includes(errorCode)).toBe(
                        true
                    );
                }
            );
            expect(
                serverError.errorMessage.includes(
                    MANAGED_IDENTITY_IMDS_NETWORK_REQUEST_400_ERROR.timestamp as string
                )
            ).toBe(true);
            expect(
                serverError.errorMessage.includes(
                    MANAGED_IDENTITY_IMDS_NETWORK_REQUEST_400_ERROR.trace_id as string
                )
            ).toBe(true);
            expect(
                serverError.errorMessage.includes(
                    MANAGED_IDENTITY_IMDS_NETWORK_REQUEST_400_ERROR.correlation_id as string
                )
            ).toBe(true);

            jest.restoreAllMocks();
        });
    });
});

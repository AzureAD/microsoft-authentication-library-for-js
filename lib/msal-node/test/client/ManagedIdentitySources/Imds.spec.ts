/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ManagedIdentityApplication } from "../../../src/client/ManagedIdentityApplication";
import { ManagedIdentityConfiguration } from "../../../src/config/Configuration";
import {
    DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT,
    DEFAULT_USER_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT,
    MANAGED_IDENTITY_RESOURCE,
    MANAGED_IDENTITY_RESOURCE_BASE,
    MANAGED_IDENTITY_RESOURCE_ID,
    MANAGED_IDENTITY_RESOURCE_ID_2,
    MANAGED_IDENTITY_TOKEN_RETRIEVAL_ERROR,
    THREE_SECONDS_IN_MILLI,
    getCacheKey,
} from "../../test_kit/StringConstants";

import {
    ManagedIdentityTestUtils,
    ManagedIdentityNetworkClient,
    ManagedIdentityNetworkErrorClient,
    networkClient,
    userAssignedClientIdConfig,
    managedIdentityRequestParams,
    systemAssignedConfig,
} from "../../test_kit/ManagedIdentityTestUtils";
import { DEFAULT_MANAGED_IDENTITY_ID } from "../../../src/utils/Constants";
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
import { ManagedIdentityClient } from "../../../src/client/ManagedIdentityClient";
import {
    ManagedIdentityErrorCodes,
    createManagedIdentityError,
} from "../../../src/error/ManagedIdentityError";
import { mockCrypto } from "../ClientTestUtils";
import sinon from "sinon";
import {
    CacheKVStore,
    ClientCredentialClient,
    NodeStorage,
} from "../../../src";
import { mockAuthenticationResult } from "../../utils/TestConstants";

describe("Acquires a token successfully via an IMDS Managed Identity", () => {
    // IMDS doesn't need environment variables because there is a default IMDS endpoint

    afterEach(() => {
        ManagedIdentityClient.identitySource = undefined;
        ManagedIdentityApplication["nodeStorage"] = undefined;
    });

    const managedIdentityNetworkErrorClient =
        new ManagedIdentityNetworkErrorClient();

    const userAssignedObjectIdConfig: ManagedIdentityConfiguration = {
        system: {
            networkClient,
        },
        managedIdentityIdParams: {
            userAssignedObjectId: MANAGED_IDENTITY_RESOURCE_ID,
        },
    };
    const userAssignedResourceIdConfig: ManagedIdentityConfiguration = {
        system: {
            networkClient,
        },
        managedIdentityIdParams: {
            userAssignedResourceId: MANAGED_IDENTITY_RESOURCE_ID,
        },
    };

    describe("User Assigned", () => {
        test("acquires a User Assigned Client Id token", async () => {
            expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

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

        test("acquires a User Assigned Object Id token", async () => {
            expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(userAssignedObjectIdConfig);

            const networkManagedIdentityResult: AuthenticationResult =
                await managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );

            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_USER_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );
        });

        test("acquires a User Assigned Resource Id token", async () => {
            expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(userAssignedResourceIdConfig);

            const networkManagedIdentityResult: AuthenticationResult =
                await managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );

            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_USER_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );
        });
    });

    describe("System Assigned", () => {
        let managedIdentityApplication: ManagedIdentityApplication;
        beforeEach(() => {
            managedIdentityApplication = new ManagedIdentityApplication(
                systemAssignedConfig
            );
        });

        test("acquires a token", async () => {
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

        test("returns an already acquired token from the cache", async () => {
            expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

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

    describe("Linear Retry Policy", () => {
        describe("User Assigned", () => {
            let managedIdentityApplication: ManagedIdentityApplication;
            beforeEach(() => {
                managedIdentityApplication = new ManagedIdentityApplication(
                    userAssignedClientIdConfig
                );
            });

            test("returns a 500 error response from the network request, just the first time", async () => {
                expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

                const sendGetRequestAsyncSpy: jest.SpyInstance = jest
                    .spyOn(networkClient, <any>"sendGetRequestAsync")
                    // override the networkClient's sendGetRequestAsync method to return a 500.
                    // after this override, original functionality will be restored
                    // and the network request will complete successfully
                    .mockReturnValueOnce(
                        managedIdentityNetworkErrorClient.sendGetRequestForRetryAsync()
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
                expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

                const sendGetRequestAsyncSpy: jest.SpyInstance = jest
                    .spyOn(networkClient, <any>"sendGetRequestAsync")
                    // permanently override the networkClient's sendGetRequestAsync method to return a 500
                    .mockReturnValue(
                        managedIdentityNetworkErrorClient.sendGetRequestForRetryAsync()
                    );

                let serverError: ServerError = new ServerError();
                try {
                    await managedIdentityApplication.acquireToken(
                        managedIdentityRequestParams
                    );
                } catch (e) {
                    serverError = e as ServerError;
                }

                expect(serverError.errorCode).toEqual(
                    MANAGED_IDENTITY_TOKEN_RETRIEVAL_ERROR
                );
                expect(sendGetRequestAsyncSpy).toHaveBeenCalledTimes(2);

                jest.restoreAllMocks();
            });
        });

        describe("System Assigned", () => {
            let managedIdentityApplication: ManagedIdentityApplication;
            beforeEach(() => {
                managedIdentityApplication = new ManagedIdentityApplication(
                    systemAssignedConfig
                );
            });

            test("returns a 500 error response from the network request, just the first time, with no retry-after header", async () => {
                expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

                const sendGetRequestAsyncSpy: jest.SpyInstance = jest
                    .spyOn(networkClient, <any>"sendGetRequestAsync")
                    // override the networkClient's sendGetRequestAsync method to return a 500.
                    // after this override, original functionality will be restored
                    // and the network request will complete successfully
                    .mockReturnValueOnce(
                        managedIdentityNetworkErrorClient.sendGetRequestForRetryAsync()
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
                expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

                const headers: Record<string, string> = {
                    "Retry-After": "3", // 3 seconds
                };
                const sendGetRequestAsyncSpy: jest.SpyInstance = jest
                    .spyOn(networkClient, <any>"sendGetRequestAsync")
                    // override the networkClient's sendGetRequestAsync method to return a 500.
                    // after this override, original functionality will be restored
                    // and the network request will complete successfully
                    .mockReturnValueOnce(
                        managedIdentityNetworkErrorClient.sendGetRequestForRetryAsync(
                            headers
                        )
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
                expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

                var retryAfterHttpDate = new Date();
                retryAfterHttpDate.setSeconds(
                    retryAfterHttpDate.getSeconds() + 4 // 4 seconds. An extra second has been added to account for this date operation
                );
                const headers: Record<string, string> = {
                    "Retry-After": retryAfterHttpDate.toString(),
                };
                const sendGetRequestAsyncSpy: jest.SpyInstance = jest
                    .spyOn(networkClient, <any>"sendGetRequestAsync")
                    // override the networkClient's sendGetRequestAsync method to return a 500.
                    // after this override, original functionality will be restored
                    // and the network request will complete successfully
                    .mockReturnValueOnce(
                        managedIdentityNetworkErrorClient.sendGetRequestForRetryAsync(
                            headers
                        )
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
                expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

                const sendGetRequestAsyncSpy: jest.SpyInstance = jest
                    .spyOn(networkClient, <any>"sendGetRequestAsync")
                    // permanently override the networkClient's sendGetRequestAsync method to return a 500
                    .mockReturnValue(
                        managedIdentityNetworkErrorClient.sendGetRequestForRetryAsync()
                    );

                let serverError: ServerError = new ServerError();
                try {
                    await managedIdentityApplication.acquireToken(
                        managedIdentityRequestParams
                    );
                } catch (e) {
                    serverError = e as ServerError;
                }

                expect(serverError.errorCode).toEqual(
                    MANAGED_IDENTITY_TOKEN_RETRIEVAL_ERROR
                );
                expect(sendGetRequestAsyncSpy).toHaveBeenCalledTimes(2);

                jest.restoreAllMocks();
            });

            test("makes three acquireToken calls on the same managed identity application (which returns a 500 error response from the network request permanently) to ensure that retry policy lifetime is per request", async () => {
                expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

                const sendGetRequestAsyncSpyApp: jest.SpyInstance = jest
                    .spyOn(networkClient, <any>"sendGetRequestAsync")
                    // permanently override the networkClient's sendGetRequestAsync method to return a 500
                    .mockReturnValue(
                        managedIdentityNetworkErrorClient.sendGetRequestForRetryAsync()
                    );

                try {
                    await managedIdentityApplication.acquireToken({
                        resource: "https://graph.microsoft1.com",
                    });
                } catch (e) {
                    expect(sendGetRequestAsyncSpyApp).toHaveBeenCalledTimes(2);
                }

                try {
                    await managedIdentityApplication.acquireToken({
                        resource: "https://graph.microsoft2.com",
                    });
                } catch (e) {
                    expect(sendGetRequestAsyncSpyApp).toHaveBeenCalledTimes(4); // 4 total, 2 since last acquireToken call
                }

                try {
                    await managedIdentityApplication.acquireToken({
                        resource: "https://graph.microsoft3.com",
                    });
                } catch (e) {
                    expect(sendGetRequestAsyncSpyApp).toHaveBeenCalledTimes(6); // 6 total, 2 since last acquireToken call
                }

                jest.restoreAllMocks();
            });

            test("ensures that a retry does not happen when the http status code from a failed network response is not included in the retry policy", async () => {
                expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

                const sendGetRequestAsyncSpyApp: jest.SpyInstance = jest
                    .spyOn(networkClient, <any>"sendGetRequestAsync")
                    // permanently override the networkClient's sendGetRequestAsync method to return a 400
                    .mockReturnValue(
                        managedIdentityNetworkErrorClient.sendGetRequestForRetryAsync(
                            undefined,
                            HttpStatus.BAD_REQUEST
                        )
                    );

                try {
                    await managedIdentityApplication.acquireToken(
                        managedIdentityRequestParams
                    );
                } catch (e) {
                    expect(sendGetRequestAsyncSpyApp).toHaveBeenCalledTimes(1);
                }

                jest.restoreAllMocks();
            });
        });
    });

    describe("Miscellaneous", () => {
        let systemAssignedManagedIdentityApplication: ManagedIdentityApplication;
        beforeEach(() => {
            systemAssignedManagedIdentityApplication =
                new ManagedIdentityApplication(systemAssignedConfig);
        });

        test("acquires a token from the network and then the same token from the cache, then acquires a different token for another scope", async () => {
            expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

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

        test("ignores a cached token when forceRefresh is set to true", async () => {
            expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

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
            expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

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
            sinon
                .stub(
                    ClientCredentialClient.prototype,
                    <any>"readAccessTokenFromCache"
                )
                .returns(fakeAccessTokenEntity);

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

            sinon.restore();

            const waitTwoSecondsForProactiveRefresh =
                async (): Promise<void> => {
                    let counter: number = 0;
                    return await new Promise((resolve) => {
                        const interval = setInterval(() => {
                            counter++;
                            if (counter === 2000) {
                                resolve();
                                clearInterval(interval);
                            }
                        });
                    });
                };
            await waitTwoSecondsForProactiveRefresh();

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
        });

        test("requests three tokens with two different resources while switching between user and system assigned, then requests them again to verify they are retrieved from the cache, then verifies that their cache keys are correct", async () => {
            expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

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

            // ********** begin: return access tokens from a network request **********
            // resource R1 for system assigned - returned from a network request
            let networkManagedIdentityResult: AuthenticationResult =
                await systemAssignedManagedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );
            expect(networkManagedIdentityResult.fromCache).toBe(false);

            // not needed in production, but this resets the network client for the next application
            // since the network client is mocked for each application
            ManagedIdentityClient.identitySource = undefined;

            // resource R2 for system assigned - returned from a network request
            networkManagedIdentityResult =
                await userAssignedClientIdManagedIdentityApplicationResource1.acquireToken(
                    managedIdentityRequestParams
                );
            expect(networkManagedIdentityResult.fromCache).toBe(false);

            // not needed in production, but this resets the network client for the next application
            // since the network client is mocked for each application
            ManagedIdentityClient.identitySource = undefined;

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
        test("throws an error when an invalid resource is provided", async () => {
            expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

            const systemAssignedManagedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(systemAssignedConfig);

            await expect(
                systemAssignedManagedIdentityApplication.acquireToken({
                    resource: "invalid_resource",
                })
            ).rejects.toMatchObject(
                createManagedIdentityError(
                    ManagedIdentityErrorCodes.invalidResource
                )
            );

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
            expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

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
            }).toThrowError(
                createManagedIdentityError(
                    ManagedIdentityErrorCodes.invalidManagedIdentityIdType
                )
            );
        });

        test("managed identity token response contains an error message and correlation id when an error is returned from the managed identity", async () => {
            expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication({
                    system: {
                        networkClient: managedIdentityNetworkErrorClient,
                        // managedIdentityIdParams will be omitted for system assigned
                    },
                });

            let serverError: ServerError = new ServerError();
            try {
                await managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );
            } catch (e) {
                serverError = e as ServerError;
            }

            expect(serverError.errorCode).toEqual(
                MANAGED_IDENTITY_TOKEN_RETRIEVAL_ERROR
            );

            const correlationIdCheck: boolean =
                serverError.errorMessage.includes(
                    mockAuthenticationResult.correlationId
                );
            expect(correlationIdCheck).toBe(true);
        });
    });
});

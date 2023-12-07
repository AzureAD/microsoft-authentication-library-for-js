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
    MANAGED_IDENTITY_RESOURCE_ID,
    MANAGED_IDENTITY_RESOURCE_ID_2,
    MANAGED_IDENTITY_TOKEN_RETRIEVAL_ERROR,
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
    ClientConfigurationErrorCodes,
    createClientConfigurationError,
    DEFAULT_TOKEN_RENEWAL_OFFSET_SEC,
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

describe("Acquires a token successfully via an IMDS Managed Identity", () => {
    let OLD_ENVS: NodeJS.ProcessEnv;

    beforeAll(() => {
        // make a copy of old environment
        OLD_ENVS = process.env;

        // IMDS doesn't need environment variables because there is a default IMDS endpoint
        // Delete the following environment variables if they exist;
        // For example: someone could be running these unit tests on an Azure Arc VM, where
        // the IDENTITY_ENDPOINT and IMDS_ENDPOINT environment variables exist
        delete process.env["IDENTITY_ENDPOINT"];
        delete process.env["IDENTITY_HEADER"];
        delete process.env["IMDS_ENDPOINT"];
    });

    afterAll(() => {
        // restore old environment
        process.env = OLD_ENVS;
    });

    afterEach(() => {
        ManagedIdentityClient.identitySource = undefined;
        ManagedIdentityApplication.nodeStorage = undefined;
    });

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
                AccessTokenEntity.createAccessTokenEntity(
                    "", // homeAccountId
                    "https://login.microsoftonline.com/common/", // environment
                    "thisIs.an.accessT0ken", // accessToken
                    "system_assigned_managed_identity", // clientId
                    "managed_identity", // tenantId
                    ["https://graph.microsoft.com"].toString(), // scopes
                    nowSeconds + 3600, // expiresOn
                    nowSeconds + 3600, // extExpiresOn
                    mockCrypto, // cryptoUtils
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
                        networkClient: new ManagedIdentityNetworkErrorClient(),
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
                serverError.errorMessage.includes(DEFAULT_MANAGED_IDENTITY_ID);
            expect(correlationIdCheck).toBe(true);
        });
    });
});

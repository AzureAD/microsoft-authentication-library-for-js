/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ManagedIdentityApplication } from "../../src/client/ManagedIdentityApplication";
import { ManagedIdentityConfiguration } from "../../src/config/Configuration";
import { ManagedIdentityRequestParams } from "../../src/request/ManagedIdentityRequestParams";
import {
    DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT,
    DEFAULT_USER_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT,
    MANAGED_IDENTITY_RESOURCE,
    MANAGED_IDENTITY_RESOURCE_ID,
    MANAGED_IDENTITY_RESOURCE_ID_2,
    MANAGED_IDENTITY_RESOURCE_ID_3,
    MANAGED_IDENTITY_SYSTEM_ASSIGNED_CACHE_KEY,
    MANAGED_IDENTITY_TOKEN_RETRIEVAL_ERROR,
    MANAGED_IDENTITY_USER_ASSIGNED_CLIENT_ID_CACHE_KEY,
    MANAGED_IDENTITY_USER_ASSIGNED_OBJECT_ID_CACHE_KEY,
} from "../test_kit/StringConstants";

import { ManagedIdentityTestUtils } from "../test_kit/ManagedIdentityTestUtils";
import { DEFAULT_MANAGED_IDENTITY_ID } from "../../src/utils/Constants";
import {
    AccessTokenEntity,
    AuthenticationResult,
    ClientConfigurationErrorCodes,
    createClientConfigurationError,
    DEFAULT_TOKEN_RENEWAL_OFFSET_SEC,
    INetworkModule,
    ServerError,
    TimeUtils,
} from "@azure/msal-common";
import { ManagedIdentityClient } from "../../src/client/ManagedIdentityClient";
import {
    ManagedIdentityErrorCodes,
    createManagedIdentityError,
} from "../../src/error/ManagedIdentityError";
import { mockCrypto } from "./ClientTestUtils";
import sinon from "sinon";
import { ClientCredentialClient } from "../../src";

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
    afterEach(() => {
        ManagedIdentityClient.identitySource = undefined;
    });

    const managedIdentityRequestParams: ManagedIdentityRequestParams = {
        resource: MANAGED_IDENTITY_RESOURCE,
    };

    const userAssignedNetworkClient: INetworkModule =
        ManagedIdentityTestUtils.getManagedIdentityNetworkClient(
            MANAGED_IDENTITY_RESOURCE_ID
        );
    const userAssignedClientIdConfig: ManagedIdentityConfiguration = {
        system: {
            networkClient: userAssignedNetworkClient,
        },
        managedIdentityIdParams: {
            userAssignedClientId: MANAGED_IDENTITY_RESOURCE_ID,
        },
    };
    const userAssignedObjectIdConfig: ManagedIdentityConfiguration = {
        system: {
            networkClient: userAssignedNetworkClient,
        },
        managedIdentityIdParams: {
            userAssignedObjectId: MANAGED_IDENTITY_RESOURCE_ID,
        },
    };
    const userAssignedResourceIdConfig: ManagedIdentityConfiguration = {
        system: {
            networkClient: userAssignedNetworkClient,
        },
        managedIdentityIdParams: {
            userAssignedResourceId: MANAGED_IDENTITY_RESOURCE_ID,
        },
    };

    const systemAssignedConfig: ManagedIdentityConfiguration = {
        system: {
            networkClient:
                ManagedIdentityTestUtils.getManagedIdentityNetworkClient(
                    DEFAULT_MANAGED_IDENTITY_ID
                ) as INetworkModule,
            // managedIdentityIdParams will be omitted for system assigned
        },
    };

    const systemAssignedErrorConfig: ManagedIdentityConfiguration = {
        system: {
            networkClient:
                ManagedIdentityTestUtils.getManagedIdentityNetworkErrorClient() as INetworkModule,
            // managedIdentityIdParams will be omitted for system assigned
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

    describe("Acquires a token successfully via an IMDS Managed Identity", () => {
        // IMDS doesn't need an environment variable because there is a default IMDS endpoint

        describe("User Assigned", () => {
            test("acquires a User Assigned Client Id token", async () => {
                expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

                const managedIdentityApplication =
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

                const managedIdentityApplication =
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

                const managedIdentityApplication =
                    new ManagedIdentityApplication(
                        userAssignedResourceIdConfig
                    );

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
                    await systemAssignedManagedIdentityApplication.acquireToken(
                        {
                            resource: MANAGED_IDENTITY_RESOURCE,
                        }
                    );
                expect(networkManagedIdentityResult.fromCache).toBe(false);

                expect(networkManagedIdentityResult.accessToken).toEqual(
                    DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
                );

                const cachedManagedIdentityResult: AuthenticationResult =
                    await systemAssignedManagedIdentityApplication.acquireToken(
                        {
                            resource: MANAGED_IDENTITY_RESOURCE,
                        }
                    );
                expect(cachedManagedIdentityResult.fromCache).toBe(true);
                expect(cachedManagedIdentityResult.accessToken).toEqual(
                    DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
                );

                networkManagedIdentityResult =
                    await systemAssignedManagedIdentityApplication.acquireToken(
                        {
                            // different resource id means the token will be different
                            resource: `${MANAGED_IDENTITY_RESOURCE}${Math.random().toString()}`,
                        }
                    );
                expect(networkManagedIdentityResult.fromCache).toBe(false);

                expect(networkManagedIdentityResult.accessToken).toEqual(
                    DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
                );
            });

            test("ignores a cached token when forceRefresh is set to true", async () => {
                expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

                let networkManagedIdentityResult: AuthenticationResult =
                    await systemAssignedManagedIdentityApplication.acquireToken(
                        {
                            resource: MANAGED_IDENTITY_RESOURCE,
                        }
                    );
                expect(networkManagedIdentityResult.fromCache).toBe(false);

                expect(networkManagedIdentityResult.accessToken).toEqual(
                    DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
                );

                const cachedManagedIdentityResult: AuthenticationResult =
                    await systemAssignedManagedIdentityApplication.acquireToken(
                        {
                            resource: MANAGED_IDENTITY_RESOURCE,
                        }
                    );
                expect(cachedManagedIdentityResult.fromCache).toBe(true);
                expect(cachedManagedIdentityResult.accessToken).toEqual(
                    DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
                );

                networkManagedIdentityResult =
                    await systemAssignedManagedIdentityApplication.acquireToken(
                        {
                            forceRefresh: true,
                            resource: MANAGED_IDENTITY_RESOURCE,
                        }
                    );
                expect(networkManagedIdentityResult.fromCache).toBe(false);

                expect(networkManagedIdentityResult.accessToken).toEqual(
                    DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
                );
            });

            test("proactively refreshes a token in the background when its refresh_in value is expired.", async () => {
                expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

                let networkManagedIdentityResult: AuthenticationResult =
                    await systemAssignedManagedIdentityApplication.acquireToken(
                        {
                            resource: MANAGED_IDENTITY_RESOURCE,
                        }
                    );
                expect(networkManagedIdentityResult.fromCache).toBe(false);

                expect(networkManagedIdentityResult.accessToken).toEqual(
                    DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
                );

                const nowSeconds = TimeUtils.nowSeconds();
                const expiredRefreshOn = nowSeconds - 3600;
                const fakeAccessTokenEntity =
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
                    await systemAssignedManagedIdentityApplication.acquireToken(
                        {
                            resource: MANAGED_IDENTITY_RESOURCE,
                        }
                    );

                expect(cachedManagedIdentityResult.fromCache).toBe(true);
                expect(cachedManagedIdentityResult.refreshOn).toEqual(
                    new Date(expiredRefreshOn * 1000)
                );
                expect(
                    TimeUtils.isTokenExpired(
                        (
                            cachedManagedIdentityResult.refreshOn !==
                                undefined &&
                            cachedManagedIdentityResult.refreshOn.getTime() /
                                1000
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
                    await systemAssignedManagedIdentityApplication.acquireToken(
                        {
                            resource: MANAGED_IDENTITY_RESOURCE,
                        }
                    );

                expect(cachedManagedIdentityResult.fromCache).toBe(true);
                expect(cachedManagedIdentityResult.refreshOn).not.toEqual(
                    new Date(expiredRefreshOn * 1000)
                );
                expect(
                    TimeUtils.isTokenExpired(
                        (
                            cachedManagedIdentityResult.refreshOn !==
                                undefined &&
                            cachedManagedIdentityResult.refreshOn.getTime() /
                                1000
                        ).toString(),
                        DEFAULT_TOKEN_RENEWAL_OFFSET_SEC
                    )
                ).toBe(false);
            });

            test("requests three tokens with two different resources while switching between user and system assigned, then requests them again to verify they are retrieved from the cache.", async () => {
                expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

                // systemAssignedManagedIdentityApplicationR1 is the default System Assigned Managed Identity Application

                const systemAssignedManagedIdentityApplicationR2: ManagedIdentityApplication =
                    new ManagedIdentityApplication({
                        system: {
                            networkClient:
                                ManagedIdentityTestUtils.getManagedIdentityNetworkClient(
                                    MANAGED_IDENTITY_RESOURCE_ID_2,
                                    MANAGED_IDENTITY_RESOURCE
                                ),
                        },
                    });

                const userAssignedClientIdManagedIdentityApplicationR2: ManagedIdentityApplication =
                    new ManagedIdentityApplication({
                        system: {
                            networkClient:
                                ManagedIdentityTestUtils.getManagedIdentityNetworkClient(
                                    MANAGED_IDENTITY_RESOURCE_ID_2,
                                    MANAGED_IDENTITY_RESOURCE
                                ),
                        },
                        managedIdentityIdParams: {
                            userAssignedClientId:
                                MANAGED_IDENTITY_RESOURCE_ID_2,
                        },
                    });

                // ********** begin: return access tokens from a network request **********
                // resource R1 for system assigned - returned from a network request
                let networkManagedIdentityResult: AuthenticationResult =
                    await systemAssignedManagedIdentityApplication.acquireToken(
                        managedIdentityRequestParams
                    );
                expect(networkManagedIdentityResult.fromCache).toBe(false);

                // ManagedIdentityClient.identitySource (IMDS in this case) is static/
                // Therefore, this is needed to tell the ManagedIdentityClient to make a
                // new instance of IMDS so that the relevant cache (nodeStorage) is used.
                // Otherwise the same cache (nodeStorage) will be used for all three of
                // these managed identity applications (and cause test failures).
                ManagedIdentityClient.identitySource = undefined;

                // resource R2 for system assigned - returned from a network request
                networkManagedIdentityResult =
                    await systemAssignedManagedIdentityApplicationR2.acquireToken(
                        managedIdentityRequestParams
                    );
                expect(networkManagedIdentityResult.fromCache).toBe(false);

                // ManagedIdentityClient.identitySource (IMDS in this case) is static/
                // Therefore, this is needed to tell the ManagedIdentityClient to make a
                // new instance of IMDS so that the relevant cache (nodeStorage) is used.
                // Otherwise the same cache (nodeStorage) will be used for all three of
                // these managed identity applications (and cause test failures).
                ManagedIdentityClient.identitySource = undefined;

                // resource R2 for user assigned - returned from a network request
                networkManagedIdentityResult =
                    await userAssignedClientIdManagedIdentityApplicationR2.acquireToken(
                        managedIdentityRequestParams
                    );
                expect(networkManagedIdentityResult.fromCache).toBe(false);
                // ********** end: return access tokens from a network request **********

                // ********** begin: return access tokens from the cache **********
                // resource R1 for system assigned - same request as before, returned from the cache this time
                let cachedManagedIdentityResult: AuthenticationResult =
                    await systemAssignedManagedIdentityApplication.acquireToken(
                        {
                            resource: MANAGED_IDENTITY_RESOURCE,
                        }
                    );
                expect(cachedManagedIdentityResult.fromCache).toBe(true);

                // resource R2 for system assigned - same request as before, returned from the cache this time
                cachedManagedIdentityResult =
                    await systemAssignedManagedIdentityApplicationR2.acquireToken(
                        {
                            resource: MANAGED_IDENTITY_RESOURCE,
                        }
                    );
                expect(cachedManagedIdentityResult.fromCache).toBe(true);

                // resource R2 for user assigned - same request as before, returned from the cache this time
                cachedManagedIdentityResult =
                    await userAssignedClientIdManagedIdentityApplicationR2.acquireToken(
                        {
                            resource: MANAGED_IDENTITY_RESOURCE,
                        }
                    );
                expect(cachedManagedIdentityResult.fromCache).toBe(true);
                // ********** end: return access tokens from the cache **********
            });

            test("acquires tokens, then verifies that their cache keys are correct", async () => {
                expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

                // systemAssignedManagedIdentityApplication is the default System Assigned Managed Identity Application

                const userAssignedClientIdManagedIdentityApplication: ManagedIdentityApplication =
                    new ManagedIdentityApplication(userAssignedClientIdConfig);

                const userAssignedObjectIdManagedIdentityApplication: ManagedIdentityApplication =
                    new ManagedIdentityApplication({
                        system: {
                            networkClient: userAssignedNetworkClient,
                        },
                        managedIdentityIdParams: {
                            userAssignedObjectId:
                                MANAGED_IDENTITY_RESOURCE_ID_3,
                        },
                    });

                let networkManagedIdentityResult: AuthenticationResult =
                    await systemAssignedManagedIdentityApplication.acquireToken(
                        managedIdentityRequestParams
                    );
                expect(networkManagedIdentityResult.fromCache).toBe(false);

                let cacheKey: string = Object.keys(
                    systemAssignedManagedIdentityApplication["nodeStorage"][
                        "cache"
                    ]
                )[0];
                expect(cacheKey).toEqual(
                    MANAGED_IDENTITY_SYSTEM_ASSIGNED_CACHE_KEY
                );

                // ManagedIdentityClient.identitySource (IMDS in this case) is static/
                // Therefore, this is needed to tell the ManagedIdentityClient to make a
                // new instance of IMDS so that the relevant cache (nodeStorage) is used.
                // Otherwise the same cache (nodeStorage) will be used for all three of
                // these managed identity applications (and cause test failures).
                ManagedIdentityClient.identitySource = undefined;

                networkManagedIdentityResult =
                    await userAssignedClientIdManagedIdentityApplication.acquireToken(
                        managedIdentityRequestParams
                    );
                expect(networkManagedIdentityResult.fromCache).toBe(false);

                cacheKey = Object.keys(
                    userAssignedClientIdManagedIdentityApplication[
                        "nodeStorage"
                    ]["cache"]
                )[0];
                expect(cacheKey).toEqual(
                    MANAGED_IDENTITY_USER_ASSIGNED_CLIENT_ID_CACHE_KEY
                );

                // ManagedIdentityClient.identitySource (IMDS in this case) is static/
                // Therefore, this is needed to tell the ManagedIdentityClient to make a
                // new instance of IMDS so that the relevant cache (nodeStorage) is used.
                // Otherwise the same cache (nodeStorage) will be used for all three of
                // these managed identity applications (and cause test failures).
                ManagedIdentityClient.identitySource = undefined;

                networkManagedIdentityResult =
                    await userAssignedObjectIdManagedIdentityApplication.acquireToken(
                        managedIdentityRequestParams
                    );
                expect(networkManagedIdentityResult.fromCache).toBe(false);

                cacheKey = Object.keys(
                    userAssignedObjectIdManagedIdentityApplication[
                        "nodeStorage"
                    ]["cache"]
                )[0];
                expect(cacheKey).toEqual(
                    MANAGED_IDENTITY_USER_ASSIGNED_OBJECT_ID_CACHE_KEY
                );
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
                            networkClient: userAssignedNetworkClient,
                        },
                        managedIdentityIdParams: {
                            userAssignedClientId: MANAGED_IDENTITY_RESOURCE_ID,
                            userAssignedResourceId:
                                MANAGED_IDENTITY_RESOURCE_ID_2,
                        },
                    };

                expect(() => {
                    new ManagedIdentityApplication(
                        badUserAssignedClientIdConfig
                    );
                }).toThrowError(
                    createManagedIdentityError(
                        ManagedIdentityErrorCodes.invalidManagedIdentityIdType
                    )
                );
            });

            test("managed identity token response contains an error message and correlation id when an error is returned from the managed identity", async () => {
                expect(ManagedIdentityTestUtils.isIMDS()).toBe(true);

                const managedIdentityApplication: ManagedIdentityApplication =
                    new ManagedIdentityApplication(systemAssignedErrorConfig);

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

                const correlationIdCheck = serverError.errorMessage.includes(
                    DEFAULT_MANAGED_IDENTITY_ID
                );
                expect(correlationIdCheck).toBe(true);
            });
        });
    });
});

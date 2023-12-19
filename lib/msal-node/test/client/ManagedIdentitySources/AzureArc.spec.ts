/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ManagedIdentityApplication } from "../../../src/client/ManagedIdentityApplication";
import {
    DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT,
    MANAGED_IDENTITY_AZURE_ARC_WWW_AUTHENTICATE_HEADER,
    MANAGED_IDENTITY_CONTENT_TYPE_HEADER,
    MANAGED_IDENTITY_RESOURCE,
    MANAGED_IDENTITY_RESOURCE_BASE,
    MANAGED_IDENTITY_RESOURCE_ID,
    TEST_TOKENS,
} from "../../test_kit/StringConstants";

import {
    ManagedIdentityTestUtils,
    ManagedIdentityNetworkClient,
    ManagedIdentityNetworkErrorClient,
    systemAssignedConfig,
    managedIdentityRequestParams,
    userAssignedClientIdConfig,
} from "../../test_kit/ManagedIdentityTestUtils";
import { AuthenticationResult, HttpStatus } from "@azure/msal-common";
import { ManagedIdentityClient } from "../../../src/client/ManagedIdentityClient";
import {
    ManagedIdentityErrorCodes,
    createManagedIdentityError,
} from "../../../src/error/ManagedIdentityError";
import { ARC_API_VERSION } from "../../../src/client/ManagedIdentitySources/AzureArc";
import * as fs from "fs";
import { ManagedIdentityEnvironmentVariableNames } from "../../../src/utils/Constants";

jest.mock("fs");

describe("Acquires a token successfully via an Azure Arc Managed Identity", () => {
    let OLD_ENVS: NodeJS.ProcessEnv;

    beforeAll(() => {
        // make a copy of old environment
        process.env = { ...OLD_ENVS };

        process.env[ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT] =
            "fake_IDENTITY_ENDPOINT";
        process.env[ManagedIdentityEnvironmentVariableNames.IMDS_ENDPOINT] =
            "fake_IMDS_ENDPOINT";
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

    // Azure Arc Managed Identities can only be system assigned
    describe("System Assigned", () => {
        let managedIdentityApplication: ManagedIdentityApplication;
        beforeEach(() => {
            managedIdentityApplication = new ManagedIdentityApplication(
                systemAssignedConfig
            );
        });

        test("acquires a token", async () => {
            expect(ManagedIdentityTestUtils.isAzureArc()).toBe(true);

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
            expect(ManagedIdentityTestUtils.isAzureArc()).toBe(true);

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

        test("attempts to acquire a token, a 401 and www-authenticate header are returned form the azure arc managed identity, then retries the network request with the www-authenticate header", async () => {
            expect(ManagedIdentityTestUtils.isAzureArc()).toBe(true);

            const networkClient: ManagedIdentityNetworkClient =
                new ManagedIdentityNetworkClient(MANAGED_IDENTITY_RESOURCE_ID);

            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication({
                    system: {
                        networkClient,
                        // managedIdentityIdParams will be omitted for system assigned
                    },
                });

            const networkErrorClient: ManagedIdentityNetworkErrorClient =
                new ManagedIdentityNetworkErrorClient();
            const sendGetRequestAsyncSpy: jest.SpyInstance = jest
                .spyOn(networkClient, <any>"sendGetRequestAsync")
                // override the networkClient's sendGetRequestAsync method to return a 401
                // and the WWW-Authentication header the first time the network request is executed
                .mockReturnValueOnce(
                    networkErrorClient.getSendGetRequestAsyncReturnObject(
                        "Basic realm=lib/msal-node/test/test_kit/AzureArcSecret.key"
                    )
                );

            const readFileSyncSpy: jest.SpyInstance = jest
                .spyOn(fs, "readFileSync")
                .mockReturnValueOnce(TEST_TOKENS.ACCESS_TOKEN);

            const networkManagedIdentityResult: AuthenticationResult =
                await managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );
            expect(networkManagedIdentityResult.fromCache).toBe(false);

            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );

            expect(sendGetRequestAsyncSpy).toBeCalledTimes(2);
            expect(readFileSyncSpy).toBeCalledTimes(1);

            expect(sendGetRequestAsyncSpy).nthCalledWith(
                2,
                `${process.env[
                    ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT
                ]?.toLowerCase()}?api-version=${ARC_API_VERSION}&resource=${MANAGED_IDENTITY_RESOURCE_BASE}`,
                {
                    headers: {
                        Authorization:
                            MANAGED_IDENTITY_AZURE_ARC_WWW_AUTHENTICATE_HEADER,
                        "Content-Type": MANAGED_IDENTITY_CONTENT_TYPE_HEADER,
                        Metadata: "true",
                    },
                }
            );

            jest.restoreAllMocks();
        });

        describe("Errors", () => {
            test("throws an error when a user assigned managed identity is used", async () => {
                expect(ManagedIdentityTestUtils.isAzureArc()).toBe(true);

                const managedIdentityApplication: ManagedIdentityApplication =
                    new ManagedIdentityApplication(userAssignedClientIdConfig);

                await expect(
                    managedIdentityApplication.acquireToken(
                        managedIdentityRequestParams
                    )
                ).rejects.toMatchObject(
                    createManagedIdentityError(
                        ManagedIdentityErrorCodes.unableToCreateAzureArc
                    )
                );
            });

            test("throws an error when the www-authenticate header is missing", async () => {
                expect(ManagedIdentityTestUtils.isAzureArc()).toBe(true);

                const managedIdentityApplication: ManagedIdentityApplication =
                    new ManagedIdentityApplication({
                        system: {
                            networkClient:
                                new ManagedIdentityNetworkErrorClient(
                                    undefined,
                                    HttpStatus.UNAUTHORIZED
                                ),
                            // managedIdentityIdParams will be omitted for system assigned
                        },
                    });

                await expect(
                    managedIdentityApplication.acquireToken(
                        managedIdentityRequestParams
                    )
                ).rejects.toMatchObject(
                    createManagedIdentityError(
                        ManagedIdentityErrorCodes.wwwAuthenticateHeaderMissing
                    )
                );
            });

            test("throws an error when the www-authenticate header is in an unsupported format", async () => {
                expect(ManagedIdentityTestUtils.isAzureArc()).toBe(true);

                const managedIdentityApplication: ManagedIdentityApplication =
                    new ManagedIdentityApplication({
                        system: {
                            networkClient:
                                new ManagedIdentityNetworkErrorClient(
                                    "unsupported_format"
                                ),
                            // managedIdentityIdParams will be omitted for system assigned
                        },
                    });

                await expect(
                    managedIdentityApplication.acquireToken(
                        managedIdentityRequestParams
                    )
                ).rejects.toMatchObject(
                    createManagedIdentityError(
                        ManagedIdentityErrorCodes.wwwAuthenticateHeaderUnsupportedFormat
                    )
                );
            });

            test("throws an error when the secret file cannot be found", async () => {
                expect(ManagedIdentityTestUtils.isAzureArc()).toBe(true);

                const managedIdentityApplication: ManagedIdentityApplication =
                    new ManagedIdentityApplication({
                        system: {
                            networkClient:
                                new ManagedIdentityNetworkErrorClient(
                                    "Basic realm=invalid/secret/file/location.key"
                                ),
                            // managedIdentityIdParams will be omitted for system assigned
                        },
                    });

                jest.spyOn(fs, "readFileSync").mockImplementationOnce(() => {
                    throw new Error();
                });

                await expect(
                    managedIdentityApplication.acquireToken(
                        managedIdentityRequestParams
                    )
                ).rejects.toMatchObject(
                    createManagedIdentityError(
                        ManagedIdentityErrorCodes.unableToReadSecretFile
                    )
                );

                jest.restoreAllMocks();
            });
        });
    });
});

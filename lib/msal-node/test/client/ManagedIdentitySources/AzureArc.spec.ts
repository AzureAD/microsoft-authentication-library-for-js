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
import {
    ARC_API_VERSION,
    SUPPORTED_AZURE_ARC_PLATFORMS,
} from "../../../src/client/ManagedIdentitySources/AzureArc";
import * as fs from "fs";
import {
    ManagedIdentityEnvironmentVariableNames,
    ManagedIdentitySourceNames,
} from "../../../src/utils/Constants";

jest.mock("fs");

describe("Acquires a token successfully via an Azure Arc Managed Identity", () => {
    let originalPlatform: string;

    beforeAll(() => {
        process.env[ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT] =
            "fake_IDENTITY_ENDPOINT";
        process.env[ManagedIdentityEnvironmentVariableNames.IMDS_ENDPOINT] =
            "fake_IMDS_ENDPOINT";

        originalPlatform = process.platform;
        Object.defineProperty(process, "platform", {
            value: "linux",
        });
    });

    afterAll(() => {
        delete process.env[
            ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT
        ];
        delete process.env[
            ManagedIdentityEnvironmentVariableNames.IMDS_ENDPOINT
        ];

        Object.defineProperty(process, "platform", {
            value: originalPlatform,
        });
    });

    afterEach(() => {
        // reset static variables after each test
        delete ManagedIdentityClient["identitySource"];
        delete ManagedIdentityApplication["nodeStorage"];
    });

    // Azure Arc Managed Identities can only be system assigned
    describe("System Assigned", () => {
        let managedIdentityApplication: ManagedIdentityApplication;
        beforeEach(() => {
            managedIdentityApplication = new ManagedIdentityApplication(
                systemAssignedConfig
            );
            expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
                ManagedIdentitySourceNames.AZURE_ARC
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

        test("attempts to acquire a token, a 401 and www-authenticate header are returned from the azure arc managed identity, then retries the network request with the www-authenticate header", async () => {
            const networkClient: ManagedIdentityNetworkClient =
                new ManagedIdentityNetworkClient(MANAGED_IDENTITY_RESOURCE_ID);

            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication({
                    system: {
                        networkClient,
                        // managedIdentityIdParams will be omitted for system assigned
                    },
                });
            expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
                ManagedIdentitySourceNames.AZURE_ARC
            );

            const networkErrorClient: ManagedIdentityNetworkErrorClient =
                new ManagedIdentityNetworkErrorClient();
            const sendGetRequestAsyncSpy: jest.SpyInstance = jest
                .spyOn(networkClient, <any>"sendGetRequestAsync")
                // override the networkClient's sendGetRequestAsync method to return a 401
                // and the WWW-Authentication header the first time the network request is executed
                .mockReturnValueOnce(
                    networkErrorClient.getSendGetRequestAsyncReturnObject(
                        `Basic realm=${SUPPORTED_AZURE_ARC_PLATFORMS.linux}/AzureArcSecret.key` // Linux
                    )
                );

            const statSyncSpy: jest.SpyInstance = jest
                .spyOn(fs, "statSync")
                .mockReturnValueOnce({
                    size: 4000,
                } as fs.Stats);
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

            expect(sendGetRequestAsyncSpy).toHaveBeenCalledTimes(2);
            expect(statSyncSpy).toHaveBeenCalledTimes(1);
            expect(readFileSyncSpy).toHaveBeenCalledTimes(1);

            expect(sendGetRequestAsyncSpy).toHaveBeenNthCalledWith(
                2,
                `${
                    process.env[
                        ManagedIdentityEnvironmentVariableNames
                            .IDENTITY_ENDPOINT
                    ]
                }?api-version=${ARC_API_VERSION}&resource=${MANAGED_IDENTITY_RESOURCE_BASE}`,
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
    });

    describe("Errors", () => {
        test("throws an error if a user assigned managed identity is used", async () => {
            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(userAssignedClientIdConfig);
            expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
                ManagedIdentitySourceNames.AZURE_ARC
            );

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

        test("throws an error if the www-authenticate header has been returned from the azure arc managed identity, but the managed identity application is not being run on Windows or Linux", async () => {
            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication({
                    system: {
                        networkClient: new ManagedIdentityNetworkErrorClient(
                            `Basic realm=${SUPPORTED_AZURE_ARC_PLATFORMS.linux}/AzureArcSecret.key` // Linux
                        ),
                        // managedIdentityIdParams will be omitted for system assigned
                    },
                });
            expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
                ManagedIdentitySourceNames.AZURE_ARC
            );

            Object.defineProperty(process, "platform", {
                value: "darwin",
            });

            await expect(
                managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                )
            ).rejects.toMatchObject(
                createManagedIdentityError(
                    ManagedIdentityErrorCodes.platformNotSupported
                )
            );

            Object.defineProperty(process, "platform", {
                value: "linux",
            });
            jest.restoreAllMocks();
        });

        test("throws an error if the www-authenticate header has been returned from the azure arc managed identity, but the path of the secret file from the www-authenticate header is not in the expected Windows or Linux formats", async () => {
            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication({
                    system: {
                        networkClient: new ManagedIdentityNetworkErrorClient(
                            "Basic realm=/this/is/an/invalid/file/location/for/linux/AzureArcSecret.key" // neither Windows or Linux
                        ),
                        // managedIdentityIdParams will be omitted for system assigned
                    },
                });
            expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
                ManagedIdentitySourceNames.AZURE_ARC
            );

            await expect(
                managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                )
            ).rejects.toMatchObject(
                createManagedIdentityError(
                    ManagedIdentityErrorCodes.invalidFilePath
                )
            );

            jest.restoreAllMocks();
        });

        test("throws an error if the www-authenticate header has been returned from the azure arc managed identity, but the size of the secret file from the www-authenticate header is greater than 4096 bytes", async () => {
            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication({
                    system: {
                        networkClient: new ManagedIdentityNetworkErrorClient(
                            `Basic realm=${SUPPORTED_AZURE_ARC_PLATFORMS.linux}/AzureArcSecret.key` // Linux
                        ),
                        // managedIdentityIdParams will be omitted for system assigned
                    },
                });
            expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
                ManagedIdentitySourceNames.AZURE_ARC
            );

            jest.spyOn(fs, "statSync").mockReturnValueOnce({
                size: 4097,
            } as fs.Stats);

            await expect(
                managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                )
            ).rejects.toMatchObject(
                createManagedIdentityError(
                    ManagedIdentityErrorCodes.invalidSecret
                )
            );

            jest.restoreAllMocks();
        });

        test("throws an error if the www-authenticate header is missing", async () => {
            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication({
                    system: {
                        networkClient: new ManagedIdentityNetworkErrorClient(
                            undefined,
                            HttpStatus.UNAUTHORIZED
                        ),
                        // managedIdentityIdParams will be omitted for system assigned
                    },
                });
            expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
                ManagedIdentitySourceNames.AZURE_ARC
            );

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

        test("throws an error if the www-authenticate header is in an unsupported format", async () => {
            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication({
                    system: {
                        networkClient: new ManagedIdentityNetworkErrorClient(
                            "unsupported_format"
                        ),
                        // managedIdentityIdParams will be omitted for system assigned
                    },
                });
            expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
                ManagedIdentitySourceNames.AZURE_ARC
            );

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

        test("throws an error if the secret file cannot be found/read", async () => {
            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication({
                    system: {
                        networkClient: new ManagedIdentityNetworkErrorClient(
                            "Basic realm=/var/opt/azcmagent/tokens/AzureArcSecret.key" // Linux
                        ),
                        // managedIdentityIdParams will be omitted for system assigned
                    },
                });
            expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
                ManagedIdentitySourceNames.AZURE_ARC
            );

            jest.spyOn(fs, "statSync").mockImplementationOnce(() => {
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

            jest.spyOn(fs, "statSync").mockReturnValueOnce({
                size: 4000,
            } as fs.Stats);

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

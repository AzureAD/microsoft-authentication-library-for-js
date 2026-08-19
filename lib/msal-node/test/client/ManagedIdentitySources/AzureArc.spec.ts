/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ManagedIdentityApplication } from "../../../src/client/ManagedIdentityApplication.js";
import {
    DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT,
    MANAGED_IDENTITY_AZURE_ARC_NETWORK_REQUEST_400_ERROR,
    MANAGED_IDENTITY_AZURE_ARC_WWW_AUTHENTICATE_HEADER,
    MANAGED_IDENTITY_CONTENT_TYPE_HEADER,
    MANAGED_IDENTITY_RESOURCE,
    MANAGED_IDENTITY_RESOURCE_BASE,
    MANAGED_IDENTITY_RESOURCE_ID,
    TEST_TOKENS,
} from "../../test_kit/StringConstants.js";

import {
    ManagedIdentityNetworkClient,
    ManagedIdentityNetworkErrorClient,
    systemAssignedConfig,
    managedIdentityRequestParams,
    userAssignedClientIdConfig,
    userAssignedResourceIdConfig,
    userAssignedObjectIdConfig,
    networkClient,
} from "../../test_kit/ManagedIdentityTestUtils.js";
import {
    AuthenticationResult,
    Constants,
    ServerError,
} from "@azure/msal-common";
import { ManagedIdentityClient } from "../../../src/client/ManagedIdentityClient.js";
import {
    ManagedIdentityErrorCodes,
    createManagedIdentityError,
} from "../../../src/error/ManagedIdentityError.js";
import {
    ARC_API_VERSION,
    SUPPORTED_AZURE_ARC_PLATFORMS,
} from "../../../src/client/ManagedIdentitySources/AzureArc.js";
import * as fs from "fs";
import {
    ManagedIdentityEnvironmentVariableNames,
    ManagedIdentitySourceNames,
} from "../../../src/utils/Constants.js";

jest.mock("fs");

describe("Acquires a token successfully via an Azure Arc Managed Identity", () => {
    let originalPlatform: string;
    let accessSyncSpy: jest.SpyInstance;

    beforeAll(() => {
        process.env[ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT] =
            "fake_IDENTITY_ENDPOINT";
        process.env[ManagedIdentityEnvironmentVariableNames.IMDS_ENDPOINT] =
            "fake_IMDS_ENDPOINT";

        originalPlatform = process.platform;
        Object.defineProperty(process, "platform", {
            value: "linux",
        });

        accessSyncSpy = jest
            .spyOn(fs, "accessSync")
            // returns undefined when the himds file exists and its permissions allow it to be read
            // otherwise, throws an error
            .mockImplementation(() => {
                throw new Error();
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
        jest.restoreAllMocks();
    });

    const managedIdentityNetworkErrorClient401 =
        new ManagedIdentityNetworkErrorClient(
            {}, // 401 error response. Will be ignored because only the www-authenticate header is relevant when Azure Arc returns a 401 error
            {
                "www-authenticate": `Basic realm=${SUPPORTED_AZURE_ARC_PLATFORMS.linux}AzureArcSecret.key`,
            },
            Constants.HTTP_UNAUTHORIZED
        );

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

        test("acquires a token when both/either the identityEndpoint and/or imdsEndpoint environment variables are undefined, and the himds executable exists and its permissions allow it to be read", async () => {
            // delete the environment variables so the himds executable is checked
            delete process.env[
                ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT
            ];
            delete process.env[
                ManagedIdentityEnvironmentVariableNames.IMDS_ENDPOINT
            ];
            // delete value cached from getManagedIdentitySource() in the beforeEach
            delete ManagedIdentityClient["sourceName"];

            // MI source will not be Azure Arc yet, since the environment variables are undefined,
            // and accessSyncSpy still returns an error
            // (meaning either the himds file doesn't exists or its permissions don't allow it to be read)
            expect(
                managedIdentityApplication.getManagedIdentitySource()
            ).not.toBe(ManagedIdentitySourceNames.AZURE_ARC);
            // delete value cached from getManagedIdentitySource() directly above
            delete ManagedIdentityClient["sourceName"];

            // returns undefined when the himds file exists and its permissions allow it to be read
            // otherwise, throws an error
            accessSyncSpy.mockImplementationOnce(() => {
                return undefined;
            });

            expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
                ManagedIdentitySourceNames.AZURE_ARC
            );

            // returns undefined when the himds file exists and its permissions allow it to be read
            // otherwise, throws an error
            accessSyncSpy.mockImplementationOnce(() => {
                return undefined;
            });
            const networkManagedIdentityResult: AuthenticationResult =
                await managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );
            expect(networkManagedIdentityResult.fromCache).toBe(false);

            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );

            // one for each call to getManagedIdentitySource() + one for the acquireToken call
            expect(accessSyncSpy).toHaveBeenCalledTimes(3);

            // reset the environment variables to expected values for Azure Arc tests
            process.env[
                ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT
            ] = "fake_IDENTITY_ENDPOINT";
            process.env[ManagedIdentityEnvironmentVariableNames.IMDS_ENDPOINT] =
                "fake_IMDS_ENDPOINT";
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
            const sendGetRequestAsyncSpy: jest.SpyInstance = jest
                .spyOn(networkClient, <any>"sendGetRequestAsync")
                // override the networkClient's sendGetRequestAsync method to return a 401
                // and the WWW-Authentication header the first time the network request is executed
                .mockReturnValueOnce(
                    managedIdentityNetworkErrorClient401.sendGetRequestAsync()
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
                }?api-version=${ARC_API_VERSION}&resource=${encodeURIComponent(
                    MANAGED_IDENTITY_RESOURCE_BASE
                )}`,
                {
                    headers: {
                        Authorization:
                            MANAGED_IDENTITY_AZURE_ARC_WWW_AUTHENTICATE_HEADER,
                        "Content-Type": MANAGED_IDENTITY_CONTENT_TYPE_HEADER,
                        Metadata: "true",
                    },
                }
            );
        });
    });

    describe("Errors", () => {
        let managedIdentityApplication: ManagedIdentityApplication;
        beforeEach(() => {
            managedIdentityApplication = new ManagedIdentityApplication(
                systemAssignedConfig
            );
            expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
                ManagedIdentitySourceNames.AZURE_ARC
            );
        });

        test("acquires a token for a user-assigned client id when Azure Arc confirms it in the response echo", async () => {
            const userAssignedManagedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(userAssignedClientIdConfig);
            expect(
                userAssignedManagedIdentityApplication.getManagedIdentitySource()
            ).toBe(ManagedIdentitySourceNames.AZURE_ARC);

            // The default network client echoes client_id = MANAGED_IDENTITY_RESOURCE_ID, which
            // matches the requested user-assigned client id, so the fail-closed check passes.
            const networkManagedIdentityResult: AuthenticationResult =
                await userAssignedManagedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );
            expect(networkManagedIdentityResult.fromCache).toBe(false);
            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );
        });

        test("forwards the resource-id selector as msi_res_id (the spelling Azure Arc honors) and returns the token when it is echoed", async () => {
            const userAssignedManagedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(userAssignedResourceIdConfig);

            let requestUrl = "";
            jest.spyOn(
                networkClient,
                <any>"sendGetRequestAsync"
            ).mockImplementationOnce(async (...args: unknown[]) => {
                requestUrl = args[0] as string;
                return {
                    status: Constants.HTTP_SUCCESS,
                    body: {
                        access_token: TEST_TOKENS.ACCESS_TOKEN,
                        // Azure Arc echoes the resource id under "msi_res_id".
                        msi_res_id: MANAGED_IDENTITY_RESOURCE_ID,
                        expires_on: Math.floor(Date.now() / 1000) + 3 * 3600,
                        resource: MANAGED_IDENTITY_RESOURCE_BASE,
                        token_type: Constants.AuthenticationScheme.BEARER,
                    },
                    headers: {},
                };
            });

            const networkManagedIdentityResult: AuthenticationResult =
                await userAssignedManagedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );

            expect(networkManagedIdentityResult.accessToken).toBeTruthy();
            // The request must carry msi_res_id, not the mi_res_id spelling Azure Arc ignores.
            expect(requestUrl).toContain("msi_res_id=");
            expect(requestUrl).not.toContain("mi_res_id=");
        });

        test("fails closed when Azure Arc does not confirm the requested user-assigned identity", async () => {
            // Simulate a legacy agent that ignores the selector and returns the system-assigned
            // identity: the response echoes a different client_id than the one requested.
            const nonConfirmingNetworkClient: ManagedIdentityNetworkClient =
                new ManagedIdentityNetworkClient(
                    "00000000-0000-0000-0000-000000000000"
                );
            const userAssignedManagedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication({
                    system: { networkClient: nonConfirmingNetworkClient },
                    managedIdentityIdParams: {
                        userAssignedClientId: MANAGED_IDENTITY_RESOURCE_ID,
                    },
                });
            expect(
                userAssignedManagedIdentityApplication.getManagedIdentitySource()
            ).toBe(ManagedIdentitySourceNames.AZURE_ARC);

            await expect(
                userAssignedManagedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                )
            ).rejects.toMatchObject(
                createManagedIdentityError(
                    ManagedIdentityErrorCodes.userAssignedManagedIdentityNotConfirmed,
                    ""
                )
            );
        });

        test("acquires a token for a user-assigned object id when Azure Arc confirms it in the response echo", async () => {
            const userAssignedManagedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(userAssignedObjectIdConfig);
            expect(
                userAssignedManagedIdentityApplication.getManagedIdentitySource()
            ).toBe(ManagedIdentitySourceNames.AZURE_ARC);

            let requestUrl = "";
            jest.spyOn(
                networkClient,
                <any>"sendGetRequestAsync"
            ).mockImplementationOnce(async (...args: unknown[]) => {
                requestUrl = args[0] as string;
                return {
                    status: Constants.HTTP_SUCCESS,
                    body: {
                        access_token: TEST_TOKENS.ACCESS_TOKEN,
                        // Azure Arc echoes the object id under "object_id".
                        object_id: MANAGED_IDENTITY_RESOURCE_ID,
                        expires_on: Math.floor(Date.now() / 1000) + 3 * 3600,
                        resource: MANAGED_IDENTITY_RESOURCE_BASE,
                        token_type: Constants.AuthenticationScheme.BEARER,
                    },
                    headers: {},
                };
            });

            const networkManagedIdentityResult: AuthenticationResult =
                await userAssignedManagedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );

            expect(networkManagedIdentityResult.accessToken).toBeTruthy();
            // The object id must be forwarded on the request.
            expect(requestUrl).toContain("object_id=");
        });

        test("fails closed when Azure Arc returns a token with no identity echo at all", async () => {
            const userAssignedManagedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(userAssignedClientIdConfig);

            // A legacy agent may ignore the selector and return a token with no
            // client_id / object_id / msi_res_id / mi_res_id echo. MSAL must fail closed.
            jest.spyOn(
                networkClient,
                <any>"sendGetRequestAsync"
            ).mockImplementationOnce(async () => ({
                status: Constants.HTTP_SUCCESS,
                body: {
                    access_token: TEST_TOKENS.ACCESS_TOKEN,
                    expires_on: Math.floor(Date.now() / 1000) + 3 * 3600,
                    resource: MANAGED_IDENTITY_RESOURCE_BASE,
                    token_type: Constants.AuthenticationScheme.BEARER,
                },
                headers: {},
            }));

            await expect(
                userAssignedManagedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                )
            ).rejects.toMatchObject(
                createManagedIdentityError(
                    ManagedIdentityErrorCodes.userAssignedManagedIdentityNotConfirmed,
                    ""
                )
            );
        });

        test("accepts the alternate mi_res_id spelling in the response echo for a resource-id request", async () => {
            const userAssignedManagedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(userAssignedResourceIdConfig);

            // Some agents echo the resource id under the alternate "mi_res_id" spelling; accept it.
            jest.spyOn(
                networkClient,
                <any>"sendGetRequestAsync"
            ).mockImplementationOnce(async () => ({
                status: Constants.HTTP_SUCCESS,
                body: {
                    access_token: TEST_TOKENS.ACCESS_TOKEN,
                    mi_res_id: MANAGED_IDENTITY_RESOURCE_ID,
                    expires_on: Math.floor(Date.now() / 1000) + 3 * 3600,
                    resource: MANAGED_IDENTITY_RESOURCE_BASE,
                    token_type: Constants.AuthenticationScheme.BEARER,
                },
                headers: {},
            }));

            const networkManagedIdentityResult: AuthenticationResult =
                await userAssignedManagedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );

            expect(networkManagedIdentityResult.accessToken).toBeTruthy();
        });

        test("surfaces a 404 without a token as a normal service error for a user-assigned request (not the fail-closed error)", async () => {
            const managedIdentityNetworkErrorClient404 =
                new ManagedIdentityNetworkErrorClient(
                    MANAGED_IDENTITY_AZURE_ARC_NETWORK_REQUEST_400_ERROR,
                    undefined,
                    404
                );

            const userAssignedManagedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(userAssignedClientIdConfig);

            jest.spyOn(
                networkClient,
                <any>"sendGetRequestAsync"
            ).mockReturnValue(
                managedIdentityNetworkErrorClient404.sendGetRequestAsync()
            );

            let error: unknown;
            try {
                await userAssignedManagedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );
            } catch (e) {
                error = e;
            }

            // No access_token in the response, so the fail-closed check is skipped and the
            // standard handler surfaces a normal service error, not the fail-closed error.
            expect(error).toBeInstanceOf(ServerError);
            expect(
                (error as ServerError).errorMessage.includes(
                    ManagedIdentityErrorCodes.userAssignedManagedIdentityNotConfirmed
                )
            ).toBe(false);
        });

        test("throws an error if the www-authenticate header has been returned from the azure arc managed identity, but the file in the file path is not a .key file", async () => {
            const managedIdentityNetworkErrorClient401FileNotFound =
                new ManagedIdentityNetworkErrorClient(
                    {}, // 401 error response. Will be ignored because only the www-authenticate header is relevant when Azure Arc returns a 401 error,
                    {
                        "www-authenticate": `Basic realm=${SUPPORTED_AZURE_ARC_PLATFORMS.linux}AzureArcSecret.txt`, // Linux
                    },
                    Constants.HTTP_UNAUTHORIZED
                );

            jest.spyOn(networkClient, <any>"sendGetRequestAsync")
                // override the networkClient's sendGetRequestAsync method to return a 401
                // and the WWW-Authentication header the first time the network request is executed
                .mockReturnValueOnce(
                    managedIdentityNetworkErrorClient401FileNotFound.sendGetRequestAsync()
                );

            await expect(
                managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                )
            ).rejects.toMatchObject(
                createManagedIdentityError(
                    ManagedIdentityErrorCodes.invalidFileExtension,
                    ""
                )
            );
        });

        test("throws an error if the www-authenticate header has been returned from the azure arc managed identity, but the managed identity application is not being run on Windows or Linux", async () => {
            jest.spyOn(networkClient, <any>"sendGetRequestAsync")
                // override the networkClient's sendGetRequestAsync method to return a 401
                // and the WWW-Authentication header the first time the network request is executed
                .mockReturnValueOnce(
                    managedIdentityNetworkErrorClient401.sendGetRequestAsync()
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
                    ManagedIdentityErrorCodes.platformNotSupported,
                    ""
                )
            );

            Object.defineProperty(process, "platform", {
                value: "linux",
            });
        });

        test("throws an error if the www-authenticate header has been returned from the azure arc managed identity, but the path of the secret file from the www-authenticate header is not in the expected Windows or Linux formats", async () => {
            const managedIdentityNetworkErrorClient401BadFilePath =
                new ManagedIdentityNetworkErrorClient(
                    {}, // 401 error response. Will be ignored because only the www-authenticate header is relevant when Azure Arc returns a 401 error,
                    {
                        "www-authenticate": `Basic realm=${SUPPORTED_AZURE_ARC_PLATFORMS.linux}this_will_throw_because_file_path_must_match_exactly/AzureArcSecret.key`, // Linux
                    },
                    Constants.HTTP_UNAUTHORIZED
                );

            jest.spyOn(networkClient, <any>"sendGetRequestAsync")
                // override the networkClient's sendGetRequestAsync method to return a 401
                // and the WWW-Authentication header the first time the network request is executed
                .mockReturnValueOnce(
                    managedIdentityNetworkErrorClient401BadFilePath.sendGetRequestAsync()
                );

            await expect(
                managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                )
            ).rejects.toMatchObject(
                createManagedIdentityError(
                    ManagedIdentityErrorCodes.invalidFilePath,
                    ""
                )
            );
        });

        test("throws an error if the www-authenticate header has been returned from the azure arc managed identity, but the size of the secret file from the www-authenticate header is greater than 4096 bytes", async () => {
            jest.spyOn(networkClient, <any>"sendGetRequestAsync")
                // override the networkClient's sendGetRequestAsync method to return a 401
                // and the WWW-Authentication header the first time the network request is executed
                .mockReturnValueOnce(
                    managedIdentityNetworkErrorClient401.sendGetRequestAsync()
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
                    ManagedIdentityErrorCodes.invalidSecret,
                    ""
                )
            );
        });

        test("throws an error if the www-authenticate header is missing", async () => {
            const managedIdentityNetworkErrorClient401HeaderMissing =
                new ManagedIdentityNetworkErrorClient(
                    {}, // 401 error response. Will be ignored because only the www-authenticate header is relevant when Azure Arc returns a 401 error,
                    {}, // www-authenticate header missing
                    Constants.HTTP_UNAUTHORIZED
                );

            jest.spyOn(networkClient, <any>"sendGetRequestAsync")
                // override the networkClient's sendGetRequestAsync method to return a 401
                // and the WWW-Authentication header the first time the network request is executed
                .mockReturnValueOnce(
                    managedIdentityNetworkErrorClient401HeaderMissing.sendGetRequestAsync()
                );

            await expect(
                managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                )
            ).rejects.toMatchObject(
                createManagedIdentityError(
                    ManagedIdentityErrorCodes.wwwAuthenticateHeaderMissing,
                    ""
                )
            );
        });

        test("throws an error if the www-authenticate header is in an unsupported format", async () => {
            const managedIdentityNetworkErrorClient401HeaderBadFormat =
                new ManagedIdentityNetworkErrorClient(
                    {}, // 401 error response. Will be ignored because only the www-authenticate header is relevant when Azure Arc returns a 401 error,
                    {
                        "www-authenticate": "unsupported_format",
                    },
                    Constants.HTTP_UNAUTHORIZED
                );

            jest.spyOn(networkClient, <any>"sendGetRequestAsync")
                // override the networkClient's sendGetRequestAsync method to return a 401
                // and the WWW-Authentication header the first time the network request is executed
                .mockReturnValueOnce(
                    managedIdentityNetworkErrorClient401HeaderBadFormat.sendGetRequestAsync()
                );

            await expect(
                managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                )
            ).rejects.toMatchObject(
                createManagedIdentityError(
                    ManagedIdentityErrorCodes.wwwAuthenticateHeaderUnsupportedFormat,
                    ""
                )
            );
        });

        test("throws an error if the secret file cannot be found/read", async () => {
            jest.spyOn(networkClient, <any>"sendGetRequestAsync")
                // override the networkClient's sendGetRequestAsync method to return a 401
                // and the WWW-Authentication header the first time the network request is executed
                .mockReturnValueOnce(
                    managedIdentityNetworkErrorClient401.sendGetRequestAsync()
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
                    ManagedIdentityErrorCodes.unableToReadSecretFile,
                    ""
                )
            );

            jest.spyOn(networkClient, <any>"sendGetRequestAsync")
                // override the networkClient's sendGetRequestAsync method to return a 401
                // and the WWW-Authentication header the first time the network request is executed
                .mockReturnValueOnce(
                    managedIdentityNetworkErrorClient401.sendGetRequestAsync()
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
                    ManagedIdentityErrorCodes.unableToReadSecretFile,
                    ""
                )
            );
        });

        test("ensures that the error format is correct", async () => {
            const managedIdentityNetworkErrorClient400 =
                new ManagedIdentityNetworkErrorClient(
                    MANAGED_IDENTITY_AZURE_ARC_NETWORK_REQUEST_400_ERROR,
                    undefined,
                    Constants.HTTP_BAD_REQUEST
                );

            jest.spyOn(networkClient, <any>"sendGetRequestAsync")
                // permanently override the networkClient's sendGetRequestAsync method to return a 400
                .mockReturnValue(
                    managedIdentityNetworkErrorClient400.sendGetRequestAsync()
                );

            let serverError: ServerError = new ServerError("", "");
            try {
                await managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );
            } catch (e) {
                serverError = e as ServerError;
            }

            expect(
                serverError.errorMessage.includes(
                    MANAGED_IDENTITY_AZURE_ARC_NETWORK_REQUEST_400_ERROR.error as string
                )
            ).toBe(true);
            expect(
                serverError.errorMessage.includes(
                    MANAGED_IDENTITY_AZURE_ARC_NETWORK_REQUEST_400_ERROR.error_description as string
                )
            ).toBe(true);
            MANAGED_IDENTITY_AZURE_ARC_NETWORK_REQUEST_400_ERROR.error_codes?.forEach(
                (errorCode) => {
                    expect(serverError.errorMessage.includes(errorCode)).toBe(
                        true
                    );
                }
            );
            expect(
                serverError.errorMessage.includes(
                    MANAGED_IDENTITY_AZURE_ARC_NETWORK_REQUEST_400_ERROR.timestamp as string
                )
            ).toBe(true);
            expect(
                serverError.errorMessage.includes(
                    MANAGED_IDENTITY_AZURE_ARC_NETWORK_REQUEST_400_ERROR.trace_id as string
                )
            ).toBe(true);
            expect(
                serverError.errorMessage.includes(
                    MANAGED_IDENTITY_AZURE_ARC_NETWORK_REQUEST_400_ERROR.correlation_id as string
                )
            ).toBe(true);
        });
    });
});

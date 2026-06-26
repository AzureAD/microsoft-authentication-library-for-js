/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ManagedIdentityApplication } from "../../../src/client/ManagedIdentityApplication.js";
import {
    DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT,
    MANAGED_IDENTITY_RESOURCE,
} from "../../test_kit/StringConstants.js";
import {
    networkClient,
    systemAssignedConfig,
} from "../../test_kit/ManagedIdentityTestUtils.js";
import {
    ManagedIdentityEnvironmentVariableNames,
    ManagedIdentityQueryParameters,
    ManagedIdentitySourceNames,
} from "../../../src/utils/Constants.js";
import { AuthenticationResult } from "@azure/msal-common";
import { ManagedIdentityClient } from "../../../src/client/ManagedIdentityClient.js";
import {
    ManagedIdentityErrorCodes,
    ManagedIdentityErrorMessages,
} from "../../../src/error/ManagedIdentityError.js";
import { ClientConfigurationErrorCodes } from "@azure/msal-common";
import { NodeStorage } from "../../../src/cache/NodeStorage.js";

// MSIv1 (IMDS) only permits the `xms_az_nwperimid` client claim.
const NSP_CLAIMS: string = `{"xms_az_nwperimid":{"essential":true}}`;
// Same key, different value — must produce a separate cache entry.
const OTHER_CLAIMS: string = `{"xms_az_nwperimid":{"values":["eastus"]}}`;
const VALID_NSP_CLAIM: string = `{"xms_az_nwperimid":{"values":["perimid-1234"]}}`;
const UNSUPPORTED_CLAIM: string = `{"custom_claim":{"essential":true}}`;
const MIXED_CLAIMS: string = `{"xms_az_nwperimid":{"values":["perimid-1234"]},"other_claim":{"essential":true}}`;
// Server-issued claims challenge (bypasses cache, never forwarded to IMDS).
const SERVER_CLAIMS: string = `{"access_token":{"nbf":{"essential":true}}}`;

describe("Managed Identity client claims (clientClaims)", () => {
    beforeEach(() => {
        // The detected source is cached on a static; clear it so each test
        // (which may target a different source) recomputes from the environment.
        delete ManagedIdentityClient["sourceName"];
        delete ManagedIdentityClient["identitySource"];
    });

    describe("IMDS forwarding & caching", () => {
        afterEach(() => {
            // reset static variables after each test
            delete ManagedIdentityClient["identitySource"];
            delete ManagedIdentityApplication["nodeStorage"];
            jest.restoreAllMocks();
        });

        it("forwards clientClaims as the `claims` query parameter to IMDS", async () => {
            const sendGetRequestAsyncSpy: jest.SpyInstance = jest.spyOn(
                networkClient,
                <any>"sendGetRequestAsync"
            );

            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(systemAssignedConfig);
            expect(managedIdentityApplication.getManagedIdentitySource()).toBe(
                ManagedIdentitySourceNames.DEFAULT_TO_IMDS
            );

            const result: AuthenticationResult =
                await managedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                    clientClaims: NSP_CLAIMS,
                });
            expect(result.fromCache).toBe(false);
            expect(result.accessToken).toEqual(
                DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );

            const url: URLSearchParams = new URLSearchParams(
                sendGetRequestAsyncSpy.mock.lastCall[0]
            );
            // URLSearchParams decodes the encoded value back to the raw JSON string.
            expect(url.get(ManagedIdentityQueryParameters.CLAIMS)).toEqual(
                NSP_CLAIMS
            );
        });

        it("does not include the `claims` query parameter when clientClaims is absent", async () => {
            const sendGetRequestAsyncSpy: jest.SpyInstance = jest.spyOn(
                networkClient,
                <any>"sendGetRequestAsync"
            );

            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(systemAssignedConfig);

            await managedIdentityApplication.acquireToken({
                resource: MANAGED_IDENTITY_RESOURCE,
            });

            const url: URLSearchParams = new URLSearchParams(
                sendGetRequestAsyncSpy.mock.lastCall[0]
            );
            expect(url.has(ManagedIdentityQueryParameters.CLAIMS)).toBe(false);
        });

        it("treats whitespace-only clientClaims as absent (no `claims` param, no validation)", async () => {
            const sendGetRequestAsyncSpy: jest.SpyInstance = jest.spyOn(
                networkClient,
                <any>"sendGetRequestAsync"
            );

            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(systemAssignedConfig);

            const result: AuthenticationResult =
                await managedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                    clientClaims: "   ",
                });
            expect(result.fromCache).toBe(false);

            const url: URLSearchParams = new URLSearchParams(
                sendGetRequestAsyncSpy.mock.lastCall[0]
            );
            expect(url.has(ManagedIdentityQueryParameters.CLAIMS)).toBe(false);
        });

        it("serves the second call with identical clientClaims from cache (no extra network call)", async () => {
            const sendGetRequestAsyncSpy: jest.SpyInstance = jest.spyOn(
                networkClient,
                <any>"sendGetRequestAsync"
            );

            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(systemAssignedConfig);

            const result1: AuthenticationResult =
                await managedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                    clientClaims: NSP_CLAIMS,
                });
            expect(result1.fromCache).toBe(false);
            expect(sendGetRequestAsyncSpy.mock.calls.length).toEqual(1);

            const result2: AuthenticationResult =
                await managedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                    clientClaims: NSP_CLAIMS,
                });
            expect(result2.fromCache).toBe(true);
            expect(result2.accessToken).toEqual(result1.accessToken);
            // No additional network call — second call was served from cache.
            expect(sendGetRequestAsyncSpy.mock.calls.length).toEqual(1);
        });

        it("produces separate cache entries for different clientClaims values", async () => {
            const sendGetRequestAsyncSpy: jest.SpyInstance = jest.spyOn(
                networkClient,
                <any>"sendGetRequestAsync"
            );

            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(systemAssignedConfig);

            const result1: AuthenticationResult =
                await managedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                    clientClaims: NSP_CLAIMS,
                });
            expect(result1.fromCache).toBe(false);

            const result2: AuthenticationResult =
                await managedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                    clientClaims: OTHER_CLAIMS,
                });
            // Different claims value => separate cache partition => network call.
            expect(result2.fromCache).toBe(false);
            expect(sendGetRequestAsyncSpy.mock.calls.length).toEqual(2);

            const secondCallParams: URLSearchParams = new URLSearchParams(
                sendGetRequestAsyncSpy.mock.lastCall[0]
            );
            expect(
                secondCallParams.get(ManagedIdentityQueryParameters.CLAIMS)
            ).toEqual(OTHER_CLAIMS);
        });

        it("does not bypass the cache (unlike server claims) on repeated clientClaims calls", async () => {
            const sendGetRequestAsyncSpy: jest.SpyInstance = jest.spyOn(
                networkClient,
                <any>"sendGetRequestAsync"
            );

            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(systemAssignedConfig);

            await managedIdentityApplication.acquireToken({
                resource: MANAGED_IDENTITY_RESOURCE,
                clientClaims: NSP_CLAIMS,
            });

            const result: AuthenticationResult =
                await managedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                    clientClaims: NSP_CLAIMS,
                });
            expect(result.fromCache).toBe(true);
            expect(sendGetRequestAsyncSpy.mock.calls.length).toEqual(1);
        });

        it("forwards only clientClaims (not server claims) and still bypasses cache when server claims are present", async () => {
            const sendGetRequestAsyncSpy: jest.SpyInstance = jest.spyOn(
                networkClient,
                <any>"sendGetRequestAsync"
            );

            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(systemAssignedConfig);

            const result1: AuthenticationResult =
                await managedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                    claims: SERVER_CLAIMS,
                    clientClaims: NSP_CLAIMS,
                });
            expect(result1.fromCache).toBe(false);

            // Only the client claims are forwarded to IMDS as `claims` — never the
            // server-issued challenge.
            const firstCallParams: URLSearchParams = new URLSearchParams(
                sendGetRequestAsyncSpy.mock.lastCall[0]
            );
            expect(
                firstCallParams.get(ManagedIdentityQueryParameters.CLAIMS)
            ).toEqual(NSP_CLAIMS);

            // Server claims force a network round-trip on every call (cache bypass),
            // even though a token with the matching client_claims is cached.
            const result2: AuthenticationResult =
                await managedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                    claims: SERVER_CLAIMS,
                    clientClaims: NSP_CLAIMS,
                });
            expect(result2.fromCache).toBe(false);
            expect(sendGetRequestAsyncSpy.mock.calls.length).toEqual(2);

            const secondCallParams: URLSearchParams = new URLSearchParams(
                sendGetRequestAsyncSpy.mock.lastCall[0]
            );
            expect(
                secondCallParams.get(ManagedIdentityQueryParameters.CLAIMS)
            ).toEqual(NSP_CLAIMS);
        });

        it("stores client_claims in the cached token's additionalCacheKeyComponents", async () => {
            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(systemAssignedConfig);

            await managedIdentityApplication.acquireToken({
                resource: MANAGED_IDENTITY_RESOURCE,
                clientClaims: NSP_CLAIMS,
            });

            const nodeStorage: NodeStorage = ManagedIdentityApplication[
                "nodeStorage"
            ] as NodeStorage;
            const accessTokenKeys: Array<string> =
                nodeStorage.getTokenKeys().accessToken;
            expect(accessTokenKeys.length).toBeGreaterThan(0);

            const cachedToken = nodeStorage.getAccessTokenCredential(
                accessTokenKeys[0]
            );
            expect(cachedToken!.additionalCacheKeyComponents).toEqual({
                client_claims: NSP_CLAIMS,
            });
        });
    });

    describe("MSIv1 claim allow-list (IMDS)", () => {
        afterEach(() => {
            delete ManagedIdentityClient["identitySource"];
            delete ManagedIdentityApplication["nodeStorage"];
            jest.restoreAllMocks();
        });

        it("succeeds for the allowed xms_az_nwperimid claim", async () => {
            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(systemAssignedConfig);

            const result: AuthenticationResult =
                await managedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                    clientClaims: VALID_NSP_CLAIM,
                });
            expect(result.fromCache).toBe(false);
            expect(result.accessToken).toEqual(
                DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );
        });

        it("throws (naming xms_az_nwperimid) for an unsupported claim key", async () => {
            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(systemAssignedConfig);

            await expect(
                managedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                    clientClaims: UNSUPPORTED_CLAIM,
                })
            ).rejects.toMatchObject({
                errorCode: ManagedIdentityErrorCodes.msiV1UnsupportedClaim,
                errorMessage:
                    ManagedIdentityErrorMessages[
                        ManagedIdentityErrorCodes.msiV1UnsupportedClaim
                    ],
            });
            expect(
                ManagedIdentityErrorMessages[
                    ManagedIdentityErrorCodes.msiV1UnsupportedClaim
                ]
            ).toContain("xms_az_nwperimid");
        });

        it("throws for mixed claims even when xms_az_nwperimid is present", async () => {
            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(systemAssignedConfig);

            await expect(
                managedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                    clientClaims: MIXED_CLAIMS,
                })
            ).rejects.toMatchObject({
                errorCode: ManagedIdentityErrorCodes.msiV1UnsupportedClaim,
            });
        });

        it("throws invalidClaims for clientClaims that is not valid JSON", async () => {
            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(systemAssignedConfig);

            await expect(
                managedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                    clientClaims: "not-json",
                })
            ).rejects.toMatchObject({
                errorCode: ClientConfigurationErrorCodes.invalidClaims,
            });
        });

        it("throws invalidClaims for clientClaims that is valid JSON but not an object", async () => {
            const managedIdentityApplication: ManagedIdentityApplication =
                new ManagedIdentityApplication(systemAssignedConfig);

            await expect(
                managedIdentityApplication.acquireToken({
                    resource: MANAGED_IDENTITY_RESOURCE,
                    clientClaims: `["xms_az_nwperimid"]`,
                })
            ).rejects.toMatchObject({
                errorCode: ClientConfigurationErrorCodes.invalidClaims,
            });
        });
    });

    describe("non-IMDS sources reject clientClaims", () => {
        const nonImdsSources: Array<{
            name: ManagedIdentitySourceNames;
            env: Record<string, string>;
        }> = [
            {
                name: ManagedIdentitySourceNames.APP_SERVICE,
                env: {
                    [ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT]:
                        "fake_IDENTITY_ENDPOINT",
                    [ManagedIdentityEnvironmentVariableNames.IDENTITY_HEADER]:
                        "fake_IDENTITY_HEADER",
                },
            },
            {
                name: ManagedIdentitySourceNames.MACHINE_LEARNING,
                env: {
                    [ManagedIdentityEnvironmentVariableNames.MSI_ENDPOINT]:
                        "fake_MSI_ENDPOINT",
                    [ManagedIdentityEnvironmentVariableNames.MSI_SECRET]:
                        "fake_MSI_SECRET",
                },
            },
            {
                name: ManagedIdentitySourceNames.CLOUD_SHELL,
                env: {
                    [ManagedIdentityEnvironmentVariableNames.MSI_ENDPOINT]:
                        "fake_MSI_ENDPOINT",
                },
            },
        ];

        afterEach(() => {
            delete process.env[
                ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT
            ];
            delete process.env[
                ManagedIdentityEnvironmentVariableNames.IDENTITY_HEADER
            ];
            delete process.env[
                ManagedIdentityEnvironmentVariableNames.MSI_ENDPOINT
            ];
            delete process.env[
                ManagedIdentityEnvironmentVariableNames.MSI_SECRET
            ];
            delete ManagedIdentityClient["identitySource"];
            delete ManagedIdentityApplication["nodeStorage"];
            jest.restoreAllMocks();
        });

        it.each(nonImdsSources)(
            "throws clientClaimsUnsupportedSource (naming IMDS) for the $name source",
            async ({ name, env }) => {
                Object.entries(env).forEach(([key, value]) => {
                    process.env[key] = value;
                });

                const managedIdentityApplication: ManagedIdentityApplication =
                    new ManagedIdentityApplication(systemAssignedConfig);
                expect(
                    managedIdentityApplication.getManagedIdentitySource()
                ).toBe(name);

                await expect(
                    managedIdentityApplication.acquireToken({
                        resource: MANAGED_IDENTITY_RESOURCE,
                        clientClaims: NSP_CLAIMS,
                    })
                ).rejects.toMatchObject({
                    errorCode:
                        ManagedIdentityErrorCodes.clientClaimsUnsupportedSource,
                    errorMessage:
                        ManagedIdentityErrorMessages[
                            ManagedIdentityErrorCodes
                                .clientClaimsUnsupportedSource
                        ],
                });
                expect(
                    ManagedIdentityErrorMessages[
                        ManagedIdentityErrorCodes.clientClaimsUnsupportedSource
                    ]
                ).toContain("IMDS");
            }
        );
    });
});

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Logger,
    NetworkRequestOptions,
    NetworkResponse,
    HttpStatus,
} from "@azure/msal-common";
import { networkClient } from "../../test_kit/ManagedIdentityTestUtils.js";
import { DefaultManagedIdentityRetryPolicy } from "../../../src/retry/DefaultManagedIdentityRetryPolicy.js";
import { ONE_HUNDRED_TIMES_FASTER } from "../../test_kit/StringConstants.js";
import { ManagedIdentityApplication } from "../../../src/client/ManagedIdentityApplication.js";
import { ManagedIdentityClient } from "../../../src/client/ManagedIdentityClient.js";
import { ManagedIdentitySourceNames } from "../../../src/utils/Constants.js";
import {
    CREDENTIAL_PATH,
    CredentialEndpointProbeResponse,
} from "../../../src/client/ManagedIdentitySources/ImdsV2.js";
import { Imds } from "../../../src/client/ManagedIdentitySources/Imds.js";

describe("ImdsV2", () => {
    const validatedCredentialEndpoint: string = Imds.getValidatedEndpoint(
        CREDENTIAL_PATH,
        new Logger({})
    );

    const credentialEndpointProbeResponse: CredentialEndpointProbeResponse = {
        error: "credential_endpoint_probe_error",
        error_description: "credential_endpoint_probe_error_description",
    };

    const mockSendPostRequestAsync = (serverHeader: string, status: number) => {
        const response: NetworkResponse<CredentialEndpointProbeResponse> = {
            headers: { server: serverHeader },
            body: credentialEndpointProbeResponse,
            status,
        };

        jest.spyOn(networkClient, "sendPostRequestAsync").mockImplementation(((
            url: string,
            _options?: NetworkRequestOptions
        ) => {
            if (url === validatedCredentialEndpoint) {
                return Promise.resolve(response);
            }
            throw new Error(
                "An invalid url was used in the tests' post request"
            );
        }) as typeof networkClient.sendPostRequestAsync);
        // Type assertion is needed because sendPostRequestAsync is a generic method.
        // Jest's mockImplementation does not infer generics, so we cast to the method's type
        // to ensure the mock matches the original signature and TypeScript type checks correctly.
    };

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
        delete ManagedIdentityClient["identitySource"];
        delete ManagedIdentityClient["sourceName"];
        delete ManagedIdentityApplication["nodeStorage"];
        jest.restoreAllMocks();
    });

    describe("isCredentialEndpointAvailable Tests", () => {
        describe("isCredentialEndpointAvailable returns true", () => {
            test("probe response is 400 with valid version", async () => {
                mockSendPostRequestAsync(
                    "IMDS/1.1.1.2222",
                    HttpStatus.BAD_REQUEST
                );

                const managedIdentityApplication =
                    new ManagedIdentityApplication({
                        system: {
                            networkClient,
                        },
                    });

                expect(
                    await managedIdentityApplication.getManagedIdentitySource()
                ).toBe(ManagedIdentitySourceNames.IMDSV2);
            });
        });

        describe("isCredentialEndpointAvailable returns false", () => {
            test("probe response is 400 with invalid version", async () => {
                mockSendPostRequestAsync(
                    "IMDS/1.1.1.1111",
                    HttpStatus.BAD_REQUEST
                );

                const managedIdentityApplication =
                    new ManagedIdentityApplication({
                        system: {
                            networkClient,
                        },
                    });

                expect(
                    await managedIdentityApplication.getManagedIdentitySource()
                ).toBe(ManagedIdentitySourceNames.DEFAULT_TO_IMDS);
            });

            test("probe response is 400 but the server header is missing", async () => {
                mockSendPostRequestAsync("", HttpStatus.BAD_REQUEST);

                const managedIdentityApplication =
                    new ManagedIdentityApplication({
                        system: {
                            networkClient,
                        },
                    });

                expect(
                    await managedIdentityApplication.getManagedIdentitySource()
                ).toBe(ManagedIdentitySourceNames.DEFAULT_TO_IMDS);
            });

            test("probe response is not 400 or 500", async () => {
                mockSendPostRequestAsync(
                    "IMDS/1.1.1.2222",
                    HttpStatus.NOT_FOUND
                );

                const managedIdentityApplication =
                    new ManagedIdentityApplication({
                        system: {
                            networkClient,
                        },
                    });

                expect(
                    await managedIdentityApplication.getManagedIdentitySource()
                ).toBe(ManagedIdentitySourceNames.DEFAULT_TO_IMDS);
            });
        });
        describe("isCredentialEndpointAvailable network request retries", () => {
            test("getManagedIdentitySource returns IMDSV2 after retrying on retriable status code", async () => {
                const timeStart = new Date();
                let attempts = 0;

                jest.spyOn(
                    networkClient,
                    "sendPostRequestAsync"
                ).mockImplementation(((
                    url: string,
                    _options?: NetworkRequestOptions
                ) => {
                    attempts++;
                    if (attempts <= 2) {
                        return Promise.resolve({
                            headers: {},
                            body: credentialEndpointProbeResponse,
                            status: HttpStatus.NOT_FOUND,
                        });
                    }
                    return Promise.resolve({
                        headers: { server: "IMDS/1.1.1.2222" },
                        body: credentialEndpointProbeResponse,
                        status: HttpStatus.BAD_REQUEST,
                    });
                }) as typeof networkClient.sendPostRequestAsync);

                const managedIdentityApplication =
                    new ManagedIdentityApplication({
                        system: {
                            networkClient,
                        },
                    });

                const result =
                    await managedIdentityApplication.getManagedIdentitySource();
                const timeEnd = new Date();

                expect(result).toBe(ManagedIdentitySourceNames.IMDSV2);
                expect(attempts).toBe(3);
                expect(
                    timeEnd.valueOf() - timeStart.valueOf()
                ).toBeGreaterThanOrEqual(
                    DefaultManagedIdentityRetryPolicy.DEFAULT_MANAGED_IDENTITY_RETRY_DELAY_MS *
                        2 * // two retries
                        ONE_HUNDRED_TIMES_FASTER
                );
            });

            /**test("getManagedIdentitySource returns DEFAULT_TO_IMDS after maximum retry attempts", async () => {
                mockSendPostRequestAsync("", HttpStatus.GONE);

                const managedIdentityApplication = new ManagedIdentityApplication({
                    system: {
                        networkClient,
                    },
                });

                expect(
                    await managedIdentityApplication.getManagedIdentitySource()
                ).toBe(ManagedIdentitySourceNames.DEFAULT_TO_IMDS);
            });*/
        });
    });
});

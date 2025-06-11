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

    const mockSendPostRequestAsync = (
        status: number,
        serverHeader?: string
    ) => {
        const response: NetworkResponse<CredentialEndpointProbeResponse> = {
            headers: serverHeader ? { server: serverHeader } : {},
            body: credentialEndpointProbeResponse,
            status,
        };

        const sendPostRequestAsyncSpy: jest.SpyInstance = jest
            .spyOn(networkClient, "sendPostRequestAsync")
            .mockImplementation(((
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

        return sendPostRequestAsyncSpy;
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
        test("returns true when probe response is 400 with valid version", async () => {
            mockSendPostRequestAsync(HttpStatus.BAD_REQUEST, "IMDS/1.1.1.2222");

            const managedIdentityApplication = new ManagedIdentityApplication({
                system: {
                    networkClient,
                },
            });

            expect(
                await managedIdentityApplication.getManagedIdentitySource()
            ).toBe(ManagedIdentitySourceNames.IMDSV2);
        });

        test("returns false when probe response is 400 with invalid version", async () => {
            mockSendPostRequestAsync(HttpStatus.BAD_REQUEST, "IMDS/1.1.1.1111");

            const managedIdentityApplication = new ManagedIdentityApplication({
                system: {
                    networkClient,
                },
            });

            expect(
                await managedIdentityApplication.getManagedIdentitySource()
            ).toBe(ManagedIdentitySourceNames.DEFAULT_TO_IMDS);
        });

        test("returns false when probe response is 400 but the server header is missing", async () => {
            mockSendPostRequestAsync(HttpStatus.BAD_REQUEST);

            const managedIdentityApplication = new ManagedIdentityApplication({
                system: {
                    networkClient,
                },
            });

            expect(
                await managedIdentityApplication.getManagedIdentitySource()
            ).toBe(ManagedIdentitySourceNames.DEFAULT_TO_IMDS);
        });

        test("returns false when probe response is not 400 or 500", async () => {
            const sendPostRequestSpy: jest.SpyInstance =
                mockSendPostRequestAsync(
                    HttpStatus.SUCCESS, // TODO: change this to NOT_FOUND after implementing the credential endpoint probe retry policy
                    "IMDS/1.1.1.2222"
                );

            const managedIdentityApplication = new ManagedIdentityApplication({
                system: {
                    networkClient,
                },
            });

            expect(
                await managedIdentityApplication.getManagedIdentitySource()
            ).toBe(ManagedIdentitySourceNames.DEFAULT_TO_IMDS);
            expect(sendPostRequestSpy).toHaveBeenCalledTimes(1); // initial request + 0 retries
        });

        test("returns true after retrying on retriable status code", async () => {
            const sendPostRequestSpy: jest.SpyInstance =
                mockSendPostRequestAsync(
                    HttpStatus.BAD_REQUEST,
                    "IMDS/1.1.1.2222"
                )
                    .mockReturnValueOnce(
                        Promise.resolve({
                            headers: {},
                            body: credentialEndpointProbeResponse,
                            status: HttpStatus.SERVER_ERROR,
                        })
                    )
                    // second retry, will trigger third retry
                    .mockReturnValueOnce(
                        Promise.resolve({
                            headers: {},
                            body: credentialEndpointProbeResponse,
                            status: HttpStatus.SERVER_ERROR,
                        })
                    );

            const managedIdentityApplication = new ManagedIdentityApplication({
                system: {
                    networkClient,
                },
            });

            expect(
                await managedIdentityApplication.getManagedIdentitySource()
            ).toBe(ManagedIdentitySourceNames.IMDSV2);
            expect(sendPostRequestSpy).toHaveBeenCalledTimes(3); // initial request + 2 retries
        });

        test("returns false after after maximum retry attempts", async () => {
            const sendPostRequestSpy: jest.SpyInstance =
                mockSendPostRequestAsync(HttpStatus.SERVER_ERROR);

            const managedIdentityApplication = new ManagedIdentityApplication({
                system: {
                    networkClient,
                },
            });

            expect(
                await managedIdentityApplication.getManagedIdentitySource()
            ).toBe(ManagedIdentitySourceNames.DEFAULT_TO_IMDS);
            expect(sendPostRequestSpy).toHaveBeenCalledTimes(4); // initial request + 3 retries
        });
    });
});

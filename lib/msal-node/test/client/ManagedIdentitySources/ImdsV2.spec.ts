/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { HttpStatus } from "@azure/msal-common";
import {
    credentialEndpointProbeResponse,
    mockCredentialEndpointProbeRequest,
    networkClient,
} from "../../test_kit/ManagedIdentityTestUtils.js";
import { DefaultManagedIdentityRetryPolicy } from "../../../src/retry/DefaultManagedIdentityRetryPolicy.js";
import { ONE_HUNDRED_TIMES_FASTER } from "../../test_kit/StringConstants.js";
import { ManagedIdentityApplication } from "../../../src/client/ManagedIdentityApplication.js";
import { ManagedIdentityClient } from "../../../src/client/ManagedIdentityClient.js";
import { ManagedIdentitySourceNames } from "../../../src/utils/Constants.js";

describe("ImdsV2", () => {
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

    describe("isCredentialEndpointAvailable", () => {
        describe("returns true", () => {
            test("when probe response is 400 with valid version", async () => {
                mockCredentialEndpointProbeRequest(
                    HttpStatus.BAD_REQUEST,
                    "IMDS/1.1.1.2222"
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

            test("after retrying on retriable status code", async () => {
                const sendPostRequestSpy: jest.SpyInstance =
                    mockCredentialEndpointProbeRequest(
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

                const managedIdentityApplication =
                    new ManagedIdentityApplication({
                        system: {
                            networkClient,
                        },
                    });

                expect(
                    await managedIdentityApplication.getManagedIdentitySource()
                ).toBe(ManagedIdentitySourceNames.IMDSV2);
                expect(sendPostRequestSpy).toHaveBeenCalledTimes(3); // initial request + 2 retries
            });
        });

        describe("returns false", () => {
            test("when probe response is 400 with invalid version", async () => {
                mockCredentialEndpointProbeRequest(
                    HttpStatus.BAD_REQUEST,
                    "IMDS/1.1.1.1111"
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

            test("when probe response is 400 but the server header is missing", async () => {
                mockCredentialEndpointProbeRequest(HttpStatus.BAD_REQUEST);

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

            test("when probe response is not 400 or 500", async () => {
                const sendPostRequestSpy: jest.SpyInstance =
                    mockCredentialEndpointProbeRequest(
                        HttpStatus.SUCCESS // TODO: change this to NOT_FOUND after implementing the credential endpoint probe retry policy
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
                expect(sendPostRequestSpy).toHaveBeenCalledTimes(1); // initial request + 0 retries
            });

            test("after maximum retry attempts", async () => {
                const sendPostRequestSpy: jest.SpyInstance =
                    mockCredentialEndpointProbeRequest(HttpStatus.SERVER_ERROR);

                const managedIdentityApplication =
                    new ManagedIdentityApplication({
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
});

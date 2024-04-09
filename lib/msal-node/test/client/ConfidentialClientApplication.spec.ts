/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthorizationCodeClient,
    RefreshTokenClient,
    AuthenticationResult,
    OIDC_DEFAULT_SCOPES,
    CommonClientCredentialRequest,
    createClientAuthError,
    ClientAuthErrorCodes,
} from "@azure/msal-common";
import { TEST_CONSTANTS } from "../utils/TestConstants";
import {
    AuthError,
    ConfidentialClientApplication,
    OnBehalfOfRequest,
    UsernamePasswordRequest,
    ClientCredentialRequest,
    Configuration,
    AuthorizationCodeRequest,
    ClientCredentialClient,
    RefreshTokenRequest,
} from "../../src";

import * as msalNode from "../../src";
import { getMsalCommonAutoMock, MSALCommonModule } from "../utils/MockUtils";
import {
    CAE_CONSTANTS,
    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT,
} from "../test_kit/StringConstants";
import { mockNetworkClient } from "../utils/MockNetworkClient";

const msalCommon: MSALCommonModule = jest.requireActual("@azure/msal-common");

jest.mock("../../src/client/ClientCredentialClient");
jest.mock("../../src/client/OnBehalfOfClient");
jest.mock("../../src/client/UsernamePasswordClient");

describe("ConfidentialClientApplication", () => {
    let appConfig: Configuration = {
        auth: {
            clientId: TEST_CONSTANTS.CLIENT_ID,
            authority: TEST_CONSTANTS.AUTHORITY,
            clientSecret: TEST_CONSTANTS.CLIENT_SECRET,
        },
    };

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("exports a class", () => {
        const authApp = new ConfidentialClientApplication(appConfig);
        expect(authApp).toBeInstanceOf(ConfidentialClientApplication);
    });

    describe("auth code flow", () => {
        test("acquireTokenByAuthorizationCode", async () => {
            const request: AuthorizationCodeRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                redirectUri: TEST_CONSTANTS.REDIRECT_URI,
                code: TEST_CONSTANTS.AUTHORIZATION_CODE,
            };

            const mockAuthCodeClientInstance = {
                includeRedirectUri: false,
                acquireToken: jest.fn(),
            };
            jest.spyOn(
                msalCommon,
                "AuthorizationCodeClient"
            ).mockImplementation(
                () =>
                    mockAuthCodeClientInstance as unknown as AuthorizationCodeClient
            );

            const authApp = new ConfidentialClientApplication(appConfig);
            await authApp.acquireTokenByCode(request);
            expect(AuthorizationCodeClient).toHaveBeenCalledTimes(1);
        });

        describe("CAE, claims and client capabilities", () => {
            let createTokenRequestBodySpy: jest.SpyInstance;
            let client: ConfidentialClientApplication;
            let authorizationCodeRequest: AuthorizationCodeRequest;
            beforeEach(() => {
                createTokenRequestBodySpy = jest.spyOn(
                    AuthorizationCodeClient.prototype,
                    <any>"createTokenRequestBody"
                );

                const config: Configuration = {
                    auth: {
                        clientId: TEST_CONSTANTS.CLIENT_ID,
                        authority: TEST_CONSTANTS.AUTHORITY,
                        clientSecret: TEST_CONSTANTS.CLIENT_SECRET,
                        clientCapabilities: ["cp1", "cp2"],
                    },
                    system: {
                        networkClient: mockNetworkClient(
                            {}, // not needed
                            CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT
                        ),
                    },
                };
                client = new ConfidentialClientApplication(config);

                authorizationCodeRequest = {
                    scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                    redirectUri: TEST_CONSTANTS.REDIRECT_URI,
                    code: TEST_CONSTANTS.AUTHORIZATION_CODE,
                };
            });

            it.each([
                [CAE_CONSTANTS.EMPTY_CLAIMS, CAE_CONSTANTS.MERGED_EMPTY_CLAIMS],
                [
                    CAE_CONSTANTS.CLAIMS_WITH_ADDITIONAL_CLAIMS,
                    CAE_CONSTANTS.MERGED_CLAIMS_WITH_ADDITIONAL_CLAIMS,
                ],
                [
                    CAE_CONSTANTS.CLAIMS_WITH_ADDITIONAL_KEY,
                    CAE_CONSTANTS.MERGED_CLAIMS_WITH_ADDITIONAL_KEY,
                ],
                [
                    CAE_CONSTANTS.CLAIM_WITH_ADDITIONAL_KEY_AND_ACCESS_KEY,
                    CAE_CONSTANTS.MERGED_CLAIM_WITH_ADDITIONAL_KEY_AND_ACCESS_KEY,
                ],
            ])(
                "Validates that claims and client capabilities are correctly merged",
                async (claims, mergedClaims) => {
                    authorizationCodeRequest.claims = claims;
                    const authResult = (await client.acquireTokenByCode(
                        authorizationCodeRequest
                    )) as AuthenticationResult;
                    expect(authResult.accessToken).toEqual(
                        CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body
                            .access_token
                    );

                    const returnVal: string = (await createTokenRequestBodySpy
                        .mock.results[0].value) as string;
                    expect(
                        decodeURIComponent(
                            returnVal
                                .split("&")
                                .filter((key: string) =>
                                    key.includes("claims=")
                                )[0]
                                .split("claims=")[1]
                        )
                    ).toEqual(mergedClaims);

                    // skip cache lookup verification because acquireTokenByCode does not pull elements from the cache
                }
            );
        });
    });

    test("acquireTokenByRefreshToken", async () => {
        const request: RefreshTokenRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            refreshToken: TEST_CONSTANTS.REFRESH_TOKEN,
        };

        const { RefreshTokenClient: mockRefreshTokenClient } =
            getMsalCommonAutoMock();

        jest.spyOn(msalCommon, "RefreshTokenClient").mockImplementation(
            (conf) => new mockRefreshTokenClient(conf)
        );

        const fakeAuthResult = {};
        jest.spyOn(
            mockRefreshTokenClient.prototype,
            "acquireToken"
        ).mockImplementation(() =>
            Promise.resolve(fakeAuthResult as unknown as AuthenticationResult)
        );

        const authApp = new ConfidentialClientApplication(appConfig);
        await authApp.acquireTokenByRefreshToken(request);
        expect(RefreshTokenClient).toHaveBeenCalledTimes(1);
    });

    test("acquireTokenByClientCredential", async () => {
        // @ts-ignore
        const testProvider: msalCommon.IAppTokenProvider = () => {
            // @ts-ignore
            return new Promise<msalCommon.AppTokenProviderResult>((resolve) =>
                resolve({
                    accessToken: "accessToken",
                    expiresInSeconds: 3601,
                    refreshInSeconds: 1801,
                })
            );
        };

        const configWithExtensibility: Configuration = {
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID,
                authority: TEST_CONSTANTS.AUTHORITY,
                clientAssertion: () => "testAssertion",
            },
        };

        const request: ClientCredentialRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            skipCache: false,
        };

        const authApp = new ConfidentialClientApplication(
            configWithExtensibility
        );
        authApp.SetAppTokenProvider(testProvider);

        await authApp.acquireTokenByClientCredential(request);
        expect(ClientCredentialClient).toHaveBeenCalledTimes(1);
    });

    test("acquireTokenByClientCredential with client assertion", async () => {
        const request: ClientCredentialRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            skipCache: false,
            clientAssertion: () => "testAssertion",
        };

        ClientCredentialClient.prototype.acquireToken = jest.fn(
            (request: CommonClientCredentialRequest) => {
                expect(request.clientAssertion).not.toBe(undefined);
                expect(request.clientAssertion?.assertion).toBe(
                    "testAssertion"
                );
                expect(request.clientAssertion?.assertionType).toBe(
                    "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
                );
                return Promise.resolve(null);
            }
        );

        const authApp = new ConfidentialClientApplication(appConfig);
        await authApp.acquireTokenByClientCredential(request);
    });

    test("acquireTokenOnBehalfOf", async () => {
        const request: OnBehalfOfRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            oboAssertion: TEST_CONSTANTS.ACCESS_TOKEN,
        };

        const onBehalfOfClientSpy = jest.spyOn(msalNode, "OnBehalfOfClient");

        const authApp = new ConfidentialClientApplication(appConfig);
        await authApp.acquireTokenOnBehalfOf(request);
        expect(onBehalfOfClientSpy).toHaveBeenCalledTimes(1);
    });

    test("acquireTokenByUsernamePassword", async () => {
        const request: UsernamePasswordRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            username: TEST_CONSTANTS.USERNAME,
            password: TEST_CONSTANTS.PASSWORD,
        };

        const usernamePasswordClientSpy = jest.spyOn(
            msalNode,
            "UsernamePasswordClient"
        );

        const authApp = new ConfidentialClientApplication(appConfig);
        await authApp.acquireTokenByUsernamePassword(request);
        expect(usernamePasswordClientSpy).toHaveBeenCalledTimes(1);
    });

    test('acquireTokenByClientCredential throws missingTenantIdError if "common", ""organization", or "consumers" was provided as the tenant id', async () => {
        // @ts-ignore
        const testProvider: msalCommon.IAppTokenProvider = () => {
            // @ts-ignore
            return new Promise<msalCommon.AppTokenProviderResult>((resolve) =>
                resolve({
                    accessToken: "accessToken",
                    expiresInSeconds: 3601,
                    refreshInSeconds: 1801,
                })
            );
        };

        const appConfig: Configuration = {
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID,
                authority: TEST_CONSTANTS.DEFAULT_AUTHORITY, // contains "common"
                clientAssertion: () => "testAssertion",
            },
        };

        const request: ClientCredentialRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            skipCache: false,
        };

        const authApp = new ConfidentialClientApplication(appConfig);
        authApp.SetAppTokenProvider(testProvider);

        await expect(
            authApp.acquireTokenByClientCredential(request)
        ).rejects.toMatchObject(
            createClientAuthError(ClientAuthErrorCodes.missingTenantIdError)
        );
    });

    test("acquireTokenByClientCredential handles AuthErrors as expected", async () => {
        const request: ClientCredentialRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            skipCache: false,
        };

        jest.spyOn(AuthError.prototype, "setCorrelationId");

        jest.spyOn(
            ClientCredentialClient.prototype,
            "acquireToken"
        ).mockImplementation(() => {
            throw new AuthError();
        });

        try {
            const authApp = new ConfidentialClientApplication(appConfig);
            await authApp.acquireTokenByClientCredential(request);
        } catch (e) {
            expect(e).toBeInstanceOf(AuthError);
            expect(AuthError.prototype.setCorrelationId).toHaveBeenCalledTimes(
                1
            );
        }
    });

    test("acquireTokenByClientCredential request does not contain OIDC scopes", async () => {
        const request: ClientCredentialRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            skipCache: false,
        };

        jest.spyOn(
            ClientCredentialClient.prototype,
            "acquireToken"
        ).mockImplementation((request: CommonClientCredentialRequest) => {
            OIDC_DEFAULT_SCOPES.forEach((scope: string) => {
                expect(request.scopes).not.toContain(scope);
            });
            return Promise.resolve(null);
        });

        const authApp = new ConfidentialClientApplication(appConfig);
        await authApp.acquireTokenByClientCredential(request);
    });
});

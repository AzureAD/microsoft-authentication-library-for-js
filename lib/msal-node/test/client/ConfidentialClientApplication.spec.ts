/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthorizationCodeClient,
    AuthenticationResult,
    OIDC_DEFAULT_SCOPES,
    CommonClientCredentialRequest,
    createClientAuthError,
    ClientAuthErrorCodes,
    AccountEntity,
    AccountInfo,
    createInteractionRequiredAuthError,
    InteractionRequiredAuthErrorCodes,
    ClientAssertion,
} from "@azure/msal-common";
import {
    DEFAULT_OPENID_CONFIG_RESPONSE,
    ID_TOKEN_CLAIMS,
    TEST_CONSTANTS,
} from "../utils/TestConstants.js";
import {
    ConfidentialClientApplication,
    OnBehalfOfRequest,
    UsernamePasswordRequest,
    ClientCredentialRequest,
    Configuration,
    AuthorizationCodeRequest,
    ClientCredentialClient,
    RefreshTokenRequest,
    SilentFlowRequest,
    ClientApplication,
} from "../../src/index.js";
import {
    CAE_CONSTANTS,
    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT,
    TEST_CONFIG,
    TEST_TOKENS,
} from "../test_kit/StringConstants.js";
import { mockNetworkClient } from "../utils/MockNetworkClient.js";
import {
    ClientTestUtils,
    getClientAssertionCallback,
} from "./ClientTestUtils.js";
import { buildAccountFromIdTokenClaims } from "msal-test-utils";
import { Constants, MSAL_FORCE_REGION } from "../../src/utils/Constants.js";
import jwt from "jsonwebtoken";
import { NodeAuthError } from "../../src/error/NodeAuthError.js";
import { INetworkModule } from "../../../msal-common/lib/types/exports-common.js";

jest.mock("jsonwebtoken");

describe("ConfidentialClientApplication", () => {
    beforeAll(() => {
        jest.spyOn(jwt, <any>"sign").mockReturnValue("fake_jwt_string");
    });

    const networkClient: INetworkModule = mockNetworkClient(
        DEFAULT_OPENID_CONFIG_RESPONSE.body,
        CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT
    );

    let config: Configuration;
    beforeEach(async () => {
        config =
            await ClientTestUtils.createTestConfidentialClientConfiguration(
                undefined,
                networkClient
            );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("exports a class", () => {
        const client: ConfidentialClientApplication =
            new ConfidentialClientApplication(config);
        expect(client).toBeInstanceOf(ConfidentialClientApplication);
    });

    test("optional NodeAuthOptions values that are passed in as undefined will not break the application", () => {
        let client: ConfidentialClientApplication;

        // clientCertificate is already set, by default
        config.auth.clientSecret = undefined;
        client = new ConfidentialClientApplication(config);
        expect(client).toBeInstanceOf(ConfidentialClientApplication);

        config.auth.clientSecret = "secret";
        config.auth.clientCertificate = undefined;
        client = new ConfidentialClientApplication(config);
        expect(client).toBeInstanceOf(ConfidentialClientApplication);

        // clientSecret defined above
        config.auth.clientAssertion = undefined;
        client = new ConfidentialClientApplication(config);
        expect(client).toBeInstanceOf(ConfidentialClientApplication);
    });

    describe("auth code flow", () => {
        test("acquireTokenByAuthorizationCode", async () => {
            const acquireTokenByCodeSpy: jest.SpyInstance = jest.spyOn(
                ClientApplication.prototype,
                <any>"acquireTokenByCode"
            );

            const request: AuthorizationCodeRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                redirectUri: TEST_CONSTANTS.REDIRECT_URI,
                code: TEST_CONSTANTS.AUTHORIZATION_CODE,
            };

            const client: ConfidentialClientApplication =
                new ConfidentialClientApplication(config);

            const authResult = (await client.acquireTokenByCode(
                request
            )) as AuthenticationResult;
            expect(authResult.accessToken).toEqual(
                CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
            );
            expect(acquireTokenByCodeSpy).toHaveBeenCalledTimes(1);
        });

        describe("CAE, claims and client capabilities", () => {
            let createTokenRequestBodySpy: jest.SpyInstance;
            let client: ConfidentialClientApplication;
            let authorizationCodeRequest: AuthorizationCodeRequest;
            beforeEach(async () => {
                createTokenRequestBodySpy = jest.spyOn(
                    AuthorizationCodeClient.prototype,
                    <any>"createTokenRequestBody"
                );

                const config: Configuration =
                    await ClientTestUtils.createTestConfidentialClientConfiguration(
                        ["cp1", "cp2"],
                        mockNetworkClient(
                            {}, // not needed
                            CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT
                        )
                    );
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
                    // acquire a token with a client that has client capabilities, but no claims in the request
                    // verify that it comes from the IDP
                    const authResult = (await client.acquireTokenByCode(
                        authorizationCodeRequest
                    )) as AuthenticationResult;
                    expect(authResult.accessToken).toEqual(
                        CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body
                            .access_token
                    );
                    expect(authResult.fromCache).toBe(false);

                    // verify that the client capabilities have been merged with the (empty) claims
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
                    ).toEqual(CAE_CONSTANTS.MERGED_EMPTY_CLAIMS);

                    // skip cache lookup verification because acquireTokenByCode does not pull elements from the cache

                    // acquire a token with a client that has client capabilities, and has claims in the request
                    // verify that it comes from the IDP
                    authorizationCodeRequest.claims = claims;
                    const authResult2 = (await client.acquireTokenByCode(
                        authorizationCodeRequest
                    )) as AuthenticationResult;
                    expect(authResult2.accessToken).toEqual(
                        CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body
                            .access_token
                    );
                    expect(authResult2.fromCache).toBe(false);

                    // verify that the client capabilities have been merged with the claims
                    const returnVal2: string = (await createTokenRequestBodySpy
                        .mock.results[1].value) as string;
                    expect(
                        decodeURIComponent(
                            returnVal2
                                .split("&")
                                .filter((key: string) =>
                                    key.includes("claims=")
                                )[0]
                                .split("claims=")[1]
                        )
                    ).toEqual(mergedClaims);
                }
            );
        });
    });

    test("acquireTokenBySilentFlow", async () => {
        const acquireTokenSilentSpy: jest.SpyInstance = jest.spyOn(
            ClientApplication.prototype,
            <any>"acquireTokenSilent"
        );

        const testAccountEntity: AccountEntity =
            buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS);

        const testAccount: AccountInfo = {
            ...testAccountEntity.getAccountInfo(),
            idTokenClaims: ID_TOKEN_CLAIMS,
            idToken: TEST_TOKENS.IDTOKEN_V2,
        };

        const request: SilentFlowRequest = {
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            account: testAccount,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            forceRefresh: false,
        };

        const client: ConfidentialClientApplication =
            new ConfidentialClientApplication(config);

        await expect(client.acquireTokenSilent(request)).rejects.toMatchObject(
            createInteractionRequiredAuthError(
                InteractionRequiredAuthErrorCodes.noTokensFound
            )
        );
        expect(acquireTokenSilentSpy).toHaveBeenCalledTimes(1);
    });

    test("acquireTokenByRefreshToken", async () => {
        const acquireTokenByRefreshTokenSpy: jest.SpyInstance = jest.spyOn(
            ClientApplication.prototype,
            <any>"acquireTokenByRefreshToken"
        );

        const request: RefreshTokenRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            refreshToken: TEST_CONSTANTS.REFRESH_TOKEN,
        };

        const client: ConfidentialClientApplication =
            new ConfidentialClientApplication(config);

        const authResult = (await client.acquireTokenByRefreshToken(
            request
        )) as AuthenticationResult;
        expect(authResult.accessToken).toEqual(
            CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
        );
        expect(acquireTokenByRefreshTokenSpy).toHaveBeenCalledTimes(1);
    });

    describe("client credential flow", () => {
        test("acquireTokenByClientCredential", async () => {
            const acquireTokenByClientCredentialSpy: jest.SpyInstance =
                jest.spyOn(
                    ConfidentialClientApplication.prototype,
                    <any>"acquireTokenByClientCredential"
                );

            const request: ClientCredentialRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                skipCache: false,
            };

            const client: ConfidentialClientApplication =
                new ConfidentialClientApplication(config);

            const authResult = (await client.acquireTokenByClientCredential(
                request
            )) as AuthenticationResult;
            expect(authResult.accessToken).toEqual(
                CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
            );
            expect(acquireTokenByClientCredentialSpy).toHaveBeenCalledTimes(1);
        });

        describe("clientAssertion is used to acquire a token after being provided in the request", () => {
            beforeEach(() => {
                jest.spyOn(
                    ClientCredentialClient.prototype,
                    "acquireToken"
                ).mockImplementation(
                    (request: CommonClientCredentialRequest) => {
                        expect(request.clientAssertion).not.toBe(undefined);
                        expect(request.clientAssertion?.assertion).toBe(
                            TEST_CONFIG.TEST_REQUEST_ASSERTION
                        );
                        expect(request.clientAssertion?.assertionType).toBe(
                            Constants.JWT_BEARER_ASSERTION_TYPE
                        );
                        return Promise.resolve(null);
                    }
                );
            });

            it.each([
                TEST_CONFIG.TEST_REQUEST_ASSERTION,
                getClientAssertionCallback(TEST_CONFIG.TEST_REQUEST_ASSERTION),
            ])(
                "acquireTokenByClientCredential with client assertion",
                async (clientAssertion) => {
                    const request: ClientCredentialRequest = {
                        scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                        skipCache: false,
                        clientAssertion: clientAssertion,
                    };

                    const client: ConfidentialClientApplication =
                        new ConfidentialClientApplication(config);
                    await client.acquireTokenByClientCredential(request);
                }
            );
        });

        describe("region is determined correctly", () => {
            const checkRegion = (
                endpointFromSpy: string,
                expectedRegion: string
            ) => {
                const endpoint: string = endpointFromSpy;
                const regionMatch: Array<string> | null = endpoint.match(
                    "https://(.*).login.microsoft.com/tenantid/oauth2/v2.0/token/"
                );
                expect(regionMatch && regionMatch.length).toEqual(2);
                expect(regionMatch && regionMatch[1]).toEqual(expectedRegion);
            };

            let acquireTokenByClientCredentialSpy: jest.SpyInstance;
            let buildOauthClientConfigurationSpy: jest.SpyInstance;
            let sendPostRequestAsyncSpy: jest.SpyInstance;
            let client: ConfidentialClientApplication;
            let request: ClientCredentialRequest;
            beforeEach(() => {
                acquireTokenByClientCredentialSpy = jest.spyOn(
                    ConfidentialClientApplication.prototype,
                    <any>"acquireTokenByClientCredential"
                );

                buildOauthClientConfigurationSpy = jest.spyOn(
                    ConfidentialClientApplication.prototype,
                    <any>"buildOauthClientConfiguration"
                );

                sendPostRequestAsyncSpy = jest.spyOn(
                    networkClient,
                    <any>"sendPostRequestAsync"
                );

                client = new ConfidentialClientApplication(config);

                request = {
                    scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                    skipCache: false,
                };

                process.env[MSAL_FORCE_REGION] = "eastus";
            });

            afterEach(() => {
                delete process.env[MSAL_FORCE_REGION];
            });

            test("region is not passed in through the request, the MSAL_FORCE_REGION environment variable is used", async () => {
                const authResult = (await client.acquireTokenByClientCredential(
                    request
                )) as AuthenticationResult;
                expect(authResult.accessToken).toEqual(
                    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
                );
                expect(acquireTokenByClientCredentialSpy).toHaveBeenCalledTimes(
                    1
                );
                expect(
                    buildOauthClientConfigurationSpy.mock.lastCall[4]
                        .azureRegion
                ).toEqual(process.env[MSAL_FORCE_REGION]);

                checkRegion(
                    sendPostRequestAsyncSpy.mock.lastCall[0],
                    process.env[MSAL_FORCE_REGION] as string
                );
            });

            test("region is passed in through the request, the MSAL_FORCE_REGION environment variable is not used", async () => {
                const region = "westus";

                const authResult = (await client.acquireTokenByClientCredential(
                    { ...request, azureRegion: region }
                )) as AuthenticationResult;
                expect(authResult.accessToken).toEqual(
                    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
                );
                expect(acquireTokenByClientCredentialSpy).toHaveBeenCalledTimes(
                    1
                );
                expect(
                    buildOauthClientConfigurationSpy.mock.lastCall[4]
                        .azureRegion
                ).toEqual(region);

                checkRegion(sendPostRequestAsyncSpy.mock.lastCall[0], region);
            });

            test('region is not passed in through the request, the MSAL_FORCE_REGION environment variable is set to "DisableMsalForceRegion"', async () => {
                const authResult = (await client.acquireTokenByClientCredential(
                    { ...request, azureRegion: "DisableMsalForceRegion" }
                )) as AuthenticationResult;
                expect(authResult.accessToken).toEqual(
                    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
                );
                expect(acquireTokenByClientCredentialSpy).toHaveBeenCalledTimes(
                    1
                );
                expect(
                    buildOauthClientConfigurationSpy.mock.lastCall[4]
                        .azureRegion
                ).toBeUndefined();

                const endpoint: string =
                    sendPostRequestAsyncSpy.mock.lastCall[0];
                const regionMatch: Array<string> | null = endpoint.match(
                    "https://(.*).login.microsoft.com/tenantid/oauth2/v2.0/token/"
                );
                expect(regionMatch).toBeNull();
            });
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

            const client: ConfidentialClientApplication =
                new ConfidentialClientApplication(config);

            // this request will fail because ClientCredentialClient's acquireToken is mocked
            // so that the scopes can be examined
            await client.acquireTokenByClientCredential(request);
        });

        test('acquireTokenByClientCredential throws missingTenantIdError if "common", ""organization", or "consumers" was provided as the tenant id', async () => {
            const request: ClientCredentialRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                skipCache: false,
            };

            config.auth.authority = TEST_CONSTANTS.DEFAULT_AUTHORITY; // contains "common"
            const client: ConfidentialClientApplication =
                new ConfidentialClientApplication(config);

            await expect(
                client.acquireTokenByClientCredential(request)
            ).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.missingTenantIdError)
            );
        });

        test("ensures that developer-provided certificate can be provided with a SHA-256 thumbprint, and is attached to client assertion", async () => {
            const getClientAssertionSpy: jest.SpyInstance = jest.spyOn(
                ClientApplication.prototype,
                <any>"getClientAssertion"
            );

            const client: ConfidentialClientApplication =
                new ConfidentialClientApplication(config);

            const request: ClientCredentialRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                skipCache: false,
            };

            const authResult = (await client.acquireTokenByClientCredential(
                request
            )) as AuthenticationResult;
            expect(authResult.accessToken).toEqual(
                CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
            );

            const clientAssertion: ClientAssertion = await getClientAssertionSpy
                .mock.results[0].value;
            expect(clientAssertion.assertion.length).toBeGreaterThan(1);
            expect(clientAssertion.assertionType).toBe(
                Constants.JWT_BEARER_ASSERTION_TYPE
            );
        });

        test("ensures that developer-provided certificate can be provided with a SHA-1 thumbprint", async () => {
            delete config.auth.clientCertificate?.thumbprintSha256;

            const client: ConfidentialClientApplication =
                new ConfidentialClientApplication(config);

            const request: ClientCredentialRequest = {
                scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
                skipCache: false,
            };

            const authResult = (await client.acquireTokenByClientCredential(
                request
            )) as AuthenticationResult;
            expect(authResult.accessToken).toEqual(
                CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
            );
        });

        test("ensures that developer-provided certificate must be provided with a SHA-1 or SHA-2 thumbprint", async () => {
            delete config.auth.clientCertificate?.thumbprint;
            delete config.auth.clientCertificate?.thumbprintSha256;

            expect(() => {
                new ConfidentialClientApplication(config);
            }).toThrow(NodeAuthError.createStateNotFoundError());
        });
    });

    test("acquireTokenOnBehalfOf", async () => {
        const acquireTokenOnBehalfOfSpy: jest.SpyInstance = jest.spyOn(
            ConfidentialClientApplication.prototype,
            <any>"acquireTokenOnBehalfOf"
        );

        const request: OnBehalfOfRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            oboAssertion: TEST_CONSTANTS.ACCESS_TOKEN,
        };

        const client: ConfidentialClientApplication =
            new ConfidentialClientApplication(config);

        const authResult = (await client.acquireTokenOnBehalfOf(
            request
        )) as AuthenticationResult;
        expect(authResult.accessToken).toEqual(
            CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
        );
        expect(acquireTokenOnBehalfOfSpy).toHaveBeenCalledTimes(1);
    });

    test("acquireTokenByUsernamePassword", async () => {
        const acquireTokenByUsernamePasswordSpy: jest.SpyInstance = jest.spyOn(
            ClientApplication.prototype,
            <any>"acquireTokenByUsernamePassword"
        );

        const request: UsernamePasswordRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            username: TEST_CONSTANTS.USERNAME,
            password: TEST_CONSTANTS.PASSWORD,
        };

        const client: ConfidentialClientApplication =
            new ConfidentialClientApplication(config);

        const authResult = (await client.acquireTokenByUsernamePassword(
            request
        )) as AuthenticationResult;
        expect(authResult.accessToken).toEqual(
            CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
        );
        expect(acquireTokenByUsernamePasswordSpy).toHaveBeenCalledTimes(1);
    });
});

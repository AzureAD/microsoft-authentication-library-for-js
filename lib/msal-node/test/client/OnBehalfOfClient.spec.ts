/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccessTokenEntity,
    AccountEntity,
    AuthenticationScheme,
    AuthToken,
    BaseClient,
    CacheManager,
    ClientConfiguration,
    CommonOnBehalfOfRequest,
    CredentialType,
    IdTokenEntity,
    ScopeSet,
    TimeUtils,
} from "@azure/msal-common";
import { AuthenticationResult, OnBehalfOfClient } from "../../src/index.js";
import {
    AUTHENTICATION_RESULT,
    CAE_CONSTANTS,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
    TEST_TOKENS,
} from "../test_kit/StringConstants.js";
import {
    checkMockedNetworkRequest,
    ClientTestUtils,
    getClientAssertionCallback,
} from "./ClientTestUtils.js";
import { EncodingUtils } from "../../src/utils/EncodingUtils.js";
import { mockNetworkClient } from "../utils/MockNetworkClient.js";

describe("OnBehalfOf unit tests", () => {
    let createTokenRequestBodySpy: jest.SpyInstance;
    let config: ClientConfiguration;
    beforeEach(async () => {
        createTokenRequestBodySpy = jest.spyOn(
            OnBehalfOfClient.prototype,
            <any>"createTokenRequestBody"
        );

        config = await ClientTestUtils.createTestClientConfiguration(
            undefined,
            mockNetworkClient(
                DEFAULT_OPENID_CONFIG_RESPONSE.body,
                AUTHENTICATION_RESULT
            )
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("Constructor", () => {
        it("creates a OnBehalfOf", async () => {
            const client = new OnBehalfOfClient(config);
            expect(client).not.toBeNull();
            expect(client instanceof OnBehalfOfClient).toBe(true);
            expect(client instanceof BaseClient).toBe(true);
        });
    });

    describe("OnBehalfOfClient.ts Class Unit Tests", () => {
        it("Adds claims when provided", async () => {
            const client = new OnBehalfOfClient(config);

            const oboRequest: CommonOnBehalfOfRequest = {
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE],
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                oboAssertion: "user_assertion_hash",
                skipCache: true,
                claims: TEST_CONFIG.CLAIMS,
            };

            const authResult = (await client.acquireToken(
                oboRequest
            )) as AuthenticationResult;
            expect(authResult.accessToken).toEqual(
                AUTHENTICATION_RESULT.body.access_token
            );
            expect(authResult.state).toBe("");
            expect(authResult.fromCache).toBe(false);

            expect(createTokenRequestBodySpy.mock.lastCall[0]).toEqual(
                oboRequest
            );

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            const checks = {
                graphScope: true,
                clientId: true,
                clientSecret: true,
                clientSku: true,
                clientVersion: true,
                clientOs: true,
                appName: true,
                appVersion: true,
                msLibraryCapability: true,
                claims: true,
            };
            checkMockedNetworkRequest(returnVal, checks);
        });

        describe("CAE, claims and client capabilities", () => {
            let client: OnBehalfOfClient;
            let oboRequest: CommonOnBehalfOfRequest;
            beforeEach(async () => {
                const config: ClientConfiguration =
                    await ClientTestUtils.createTestClientConfiguration(
                        CAE_CONSTANTS.CLIENT_CAPABILITIES,
                        mockNetworkClient(
                            DEFAULT_OPENID_CONFIG_RESPONSE.body,
                            AUTHENTICATION_RESULT
                        )
                    );
                client = new OnBehalfOfClient(config);

                oboRequest = {
                    authority: TEST_CONFIG.validAuthority,
                    correlationId: TEST_CONFIG.CORRELATION_ID,
                    oboAssertion: "user_assertion_hash",
                    scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE],
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
                    const authResult = (await client.acquireToken(
                        oboRequest
                    )) as AuthenticationResult;
                    expect(authResult.accessToken).toEqual(
                        AUTHENTICATION_RESULT.body.access_token
                    );
                    expect(authResult.fromCache).toBe(false);

                    // verify that the client capabilities have been merged with the (empty) claims
                    const returnVal: string = await createTokenRequestBodySpy
                        .mock.results[0].value;
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

                    // acquire a token (without changing anything) and verify that it comes from the cache
                    // verify that it comes from the cache
                    const cachedAuthResult = (await client.acquireToken(
                        oboRequest
                    )) as AuthenticationResult;
                    expect(cachedAuthResult.accessToken).toEqual(
                        AUTHENTICATION_RESULT.body.access_token
                    );
                    expect(cachedAuthResult.fromCache).toBe(true);

                    // acquire a token with a client that has client capabilities, and has claims in the request
                    // verify that it comes from the IDP
                    oboRequest.claims = claims;
                    const authResult2 = (await client.acquireToken(
                        oboRequest
                    )) as AuthenticationResult;
                    expect(authResult2.accessToken).toEqual(
                        AUTHENTICATION_RESULT.body.access_token
                    );
                    expect(authResult2.fromCache).toBe(false);

                    // verify that the client capabilities have been merged with the claims
                    const returnVal2: string = await createTokenRequestBodySpy
                        .mock.results[1].value;
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

                    // acquire a token with a client that has client capabilities, but no claims in the request
                    // verify that it comes from the cache
                    delete oboRequest.claims;
                    const authResult3 = (await client.acquireToken(
                        oboRequest
                    )) as AuthenticationResult;
                    expect(authResult3.accessToken).toEqual(
                        AUTHENTICATION_RESULT.body.access_token
                    );
                    expect(authResult3.fromCache).toBe(true);

                    // acquire a token with a client that has client capabilities, and has claims in the request
                    // verify that it comes from the IDP
                    oboRequest.claims = claims;
                    const authResult4 = (await client.acquireToken(
                        oboRequest
                    )) as AuthenticationResult;
                    expect(authResult4.accessToken).toEqual(
                        AUTHENTICATION_RESULT.body.access_token
                    );
                    expect(authResult4.fromCache).toBe(false);
                }
            );
        });

        it("Adds tokenQueryParameters to the /token request", async () => {
            const badExecutePostToTokenEndpointMock = jest.spyOn(
                OnBehalfOfClient.prototype,
                <any>"executePostToTokenEndpoint"
            );
            // no implementation has been mocked, the acquireToken call will fail

            const fakeConfig: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
            const client: OnBehalfOfClient = new OnBehalfOfClient(fakeConfig);

            const oboRequest: CommonOnBehalfOfRequest = {
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE],
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                oboAssertion: "user_assertion_hash",
                skipCache: true,
                claims: TEST_CONFIG.CLAIMS,
                tokenQueryParameters: {
                    testParam1: "testValue1",
                    testParam2: "",
                    testParam3: "testValue3",
                },
            };

            await expect(client.acquireToken(oboRequest)).rejects.toThrow();

            if (!badExecutePostToTokenEndpointMock.mock.lastCall) {
                fail("executePostToTokenEndpointMock was not called");
            }
            const url: string = badExecutePostToTokenEndpointMock.mock
                .lastCall[0] as string;
            expect(
                url.includes(
                    "/token?testParam1=testValue1&testParam3=testValue3"
                )
            ).toBeTruthy();
            expect(!url.includes("/token?testParam2=")).toBeTruthy();
        });

        it("Does not add claims when empty object provided", async () => {
            const client = new OnBehalfOfClient(config);

            const oboRequest: CommonOnBehalfOfRequest = {
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE],
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                oboAssertion: "user_assertion_hash",
                skipCache: true,
                claims: "{}",
            };

            const authResult = (await client.acquireToken(
                oboRequest
            )) as AuthenticationResult;
            expect(authResult.accessToken).toEqual(
                AUTHENTICATION_RESULT.body.access_token
            );
            expect(authResult.state).toBe("");
            expect(authResult.fromCache).toBe(false);

            expect(createTokenRequestBodySpy.mock.lastCall[0]).toEqual(
                oboRequest
            );

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            const checks = {
                graphScope: true,
                clientId: true,
                clientSecret: true,
                clientSku: true,
                clientVersion: true,
                clientOs: true,
                appName: true,
                appVersion: true,
                msLibraryCapability: true,
                claims: false,
            };
            checkMockedNetworkRequest(returnVal, checks);
        });

        it("acquireToken returns token from cache", async () => {
            const testAccessTokenEntity: AccessTokenEntity = {
                homeAccountId: "home_account_id",
                clientId: "client_id",
                environment: "env",
                realm: "this_is_tid",
                secret: "access_token",
                target:
                    TEST_CONFIG.DEFAULT_SCOPES.join(" ") +
                    " " +
                    TEST_CONFIG.DEFAULT_GRAPH_SCOPE.join(" "),
                credentialType: CredentialType.ACCESS_TOKEN,
                cachedAt: `${TimeUtils.nowSeconds()}`,
                expiresOn: `${TimeUtils.nowSeconds() + 3600}`,
                tokenType: AuthenticationScheme.BEARER,
                userAssertionHash: "user_assertion_hash",
            };

            const testIdToken: IdTokenEntity = {
                homeAccountId: "home_account_id",
                clientId: "client_id_for_id_token",
                environment: "env_id_token",
                realm: "this_is_tid_id_token",
                secret: TEST_TOKENS.IDTOKEN_V2,
                credentialType: CredentialType.ID_TOKEN,
            };

            const idTokenClaims = AuthToken.extractTokenClaims(
                TEST_TOKENS.IDTOKEN_V2,
                EncodingUtils.base64Decode
            );
            const expectedAccountEntity: AccountEntity =
                AccountEntity.createAccount(
                    {
                        homeAccountId: "123-test-uid.456-test-uid",
                        idTokenClaims: idTokenClaims,
                    },
                    config.authOptions.authority
                );

            const mockIdTokenCached = jest
                .spyOn(
                    OnBehalfOfClient.prototype,
                    <any>"readIdTokenFromCacheForOBO"
                )
                .mockReturnValueOnce(testIdToken);

            const client = new OnBehalfOfClient(config);

            const oboRequest: CommonOnBehalfOfRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                oboAssertion: "user_assertion_hash",
                skipCache: false,
            };

            jest.spyOn(
                CacheManager.prototype,
                <any>"readAccountFromCache"
            ).mockReturnValueOnce(expectedAccountEntity);
            jest.spyOn(
                CacheManager.prototype,
                <any>"getAccessTokensByFilter"
            ).mockReturnValueOnce([testAccessTokenEntity]);

            const authResult = (await client.acquireToken(
                oboRequest
            )) as AuthenticationResult;
            expect(authResult.scopes).toEqual(
                ScopeSet.fromString(testAccessTokenEntity.target).asArray()
            );
            expect(authResult.idToken).toEqual(testIdToken.secret);
            expect(authResult.accessToken).toEqual(
                testAccessTokenEntity.secret
            );
            expect(authResult.fromCache).toBe(true);
            expect(authResult.account!.homeAccountId).toBe(
                expectedAccountEntity.homeAccountId
            );
            expect(authResult.account!.environment).toBe(
                expectedAccountEntity.environment
            );
            expect(authResult.account!.tenantId).toBe(
                expectedAccountEntity.realm
            );

            if (!mockIdTokenCached.mock.lastCall) {
                fail("executePostToTokenEndpointMock was not called");
            }
            expect(mockIdTokenCached.mock.lastCall[0]).toEqual(
                testAccessTokenEntity.homeAccountId
            );
        });

        it.each([
            TEST_CONFIG.TEST_CONFIG_ASSERTION,
            getClientAssertionCallback(TEST_CONFIG.TEST_CONFIG_ASSERTION),
        ])(
            "Uses clientAssertion from ClientConfiguration when no client assertion is added to request",
            async (clientAssertion) => {
                config.clientCredentials = {
                    ...config.clientCredentials,
                    clientAssertion: {
                        assertion: clientAssertion,
                        assertionType: TEST_CONFIG.TEST_ASSERTION_TYPE,
                    },
                };
                const client: OnBehalfOfClient = new OnBehalfOfClient(config);

                const oboRequest: CommonOnBehalfOfRequest = {
                    scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE],
                    authority: TEST_CONFIG.validAuthority,
                    correlationId: TEST_CONFIG.CORRELATION_ID,
                    oboAssertion: "user_assertion_hash",
                    skipCache: true,
                };

                const authResult = (await client.acquireToken(
                    oboRequest
                )) as AuthenticationResult;
                expect(authResult.accessToken).toEqual(
                    AUTHENTICATION_RESULT.body.access_token
                );
                expect(authResult.state).toBe("");
                expect(authResult.fromCache).toBe(false);

                expect(createTokenRequestBodySpy.mock.lastCall[0]).toEqual(
                    oboRequest
                );

                const returnVal: string = await createTokenRequestBodySpy.mock
                    .results[0].value;
                const checks = {
                    graphScope: true,
                    clientId: true,
                    clientSecret: true,
                    clientSku: true,
                    clientVersion: true,
                    clientOs: true,
                    appName: true,
                    appVersion: true,
                    msLibraryCapability: true,
                    testConfigAssertion: true,
                    testAssertionType: true,
                };
                checkMockedNetworkRequest(returnVal, checks);
            }
        );
    });
});

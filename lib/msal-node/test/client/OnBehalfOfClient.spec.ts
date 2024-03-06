/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import sinon from "sinon";
import {
    AADServerParamKeys,
    AccessTokenEntity,
    AccountEntity,
    AuthenticationScheme,
    Authority,
    AuthToken,
    BaseClient,
    CacheManager,
    ClientConfiguration,
    CommonOnBehalfOfRequest,
    Constants,
    CredentialType,
    IdTokenEntity,
    ScopeSet,
    ThrottlingConstants,
    TimeUtils,
} from "@azure/msal-common";
import { AuthenticationResult, OnBehalfOfClient } from "../../src";
import {
    AUTHENTICATION_RESULT,
    CAE_CONSTANTS,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
    TEST_DATA_CLIENT_INFO,
    TEST_TOKENS,
} from "../test_kit/StringConstants";
import { ID_TOKEN_CLAIMS } from "../utils/TestConstants";
import { ClientTestUtils } from "./ClientTestUtils";
import { EncodingUtils } from "../../src/utils/EncodingUtils";
import { mockNetworkClient } from "../utils/MockNetworkClient";

const testAccountEntity: AccountEntity = new AccountEntity();
testAccountEntity.homeAccountId = `${TEST_DATA_CLIENT_INFO.TEST_ENCODED_HOME_ACCOUNT_ID}`;
testAccountEntity.localAccountId = ID_TOKEN_CLAIMS.oid;
testAccountEntity.environment = "login.windows.net";
testAccountEntity.realm = ID_TOKEN_CLAIMS.tid;
testAccountEntity.username = ID_TOKEN_CLAIMS.preferred_username;
testAccountEntity.name = ID_TOKEN_CLAIMS.name;
testAccountEntity.authorityType = "MSSTS";

let testAccessTokenEntity: AccessTokenEntity = {
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

describe("OnBehalfOf unit tests", () => {
    let config: ClientConfiguration;

    beforeEach(async () => {
        sinon
            .stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork")
            .resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        config = await ClientTestUtils.createTestClientConfiguration();
    });

    afterEach(() => {
        sinon.restore();
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
        afterEach(() => {
            sinon.restore();
        });

        it("Adds claims when provided", async () => {
            sinon
                .stub(
                    OnBehalfOfClient.prototype,
                    <any>"executePostToTokenEndpoint"
                )
                .resolves(AUTHENTICATION_RESULT);

            const createTokenRequestBodySpy = sinon.spy(
                OnBehalfOfClient.prototype,
                <any>"createTokenRequestBody"
            );

            let config: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration();
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
            const returnVal = (await createTokenRequestBodySpy
                .returnValues[0]) as string;

            expect(authResult.accessToken).toEqual(
                AUTHENTICATION_RESULT.body.access_token
            );
            expect(authResult.state).toBe("");
            expect(authResult.fromCache).toBe(false);

            expect(createTokenRequestBodySpy.calledWith(oboRequest)).toBe(true);

            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.SCOPE}=${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CLAIMS}=${encodeURIComponent(
                        TEST_CONFIG.CLAIMS
                    )}`
                )
            ).toBe(true);
        });

        describe("CAE, claims and client capabilities", () => {
            let client: OnBehalfOfClient;
            let oboRequest: CommonOnBehalfOfRequest;
            let createTokenRequestBodySpy: jest.SpyInstance;
            beforeEach(async () => {
                createTokenRequestBodySpy = jest.spyOn(
                    OnBehalfOfClient.prototype,
                    <any>"createTokenRequestBody"
                );

                const config: ClientConfiguration = {
                    ...(await ClientTestUtils.createTestClientConfiguration(
                        CAE_CONSTANTS.CLIENT_CAPABILITIES
                    )),
                    networkInterface: mockNetworkClient(
                        {},
                        AUTHENTICATION_RESULT
                    ),
                };
                client = new OnBehalfOfClient(config);
                oboRequest = {
                    authority: TEST_CONFIG.validAuthority,
                    correlationId: TEST_CONFIG.CORRELATION_ID,
                    oboAssertion: "user_assertion_hash",
                    scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE],
                };
            });

            afterAll(() => {
                jest.restoreAllMocks();
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
                    oboRequest.claims = claims;
                    const authResult = (await client.acquireToken(
                        oboRequest
                    )) as AuthenticationResult;

                    const returnValues = await createTokenRequestBodySpy.mock
                        .results;
                    const currentReturnValue = returnValues[
                        returnValues.length - 1
                    ].value as string;
                    expect(authResult.accessToken).toEqual(
                        AUTHENTICATION_RESULT.body.access_token
                    );
                    expect(
                        decodeURIComponent(
                            currentReturnValue
                                .split("&")
                                .filter((key: string) =>
                                    key.includes("claims=")
                                )[0]
                                .split("claims=")[1]
                        )
                    ).toEqual(mergedClaims);

                    const cachedAuthResult = (await client.acquireToken(
                        oboRequest
                    )) as AuthenticationResult;
                    expect(cachedAuthResult.accessToken).toEqual(
                        AUTHENTICATION_RESULT.body.access_token
                    );
                    expect(cachedAuthResult.fromCache).toBe(true);
                }
            );
        });

        it("Adds tokenQueryParameters to the /token request", (done) => {
            sinon
                .stub(
                    OnBehalfOfClient.prototype,
                    <any>"executePostToTokenEndpoint"
                )
                .callsFake((url: string) => {
                    try {
                        expect(
                            url.includes(
                                "/token?testParam1=testValue1&testParam3=testValue3"
                            )
                        ).toBeTruthy();
                        expect(
                            !url.includes("/token?testParam2=")
                        ).toBeTruthy();
                        done();
                    } catch (error) {
                        done(error);
                    }
                });

            const client = new OnBehalfOfClient(config);
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

            client.acquireToken(oboRequest).catch(() => {
                // Catch errors thrown after the function call this test is testing
            });
        });

        it("Does not add claims when empty object provided", async () => {
            sinon
                .stub(
                    OnBehalfOfClient.prototype,
                    <any>"executePostToTokenEndpoint"
                )
                .resolves(AUTHENTICATION_RESULT);
            const createTokenRequestBodySpy = sinon.spy(
                OnBehalfOfClient.prototype,
                <any>"createTokenRequestBody"
            );
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
            const returnVal = (await createTokenRequestBodySpy
                .returnValues[0]) as string;

            expect(authResult.accessToken).toEqual(
                AUTHENTICATION_RESULT.body.access_token
            );
            expect(authResult.state).toBe("");
            expect(authResult.fromCache).toBe(false);

            expect(createTokenRequestBodySpy.calledWith(oboRequest)).toBe(true);

            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.SCOPE}=${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CLAIMS}=${encodeURIComponent(
                        TEST_CONFIG.CLAIMS
                    )}`
                )
            ).toBe(false);
        });

        it("acquireToken returns token from cache", async () => {
            const oboRequest: CommonOnBehalfOfRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                oboAssertion: "user_assertion_hash",
                skipCache: false,
            };

            const mockIdTokenCached = sinon
                .stub(
                    OnBehalfOfClient.prototype,
                    <any>"readIdTokenFromCacheForOBO"
                )
                .returns(testIdToken);
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new OnBehalfOfClient(config);
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

            sinon
                .stub(CacheManager.prototype, <any>"readAccountFromCache")
                .returns(expectedAccountEntity);

            sinon
                .stub(CacheManager.prototype, <any>"getAccessTokensByFilter")
                .returns([testAccessTokenEntity]);

            const authResult = (await client.acquireToken(
                oboRequest
            )) as AuthenticationResult;
            expect(
                mockIdTokenCached.calledWith(
                    testAccessTokenEntity.homeAccountId
                )
            ).toBe(true);
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
        });
    });
});

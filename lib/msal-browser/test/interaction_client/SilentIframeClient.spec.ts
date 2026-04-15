/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PublicClientApplication } from "../../src/app/PublicClientApplication.js";
import {
    TEST_CONFIG,
    TEST_URIS,
    TEST_HASHES,
    TEST_TOKENS,
    TEST_DATA_CLIENT_INFO,
    TEST_TOKEN_LIFETIMES,
    RANDOM_TEST_GUID,
    testNavUrl,
    TEST_STATE_VALUES,
    TEST_TOKEN_RESPONSE,
    ID_TOKEN_CLAIMS,
    validEarJWK,
    getTestAuthenticationResult,
    validEarJWE,
} from "../utils/StringConstants.js";
import {
    AccountInfo,
    TokenClaims,
    Constants,
    ServerTelemetryManager,
    ProtocolUtils,
    TenantProfile,
    Authority,
    ProtocolMode,
    createClientConfigurationError,
    ClientConfigurationErrorCodes,
} from "@azure/msal-common/browser";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
    getDefaultErrorMessage,
} from "../../src/error/BrowserAuthError.js";
import * as SilentHandler from "../../src/interaction_handler/SilentHandler.js";
import * as BrowserCrypto from "../../src/crypto/BrowserCrypto.js";
import * as PkceGenerator from "../../src/crypto/PkceGenerator.js";
import * as AuthorizeProtocol from "../../src/protocol/Authorize.js";
import { SilentIframeClient } from "../../src/interaction_client/SilentIframeClient.js";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager.js";
import { PlatformAuthInteractionClient } from "../../src/interaction_client/PlatformAuthInteractionClient.js";
import { PlatformAuthExtensionHandler } from "../../src/broker/nativeBroker/PlatformAuthExtensionHandler.js";
import { getDefaultPerformanceClient } from "../utils/TelemetryUtils.js";
import { InteractionHandler } from "../../src/interaction_handler/InteractionHandler.js";
import {
    ApiId,
    BrowserConstants,
    InteractionType,
} from "../../src/utils/BrowserConstants.js";
import { FetchClient } from "../../src/network/FetchClient.js";
import { TestTimeUtils } from "msal-test-utils";
import { AuthenticationResult } from "../../src/response/AuthenticationResult.js";
import { BrowserUtils, SsoSilentRequest } from "../../src/index.js";
import * as StandardInteractionClientExports from "../../src/interaction_client/StandardInteractionClient.js";

jest.mock("@azure/msal-common/browser", () => ({
    ...jest.requireActual("@azure/msal-common/browser"),
    ProtocolUtils: {
        ...jest.requireActual("@azure/msal-common/browser").ProtocolUtils,
        setRequestState: jest.fn(),
    },
}));

describe("SilentIframeClient", () => {
    let silentIframeClient: SilentIframeClient;
    let pca: PublicClientApplication;
    let browserCacheManager: BrowserCacheManager;
    let clientProperties: SilentIframeClient;
    let mockSetRequestState: jest.MockedFunction<
        typeof ProtocolUtils.setRequestState
    >;

    beforeEach(() => {
        pca = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        //Implementation of PCA was moved to controller.
        pca = (pca as any).controller;

        //@ts-ignore
        browserCacheManager = pca.browserStorage;

        // @ts-ignore
        silentIframeClient = new SilentIframeClient(
            //@ts-ignore
            pca.config,
            //@ts-ignore
            pca.browserStorage,
            //@ts-ignore
            pca.browserCrypto,
            //@ts-ignore
            pca.logger,
            //@ts-ignore
            pca.eventHandler,
            //@ts-ignore
            pca.navigationClient,
            ApiId.acquireTokenSilent_authCode,
            //@ts-ignore
            pca.performanceClient,
            //@ts-ignore
            pca.nativeInternalStorage,
            TEST_CONFIG.CORRELATION_ID
        );

        clientProperties = silentIframeClient as any;

        mockSetRequestState =
            ProtocolUtils.setRequestState as jest.MockedFunction<
                typeof ProtocolUtils.setRequestState
            >;
        mockSetRequestState.mockReturnValue(
            TEST_STATE_VALUES.TEST_STATE_SILENT
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
        window.location.hash = "";
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    describe("acquireToken", () => {
        it("sets invalid prompt to none and acquires a token", async () => {
            const testServerTokenResponse = {
                token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
            };
            const testIdTokenClaims: TokenClaims = {
                ver: "2.0",
                iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                loginHint: testIdTokenClaims.login_hint,
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid || "",
                tenantId: testIdTokenClaims.tid || "",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: testServerTokenResponse.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(
                    testServerTokenResponse.expires_in
                ),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            jest.spyOn(
                AuthorizeProtocol,
                "getAuthCodeRequestUrl"
            ).mockResolvedValue(testNavUrl);
            jest.spyOn(BrowserUtils, "waitForBridgeResponse").mockResolvedValue(
                TEST_HASHES.TEST_SUCCESS_CODE_HASH_SILENT
            );
            jest.spyOn(
                InteractionHandler.prototype,
                "handleCodeResponse"
            ).mockResolvedValue(testTokenResponse);
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );

            const initializeAuthorizationRequestSpy = jest.spyOn(
                StandardInteractionClientExports,
                "initializeAuthorizationRequest"
            );
            const tokenResp = await silentIframeClient.acquireToken({
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                loginHint: "testLoginHint",
                prompt: Constants.PromptValue.SELECT_ACCOUNT,
            });
            expect(tokenResp).toEqual(testTokenResponse);
            expect(initializeAuthorizationRequestSpy).toHaveBeenCalledWith(
                {
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    loginHint: "testLoginHint",
                    prompt: Constants.PromptValue.NONE,
                },
                InteractionType.Silent,
                // @ts-ignore
                clientProperties.config,
                //@ts-ignore
                clientProperties.browserCrypto,
                //@ts-ignore
                clientProperties.browserStorage,
                //@ts-ignore
                clientProperties.logger,
                //@ts-ignore
                clientProperties.performanceClient,
                //@ts-ignore
                clientProperties.correlationId
            );
        });

        it("Errors thrown during token acquisition are cached for telemetry and browserStorage is cleaned", (done) => {
            jest.spyOn(
                AuthorizeProtocol,
                "getAuthCodeRequestUrl"
            ).mockResolvedValue(testNavUrl);
            jest.spyOn(BrowserUtils, "waitForBridgeResponse").mockRejectedValue(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.timedOut,
                    "redirect_bridge_timeout"
                )
            );
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            const telemetryStub = jest
                .spyOn(ServerTelemetryManager.prototype, "cacheFailedRequest")
                .mockImplementation((e) => {
                    expect(e).toMatchObject(
                        createBrowserAuthError(
                            BrowserAuthErrorCodes.timedOut,
                            "redirect_bridge_timeout"
                        )
                    );
                });

            silentIframeClient
                .acquireToken({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    loginHint: "testLoginHint",
                })
                .catch(() => {
                    expect(telemetryStub).toHaveBeenCalledTimes(1);
                    done();
                });
        });

        it("Unexpected non-msal errors do not add correlationId and browserStorage is cleaned", (done) => {
            jest.spyOn(
                AuthorizeProtocol,
                "getAuthCodeRequestUrl"
            ).mockResolvedValue(testNavUrl);
            const testError = {
                errorCode: "Unexpected error",
                errorDesc: "Unexpected error",
            };
            jest.spyOn(BrowserUtils, "waitForBridgeResponse").mockRejectedValue(
                testError
            );
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );

            silentIframeClient
                .acquireToken({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    loginHint: "testLoginHint",
                })
                .catch((e) => {
                    expect(e).toMatchObject(testError);
                    expect(e).not.toHaveProperty("correlationId");
                    done();
                });
        });

        it("successfully returns a token response (login_hint)", async () => {
            const testServerTokenResponse = {
                token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
            };
            const testIdTokenClaims: TokenClaims = {
                ver: "2.0",
                iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                loginHint: testIdTokenClaims.login_hint,
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid || "",
                tenantId: testIdTokenClaims.tid || "",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: testServerTokenResponse.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(
                    testServerTokenResponse.expires_in
                ),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            jest.spyOn(
                AuthorizeProtocol,
                "getAuthCodeRequestUrl"
            ).mockResolvedValue(testNavUrl);
            jest.spyOn(BrowserUtils, "waitForBridgeResponse").mockResolvedValue(
                TEST_HASHES.TEST_SUCCESS_CODE_HASH_SILENT
            );
            jest.spyOn(
                InteractionHandler.prototype,
                "handleCodeResponse"
            ).mockResolvedValue(testTokenResponse);
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            const tokenResp = await silentIframeClient.acquireToken({
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                loginHint: "testLoginHint",
                prompt: Constants.PromptValue.NO_SESSION,
            });
            expect(tokenResp).toEqual(testTokenResponse);
        });

        it("successfully returns a token response (sid)", async () => {
            const testServerTokenResponse = {
                token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
            };
            const testIdTokenClaims: TokenClaims = {
                ver: "2.0",
                iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                loginHint: testIdTokenClaims.login_hint,
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid || "",
                tenantId: testIdTokenClaims.tid || "",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: testServerTokenResponse.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(
                    testServerTokenResponse.expires_in
                ),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            jest.spyOn(
                AuthorizeProtocol,
                "getAuthCodeRequestUrl"
            ).mockResolvedValue(testNavUrl);
            jest.spyOn(BrowserUtils, "waitForBridgeResponse").mockResolvedValue(
                TEST_HASHES.TEST_SUCCESS_CODE_HASH_SILENT
            );
            jest.spyOn(
                InteractionHandler.prototype,
                "handleCodeResponse"
            ).mockResolvedValue(testTokenResponse);
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            const tokenResp = await silentIframeClient.acquireToken({
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                sid: TEST_CONFIG.SID,
                // not setting a prompt is equivalent to Prompt: PromptValue.NONE
            });
            expect(tokenResp).toEqual(testTokenResponse);
        });

        it("successfully returns a token response from native broker", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            });

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            // @ts-ignore
            const nativeMessageHandler = new PlatformAuthExtensionHandler(
                //@ts-ignore
                pca.logger,
                2000,
                getDefaultPerformanceClient()
            );
            // @ts-ignore
            silentIframeClient = new SilentIframeClient(
                //@ts-ignore
                pca.config,
                //@ts-ignore
                pca.browserStorage,
                //@ts-ignore
                pca.browserCrypto,
                //@ts-ignore
                pca.logger,
                //@ts-ignore
                pca.eventHandler,
                //@ts-ignore
                pca.navigationClient,
                ApiId.acquireTokenSilent_authCode,
                //@ts-ignore
                pca.performanceClient,
                //@ts-ignore
                pca.nativeInternalStorage,
                TEST_CONFIG.CORRELATION_ID,
                nativeMessageHandler
            );
            const testServerTokenResponse = {
                token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
            };
            const testIdTokenClaims: TokenClaims = {
                ver: "2.0",
                iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                nativeAccountId: "test-nativeAccountId",
                loginHint: testIdTokenClaims.login_hint,
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid || "",
                tenantId: testIdTokenClaims.tid || "",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: testServerTokenResponse.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(
                    testServerTokenResponse.expires_in
                ),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            jest.spyOn(
                AuthorizeProtocol,
                "getAuthCodeRequestUrl"
            ).mockResolvedValue(testNavUrl);
            jest.spyOn(BrowserUtils, "waitForBridgeResponse").mockResolvedValue(
                TEST_HASHES.TEST_SUCCESS_NATIVE_ACCOUNT_ID_SILENT
            );
            jest.spyOn(
                PlatformAuthInteractionClient.prototype,
                "acquireToken"
            ).mockResolvedValue(testTokenResponse);
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            const tokenResp = await silentIframeClient.acquireToken({
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                sid: TEST_CONFIG.SID,
            });
            expect(tokenResp).toEqual(testTokenResponse);
        });

        it("throw if server returns accountId but extension communication has not been established", (done) => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            });

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            // @ts-ignore
            silentIframeClient = new SilentIframeClient(
                //@ts-ignore
                pca.config,
                //@ts-ignore
                pca.browserStorage,
                //@ts-ignore
                pca.browserCrypto,
                //@ts-ignore
                pca.logger,
                //@ts-ignore
                pca.eventHandler,
                //@ts-ignore
                pca.navigationClient,
                ApiId.acquireTokenSilent_authCode,
                //@ts-ignore
                pca.performanceClient,
                //@ts-ignore
                pca.nativeInternalStorage
            );
            const testServerTokenResponse = {
                token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
            };
            const testIdTokenClaims: TokenClaims = {
                ver: "2.0",
                iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                nativeAccountId: "test-nativeAccountId",
                loginHint: testIdTokenClaims.login_hint,
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid || "",
                tenantId: testIdTokenClaims.tid || "",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: testServerTokenResponse.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(
                    testServerTokenResponse.expires_in
                ),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            jest.spyOn(
                AuthorizeProtocol,
                "getAuthCodeRequestUrl"
            ).mockResolvedValue(testNavUrl);
            jest.spyOn(BrowserUtils, "waitForBridgeResponse").mockResolvedValue(
                TEST_HASHES.TEST_SUCCESS_NATIVE_ACCOUNT_ID_SILENT
            );
            jest.spyOn(
                PlatformAuthInteractionClient.prototype,
                "acquireToken"
            ).mockResolvedValue(testTokenResponse);
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            silentIframeClient
                .acquireToken({
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                })
                .catch((e) => {
                    expect(e.errorCode).toEqual(
                        BrowserAuthErrorCodes.nativeConnectionNotEstablished
                    );
                    expect(e.errorMessage).toEqual(
                        getDefaultErrorMessage(
                            BrowserAuthErrorCodes.nativeConnectionNotEstablished
                        )
                    );
                    done();
                });
        });

        it("Throws hash empty error", (done) => {
            jest.spyOn(BrowserUtils, "waitForBridgeResponse").mockResolvedValue(
                ""
            );
            silentIframeClient
                .acquireToken({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                })
                .catch((e) => {
                    expect(e).toEqual(
                        createBrowserAuthError(
                            BrowserAuthErrorCodes.hashEmptyError
                        )
                    );
                    done();
                });
        });

        it("Throws hashDoesNotContainKnownProperties error", (done) => {
            jest.spyOn(BrowserUtils, "waitForBridgeResponse").mockResolvedValue(
                "myCustomHash"
            );
            silentIframeClient
                .acquireToken({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                })
                .catch((e) => {
                    expect(e).toEqual(
                        createBrowserAuthError(
                            BrowserAuthErrorCodes.hashDoesNotContainKnownProperties
                        )
                    );
                    done();
                });
        });

        it("retries on invalid_grant error and returns successful response", async () => {
            const testServerErrorResponse = {
                headers: {},
                body: {
                    error: "invalid_grant",
                    error_description: "invalid_grant",
                    error_codes: ["invalid_grant"],
                    suberror: "first_server_error",
                },
                status: 200,
            };
            const testServerTokenResponse = {
                token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
            };
            const testServerResponse = {
                headers: {},
                body: testServerTokenResponse,
                status: 200,
            };
            const testAccount: AccountInfo = {
                homeAccountId: ID_TOKEN_CLAIMS.sub,
                environment: "login.windows.net",
                tenantId: ID_TOKEN_CLAIMS.tid,
                username: ID_TOKEN_CLAIMS.preferred_username,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                loginHint: ID_TOKEN_CLAIMS.login_hint,
                name: ID_TOKEN_CLAIMS.name,
                nativeAccountId: undefined,
                authorityType: "MSSTS",
                tenantProfiles: new Map<string, TenantProfile>([
                    [
                        ID_TOKEN_CLAIMS.tid,
                        {
                            isHomeTenant: false,
                            localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                            username: ID_TOKEN_CLAIMS.preferred_username,
                            loginHint: ID_TOKEN_CLAIMS.login_hint,
                            name: ID_TOKEN_CLAIMS.name,
                            tenantId: ID_TOKEN_CLAIMS.tid,
                            upn: ID_TOKEN_CLAIMS.upn,
                        },
                    ],
                ]),
                idTokenClaims: ID_TOKEN_CLAIMS,
                idToken: TEST_TOKENS.IDTOKEN_V2,
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: ID_TOKEN_CLAIMS.oid,
                tenantId: ID_TOKEN_CLAIMS.tid,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: testServerTokenResponse.id_token,
                idTokenClaims: ID_TOKEN_CLAIMS,
                accessToken: testServerTokenResponse.access_token,
                fromCache: false,
                fromPlatformBroker: false,
                code: undefined,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                expiresOn: TestTimeUtils.calculateExpiresDate(
                    testServerTokenResponse.expires_in
                ),
                extExpiresOn: TestTimeUtils.calculateExpiresDate(
                    testServerTokenResponse.expires_in +
                        testServerTokenResponse.ext_expires_in
                ),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
                refreshOn: undefined,
                requestId: "",
                familyId: "",
                state: TEST_STATE_VALUES.USER_STATE,
                msGraphHost: "",
                cloudGraphHostName: "",
            };
            jest.spyOn(
                AuthorizeProtocol,
                "getAuthCodeRequestUrl"
            ).mockResolvedValue(testNavUrl);
            jest.spyOn(BrowserUtils, "waitForBridgeResponse").mockResolvedValue(
                TEST_HASHES.TEST_SUCCESS_CODE_HASH_SILENT
            );
            const sendPostRequestSpy = jest
                .spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockResolvedValueOnce(testServerErrorResponse)
                .mockResolvedValueOnce(testServerResponse);
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            const tokenResp = await silentIframeClient.acquireToken({
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                loginHint: "testLoginHint",
                prompt: Constants.PromptValue.NO_SESSION,
                nonce: "123523",
                state: TEST_STATE_VALUES.USER_STATE,
            });
            expect(tokenResp).toEqual(testTokenResponse);
            expect(sendPostRequestSpy.mock.results[0].value).resolves.toEqual(
                testServerErrorResponse
            );
        });

        it("retries on invalid_grant error once and throws if still error", async () => {
            const testFirstServerErrorResponse = {
                headers: {},
                body: {
                    error: "invalid_grant",
                    error_description: "invalid_grant",
                    error_codes: ["invalid_grant"],
                    suberror: "first_server_error",
                },
                status: 200,
            };
            const testSecondServerErrorResponse = {
                headers: {},
                body: {
                    error: "invalid_grant",
                    error_description: "invalid_grant",
                    error_codes: ["invalid_grant"],
                    suberror: "second_server_error",
                },
                status: 200,
            };
            jest.spyOn(
                AuthorizeProtocol,
                "getAuthCodeRequestUrl"
            ).mockResolvedValue(testNavUrl);
            jest.spyOn(BrowserUtils, "waitForBridgeResponse").mockResolvedValue(
                TEST_HASHES.TEST_SUCCESS_CODE_HASH_SILENT
            );
            const sendPostRequestSpy = jest
                .spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockResolvedValueOnce(testFirstServerErrorResponse)
                .mockResolvedValueOnce(testSecondServerErrorResponse);
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            await silentIframeClient
                .acquireToken({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    loginHint: "testLoginHint",
                    prompt: Constants.PromptValue.NO_SESSION,
                    state: TEST_STATE_VALUES.USER_STATE,
                })
                .catch((e) => {
                    expect(e.errorCode).toEqual(
                        BrowserConstants.INVALID_GRANT_ERROR
                    );
                    expect(e.subError).toEqual("second_server_error");
                    expect(sendPostRequestSpy).toHaveBeenCalledTimes(2);
                    expect(
                        sendPostRequestSpy.mock.results[0].value
                    ).resolves.toEqual(testFirstServerErrorResponse);
                });
        });

        it("updates authority hostname param if set to true in the config", async () => {
            //@ts-ignore
            const config = { ...pca.config };
            config.auth.instanceAware = true;

            // @ts-ignore
            const testClient = new SilentIframeClient(
                config,
                //@ts-ignore
                pca.browserStorage,
                //@ts-ignore
                pca.browserCrypto,
                //@ts-ignore
                pca.logger,
                //@ts-ignore
                pca.eventHandler,
                //@ts-ignore
                pca.navigationClient,
                ApiId.acquireTokenSilent_authCode,
                //@ts-ignore
                pca.performanceClient,
                //@ts-ignore
                pca.nativeInternalStorage,
                TEST_CONFIG.CORRELATION_ID
            );

            const testServerTokenResponse = {
                token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
            };
            const testIdTokenClaims: TokenClaims = {
                ver: "2.0",
                iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                loginHint: testIdTokenClaims.login_hint,
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid || "",
                tenantId: testIdTokenClaims.tid || "",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: testServerTokenResponse.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(
                    testServerTokenResponse.expires_in
                ),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            jest.spyOn(BrowserUtils, "waitForBridgeResponse").mockResolvedValue(
                TEST_HASHES.TEST_SUCCESS_CODE_HASH_SILENT
            );
            const handleCodeResponseSpy = jest
                .spyOn(InteractionHandler.prototype, "handleCodeResponse")
                .mockResolvedValue(testTokenResponse);
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            const generateAuthoritySpy = jest.spyOn(
                Authority,
                "generateAuthority"
            );

            const tokenResp = await testClient.acquireToken({
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                loginHint: "testLoginHint",
                prompt: Constants.PromptValue.SELECT_ACCOUNT,
                account: testAccount,
            });
            expect(generateAuthoritySpy.mock.calls[0][0]).toEqual(
                "https://login.windows.net/common/"
            );
        });

        it("does not set instance_aware extra query param if set to false in the config", async () => {
            //@ts-ignore
            const config = { ...pca.config };
            config.auth.instanceAware = false;

            // @ts-ignore
            const testClient = new SilentIframeClient(
                config,
                //@ts-ignore
                pca.browserStorage,
                //@ts-ignore
                pca.browserCrypto,
                //@ts-ignore
                pca.logger,
                //@ts-ignore
                pca.eventHandler,
                //@ts-ignore
                pca.navigationClient,
                ApiId.acquireTokenSilent_authCode,
                //@ts-ignore
                pca.performanceClient,
                //@ts-ignore
                pca.nativeInternalStorage,
                TEST_CONFIG.CORRELATION_ID
            );

            const testServerTokenResponse = {
                token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
            };
            const testIdTokenClaims: TokenClaims = {
                ver: "2.0",
                iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                loginHint: testIdTokenClaims.login_hint,
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid || "",
                tenantId: testIdTokenClaims.tid || "",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: testServerTokenResponse.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(
                    testServerTokenResponse.expires_in
                ),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            jest.spyOn(
                AuthorizeProtocol,
                "getAuthCodeRequestUrl"
            ).mockResolvedValue(testNavUrl);
            jest.spyOn(BrowserUtils, "waitForBridgeResponse").mockResolvedValue(
                TEST_HASHES.TEST_SUCCESS_CODE_HASH_SILENT
            );
            const handleCodeResponseSpy = jest
                .spyOn(InteractionHandler.prototype, "handleCodeResponse")
                .mockResolvedValue(testTokenResponse);
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            const generateAuthoritySpy = jest.spyOn(
                Authority,
                "generateAuthority"
            );

            const tokenResp = await testClient.acquireToken({
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                loginHint: "testLoginHint",
                prompt: Constants.PromptValue.SELECT_ACCOUNT,
                account: testAccount,
            });
            expect(
                handleCodeResponseSpy.mock.calls[0][1].extraQueryParameters
            ).toBeUndefined();
            expect(generateAuthoritySpy.mock.calls[0][0]).toEqual(
                "https://login.microsoftonline.com/common/"
            );
        });

        it("does not override instance_aware extra query param if set to true in the config and false in the request", async () => {
            //@ts-ignore
            const config = { ...pca.config };
            config.auth.instanceAware = true;

            // @ts-ignore
            const testClient = new SilentIframeClient(
                config,
                //@ts-ignore
                pca.browserStorage,
                //@ts-ignore
                pca.browserCrypto,
                //@ts-ignore
                pca.logger,
                //@ts-ignore
                pca.eventHandler,
                //@ts-ignore
                pca.navigationClient,
                ApiId.acquireTokenSilent_authCode,
                //@ts-ignore
                pca.performanceClient,
                //@ts-ignore
                pca.nativeInternalStorage,
                TEST_CONFIG.CORRELATION_ID
            );

            const testServerTokenResponse = {
                token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
            };
            const testIdTokenClaims: TokenClaims = {
                ver: "2.0",
                iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                loginHint: testIdTokenClaims.login_hint,
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid || "",
                tenantId: testIdTokenClaims.tid || "",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: testServerTokenResponse.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(
                    testServerTokenResponse.expires_in
                ),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            jest.spyOn(
                AuthorizeProtocol,
                "getAuthCodeRequestUrl"
            ).mockResolvedValue(testNavUrl);
            jest.spyOn(BrowserUtils, "waitForBridgeResponse").mockResolvedValue(
                TEST_HASHES.TEST_SUCCESS_CODE_HASH_SILENT
            );
            jest.spyOn(
                InteractionHandler.prototype,
                "handleCodeResponse"
            ).mockResolvedValue(testTokenResponse);
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            const generateAuthoritySpy = jest.spyOn(
                Authority,
                "generateAuthority"
            );

            const tokenResp = await testClient.acquireToken({
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                loginHint: "testLoginHint",
                prompt: Constants.PromptValue.SELECT_ACCOUNT,
                account: testAccount,
                extraQueryParameters: {
                    instance_aware: "false",
                },
            });
            expect(generateAuthoritySpy.mock.calls[0][0]).toEqual(
                "https://login.microsoftonline.com/common/"
            );
        });

        describe("httpMethod tests", () => {
            const testServerTokenResponse = {
                token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
            };
            const testIdTokenClaims: TokenClaims = {
                ver: "2.0",
                iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid || "",
                tenantId: testIdTokenClaims.tid || "",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: testServerTokenResponse.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(
                    testServerTokenResponse.expires_in
                ),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            const generateAuthoritySpy = jest.spyOn(
                Authority,
                "generateAuthority"
            );

            beforeEach(() => {
                jest.spyOn(
                    BrowserUtils,
                    "waitForBridgeResponse"
                ).mockResolvedValue(TEST_HASHES.TEST_SUCCESS_CODE_HASH_SILENT);
                jest.spyOn(
                    InteractionHandler.prototype,
                    "handleCodeResponse"
                ).mockResolvedValue(testTokenResponse);
                jest.spyOn(
                    PkceGenerator,
                    "generatePkceCodes"
                ).mockResolvedValue({
                    challenge: TEST_CONFIG.TEST_CHALLENGE,
                    verifier: TEST_CONFIG.TEST_VERIFIER,
                });
                jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                    RANDOM_TEST_GUID
                );
            });

            afterEach(() => {
                jest.clearAllMocks();
            });

            it("uses POST code flow if httpMethod is set to POST", async () => {
                const postCodeFlowSpy = jest
                    .spyOn(SilentHandler, "initiateCodeFlowWithPost")
                    .mockResolvedValue(document.createElement("iframe"));
                const tokenResp = await silentIframeClient.acquireToken({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    loginHint: "testLoginHint",
                    prompt: Constants.PromptValue.SELECT_ACCOUNT,
                    account: testAccount,
                    httpMethod: Constants.HttpMethod.POST,
                });

                expect(postCodeFlowSpy).toHaveBeenCalled();
                expect(tokenResp).toEqual(testTokenResponse);
            });

            it("uses GET code flow if httpMethod is set to GET", async () => {
                const getAuthCodeRequestUrlSpy = jest
                    .spyOn(AuthorizeProtocol, "getAuthCodeRequestUrl")
                    .mockResolvedValue(testNavUrl);
                const initiateCodeRequestSpy = jest
                    .spyOn(SilentHandler, "initiateCodeRequest")
                    .mockResolvedValue(document.createElement("iframe"));

                const tokenResp = await silentIframeClient.acquireToken({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    loginHint: "testLoginHint",
                    prompt: Constants.PromptValue.SELECT_ACCOUNT,
                    account: testAccount,
                    httpMethod: Constants.HttpMethod.GET,
                });

                expect(getAuthCodeRequestUrlSpy).toHaveBeenCalled();
                expect(initiateCodeRequestSpy).toHaveBeenCalled();
                expect(tokenResp).toEqual(testTokenResponse);
            });

            it("removes hidden iframe after successful token acquisition", async () => {
                const iframe = document.createElement("iframe");
                document.body.appendChild(iframe);
                jest.spyOn(
                    AuthorizeProtocol,
                    "getAuthCodeRequestUrl"
                ).mockResolvedValue(testNavUrl);
                jest.spyOn(
                    SilentHandler,
                    "initiateCodeRequest"
                ).mockResolvedValue(iframe);
                const removeIframeSpy = jest.spyOn(
                    SilentHandler,
                    "removeHiddenIframe"
                );

                await silentIframeClient.acquireToken({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    loginHint: "testLoginHint",
                    account: testAccount,
                });

                expect(removeIframeSpy).toHaveBeenCalledWith(iframe);
                expect(document.body.contains(iframe)).toBe(false);
            });

            it("removes hidden iframe even when waitForBridgeResponse rejects", async () => {
                const iframe = document.createElement("iframe");
                document.body.appendChild(iframe);
                jest.spyOn(ProtocolUtils, "setRequestState").mockReturnValue(
                    TEST_STATE_VALUES.TEST_STATE_SILENT
                );
                jest.spyOn(
                    PkceGenerator,
                    "generatePkceCodes"
                ).mockResolvedValue({
                    challenge: TEST_CONFIG.TEST_CHALLENGE,
                    verifier: TEST_CONFIG.TEST_VERIFIER,
                });
                jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                    RANDOM_TEST_GUID
                );
                jest.spyOn(
                    AuthorizeProtocol,
                    "getAuthCodeRequestUrl"
                ).mockResolvedValue(testNavUrl);
                jest.spyOn(
                    SilentHandler,
                    "initiateCodeRequest"
                ).mockResolvedValue(iframe);
                jest.spyOn(
                    BrowserUtils,
                    "waitForBridgeResponse"
                ).mockRejectedValue(
                    createBrowserAuthError(
                        BrowserAuthErrorCodes.timedOut,
                        "redirect_bridge_timeout"
                    )
                );
                const removeIframeSpy = jest.spyOn(
                    SilentHandler,
                    "removeHiddenIframe"
                );

                await expect(
                    silentIframeClient.acquireToken({
                        redirectUri: TEST_URIS.TEST_REDIR_URI,
                        loginHint: "testLoginHint",
                        account: testAccount,
                    })
                ).rejects.toMatchObject({
                    errorCode: BrowserAuthErrorCodes.timedOut,
                });

                expect(removeIframeSpy).toHaveBeenCalledWith(iframe);
                expect(document.body.contains(iframe)).toBe(false);
            });
        });

        describe("storeInCache tests", () => {
            beforeEach(() => {
                jest.spyOn(
                    BrowserUtils,
                    "waitForBridgeResponse"
                ).mockResolvedValue(TEST_HASHES.TEST_SUCCESS_CODE_HASH_SILENT);
                jest.spyOn(
                    FetchClient.prototype,
                    "sendPostRequestAsync"
                ).mockResolvedValue(TEST_TOKEN_RESPONSE);
                jest.spyOn(
                    PkceGenerator,
                    "generatePkceCodes"
                ).mockResolvedValue({
                    challenge: TEST_CONFIG.TEST_CHALLENGE,
                    verifier: TEST_CONFIG.TEST_VERIFIER,
                });
            });

            it("does not store idToken if storeInCache.idToken = false", async () => {
                const tokenResp = await silentIframeClient.acquireToken({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    storeInCache: {
                        idToken: false,
                    },
                    nonce: ID_TOKEN_CLAIMS.nonce, // Ensures nonce matches the mocked idToken
                });

                // Response should still contain acquired tokens
                expect(tokenResp.idToken).toEqual(
                    TEST_TOKEN_RESPONSE.body.id_token
                );
                expect(tokenResp.accessToken).toEqual(
                    TEST_TOKEN_RESPONSE.body.access_token
                );

                // Cache should not contain tokens which were turned off
                const tokenKeys = browserCacheManager.getTokenKeys();
                expect(tokenKeys.idToken).toHaveLength(0);
                expect(tokenKeys.accessToken).toHaveLength(1);
                expect(tokenKeys.refreshToken).toHaveLength(1);
            });

            it("does not store accessToken if storeInCache.accessToken = false", async () => {
                const tokenResp = await silentIframeClient.acquireToken({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    storeInCache: {
                        accessToken: false,
                    },
                    nonce: ID_TOKEN_CLAIMS.nonce, // Ensures nonce matches the mocked idToken
                });

                // Response should still contain acquired tokens
                expect(tokenResp.idToken).toEqual(
                    TEST_TOKEN_RESPONSE.body.id_token
                );
                expect(tokenResp.accessToken).toEqual(
                    TEST_TOKEN_RESPONSE.body.access_token
                );

                // Cache should not contain tokens which were turned off
                const tokenKeys = browserCacheManager.getTokenKeys();
                expect(tokenKeys.idToken).toHaveLength(1);
                expect(tokenKeys.accessToken).toHaveLength(0);
                expect(tokenKeys.refreshToken).toHaveLength(1);
            });

            it("does not store refreshToken if storeInCache.refreshToken = false", async () => {
                const tokenResp = await silentIframeClient.acquireToken({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    storeInCache: {
                        refreshToken: false,
                    },
                    nonce: ID_TOKEN_CLAIMS.nonce, // Ensures nonce matches the mocked idToken
                });

                // Response should still contain acquired tokens
                expect(tokenResp.idToken).toEqual(
                    TEST_TOKEN_RESPONSE.body.id_token
                );
                expect(tokenResp.accessToken).toEqual(
                    TEST_TOKEN_RESPONSE.body.access_token
                );

                // Cache should not contain tokens which were turned off
                const tokenKeys = browserCacheManager.getTokenKeys();
                expect(tokenKeys.idToken).toHaveLength(1);
                expect(tokenKeys.accessToken).toHaveLength(1);
                expect(tokenKeys.refreshToken).toHaveLength(0);
            });
        });

        describe("EAR Flow Tests", () => {
            const validRequest: SsoSilentRequest = {
                authority: TEST_CONFIG.validAuthority,
                scopes: ["openid", "profile", "offline_access"],
                correlationId: TEST_CONFIG.CORRELATION_ID,
                redirectUri: window.location.href,
                state: TEST_STATE_VALUES.USER_STATE,
                nonce: ID_TOKEN_CLAIMS.nonce,
            };

            beforeAll(() => {
                jest.useFakeTimers();
            });

            afterAll(() => {
                jest.useRealTimers();
            });

            beforeEach(async () => {
                pca = new PublicClientApplication({
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    },
                    system: {
                        protocolMode: ProtocolMode.EAR,
                    },
                });
                await pca.initialize();

                jest.spyOn(BrowserCrypto, "generateEarKey").mockResolvedValue(
                    validEarJWK
                );

                jest.spyOn(
                    BrowserUtils,
                    "waitForBridgeResponse"
                ).mockResolvedValue(
                    `#ear_jwe=${validEarJWE}&state=${TEST_STATE_VALUES.TEST_STATE_SILENT}`
                );
            });

            it("Invokes EAR flow when protocolMode is set to EAR", async () => {
                const earFormSpy = jest
                    .spyOn(SilentHandler, "initiateEarRequest")
                    .mockResolvedValue(document.createElement("iframe"));

                const result = await pca.ssoSilent(validRequest);
                expect(result).toEqual(getTestAuthenticationResult());
                expect(earFormSpy).toHaveBeenCalled();
            });

            it("EAR flow falls back to Auth Code if service returns code instead of ear_jwe", async () => {
                jest.restoreAllMocks();
                jest.spyOn(ProtocolUtils, "setRequestState").mockReturnValue(
                    TEST_STATE_VALUES.TEST_STATE_SILENT
                );

                jest.spyOn(
                    BrowserUtils,
                    "waitForBridgeResponse"
                ).mockResolvedValue(
                    `#code=validCode&state=${TEST_STATE_VALUES.TEST_STATE_SILENT}`
                );
                jest.spyOn(
                    AuthorizeProtocol,
                    "handleResponseCode"
                ).mockResolvedValue(getTestAuthenticationResult());
                const earFormSpy = jest
                    .spyOn(SilentHandler, "initiateEarRequest")
                    .mockResolvedValue(document.createElement("iframe"));

                const result = await pca.ssoSilent(validRequest);
                expect(result).toEqual(getTestAuthenticationResult());
                expect(earFormSpy).toHaveBeenCalled();
            });

            it("throws if protocolMode is set to EAR and httpMethod is set to GET", async () => {
                await expect(
                    pca.ssoSilent({
                        ...validRequest,
                        httpMethod: Constants.HttpMethod.GET,
                    })
                ).rejects.toThrow(
                    createClientConfigurationError(
                        ClientConfigurationErrorCodes.invalidRequestMethodForEAR
                    )
                );
            });
        });
    });

    describe("iframe timeout telemetry", () => {
        beforeEach(() => {
            jest.spyOn(
                AuthorizeProtocol,
                "getAuthCodeRequestUrl"
            ).mockResolvedValue(testNavUrl);
            jest.spyOn(
                InteractionHandler.prototype,
                "handleCodeResponse"
            ).mockResolvedValue(getTestAuthenticationResult());
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
        });

        it("passes experimental config when iframeTimeoutTelemetry is enabled", async () => {
            const waitForBridgeResponseSpy = jest
                .spyOn(BrowserUtils, "waitForBridgeResponse")
                .mockResolvedValue(TEST_HASHES.TEST_SUCCESS_CODE_HASH_SILENT);
            (clientProperties as any).config.experimental = {
                iframeTimeoutTelemetry: true,
            };

            await silentIframeClient.acquireToken({
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                loginHint: "testLoginHint",
            });

            expect(waitForBridgeResponseSpy.mock.calls[0][5]).toEqual({
                iframeTimeoutTelemetry: true,
            });
        });

        it("passes experimental config when iframeTimeoutTelemetry is disabled", async () => {
            const waitForBridgeResponseSpy = jest
                .spyOn(BrowserUtils, "waitForBridgeResponse")
                .mockResolvedValue(TEST_HASHES.TEST_SUCCESS_CODE_HASH_SILENT);
            (clientProperties as any).config.experimental = {
                iframeTimeoutTelemetry: false,
            };

            await silentIframeClient.acquireToken({
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                loginHint: "testLoginHint",
            });

            expect(waitForBridgeResponseSpy.mock.calls[0][5]).toEqual({
                iframeTimeoutTelemetry: false,
            });
        });
    });

    describe("logout", () => {
        it("logout throws unsupported error", async () => {
            await expect(silentIframeClient.logout).rejects.toMatchObject(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.silentLogoutUnsupported
                )
            );
        });
    });
});

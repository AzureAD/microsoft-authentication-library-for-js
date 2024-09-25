import { ServerAuthorizationTokenResponse } from "../../src/response/ServerAuthorizationTokenResponse.js";
import { ResponseHandler } from "../../src/response/ResponseHandler.js";
import {
    AUTHENTICATION_RESULT,
    ID_TOKEN_CLAIMS,
    POP_AUTHENTICATION_RESULT,
    RANDOM_TEST_GUID,
    TEST_CONFIG,
    TEST_CRYPTO_VALUES,
    TEST_DATA_CLIENT_INFO,
    TEST_POP_VALUES,
    TEST_STATE_VALUES,
    TEST_TOKEN_LIFETIMES,
    TEST_TOKENS,
    TEST_URIS,
} from "../test_kit/StringConstants.js";
import { Authority } from "../../src/authority/Authority.js";
import {
    INetworkModule,
    NetworkRequestOptions,
} from "../../src/network/INetworkModule.js";
import { ICrypto } from "../../src/crypto/ICrypto.js";
import { ServerAuthorizationCodeResponse } from "../../src/response/ServerAuthorizationCodeResponse.js";
import { MockStorageClass } from "../client/ClientTestUtils.js";
import { TokenClaims } from "../../src/account/TokenClaims.js";
import { AccountInfo } from "../../src/account/AccountInfo.js";
import { AuthenticationResult } from "../../src/response/AuthenticationResult.js";
import { AuthenticationScheme } from "../../src/utils/Constants.js";
import { AuthorityOptions } from "../../src/authority/AuthorityOptions.js";
import { ProtocolMode } from "../../src/authority/ProtocolMode.js";
import { Logger, LogLevel } from "../../src/logger/Logger.js";
import * as AuthToken from "../../src/account/AuthToken.js";
import { AccountEntity } from "../../src/cache/entities/AccountEntity.js";
import { BaseAuthRequest } from "../../src/request/BaseAuthRequest.js";
import * as TimeUtils from "../../src/utils/TimeUtils.js";
import { AuthError } from "../../src/error/AuthError.js";
import {
    ClientAuthError,
    ClientAuthErrorCodes,
} from "../../src/error/ClientAuthError.js";
import { InteractionRequiredAuthError } from "../../src/error/InteractionRequiredAuthError.js";
import { ServerError } from "../../src/error/ServerError.js";
import {
    CacheError,
    CacheErrorCodes,
    CacheErrorMessages,
} from "../../src/error/CacheError.js";
import { CacheManager } from "../../src/cache/CacheManager.js";
import { cacheQuotaExceededErrorCode } from "../../src/error/CacheErrorCodes.js";

const networkInterface: INetworkModule = {
    sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
        return {} as T;
    },
    sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
        return {} as T;
    },
};
const signedJwt =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJjbmYiOnsia2lkIjoiTnpiTHNYaDh1RENjZC02TU53WEY0V183bm9XWEZaQWZIa3hac1JHQzlYcyJ9fQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
const cryptoInterface: ICrypto = {
    createNewGuid(): string {
        return RANDOM_TEST_GUID;
    },
    base64Decode(input: string): string {
        switch (input) {
            case TEST_POP_VALUES.ENCODED_REQ_CNF:
                return TEST_POP_VALUES.DECODED_REQ_CNF;
            case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
            case TEST_POP_VALUES.SAMPLE_POP_AT_PAYLOAD_ENCODED:
                return TEST_POP_VALUES.SAMPLE_POP_AT_PAYLOAD_DECODED;
            default:
                return input;
        }
    },
    base64Encode(input: string): string {
        switch (input) {
            case TEST_POP_VALUES.DECODED_REQ_CNF:
                return TEST_POP_VALUES.ENCODED_REQ_CNF;
            case TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO:
                return TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO;
            case TEST_POP_VALUES.SAMPLE_POP_AT_PAYLOAD_DECODED:
                return TEST_POP_VALUES.SAMPLE_POP_AT_PAYLOAD_ENCODED;
            default:
                return input;
        }
    },
    base64UrlEncode(input: string): string {
        switch (input) {
            case '{"kid": "XnsuAvttTPp0nn1K_YMLePLDbp7syCKhNHt7HjYHJYc"}':
                return "eyJraWQiOiAiWG5zdUF2dHRUUHAwbm4xS19ZTUxlUExEYnA3c3lDS2hOSHQ3SGpZSEpZYyJ9";
            default:
                return input;
        }
    },
    encodeKid(input: string): string {
        switch (input) {
            case "XnsuAvttTPp0nn1K_YMLePLDbp7syCKhNHt7HjYHJYc":
                return "eyJraWQiOiAiWG5zdUF2dHRUUHAwbm4xS19ZTUxlUExEYnA3c3lDS2hOSHQ3SGpZSEpZYyJ9";
            default:
                return input;
        }
    },
    async getPublicKeyThumbprint(): Promise<string> {
        return TEST_POP_VALUES.KID;
    },
    async signJwt(): Promise<string> {
        return signedJwt;
    },
    async removeTokenBindingKey(): Promise<boolean> {
        return Promise.resolve(true);
    },
    async clearKeystore(): Promise<boolean> {
        return Promise.resolve(true);
    },
    async hashString(): Promise<string> {
        return Promise.resolve(TEST_CRYPTO_VALUES.TEST_SHA256_HASH);
    },
};

const testServerTokenResponse = {
    headers: null,
    status: 200,
    body: {
        token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
        scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
        expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
        ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
        access_token: TEST_TOKENS.ACCESS_TOKEN,
        refresh_token: TEST_TOKENS.REFRESH_TOKEN,
        id_token: TEST_TOKENS.IDTOKEN_V2,
        client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
    },
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
    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_ENCODED_HOME_ACCOUNT_ID,
    localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
    environment: "login.windows.net",
    tenantId: testIdTokenClaims.tid || "",
    username: testIdTokenClaims.preferred_username || "",
};

const authorityOptions: AuthorityOptions = {
    protocolMode: ProtocolMode.AAD,
    knownAuthorities: ["login.microsoftonline.com"],
    cloudDiscoveryMetadata: "",
    authorityMetadata: "",
};

const testLoggerCallback = (
    level: LogLevel,
    message: string,
    containsPii: boolean
): void => {
    if (containsPii) {
        console.log(`Log level: ${level} Message: ${message}`);
    }
};
const loggerOptions = {
    loggerCallback: testLoggerCallback,
};
const logger = new Logger(loggerOptions);

const testCacheManager = new MockStorageClass(
    TEST_CONFIG.MSAL_CLIENT_ID,
    cryptoInterface,
    logger
);

const testAuthority = new Authority(
    "https://login.microsoftonline.com/common",
    networkInterface,
    testCacheManager,
    authorityOptions,
    logger,
    TEST_CONFIG.CORRELATION_ID
);

describe("ResponseHandler.ts", () => {
    let preferredCacheStub: jest.SpyInstance;
    let claimsStub: jest.SpyInstance;
    beforeEach(() => {
        preferredCacheStub = jest
            .spyOn(Authority.prototype, "getPreferredCache")
            .mockReturnValue("login.microsoftonline.com");
        claimsStub = jest
            .spyOn(AuthToken, "extractTokenClaims")
            .mockImplementation((encodedIdToken, crypto) => {
                return ID_TOKEN_CLAIMS as TokenClaims;
            });
        jest.spyOn(AccountEntity.prototype, "getAccountInfo").mockReturnValue({
            homeAccountId: TEST_DATA_CLIENT_INFO.TEST_ENCODED_HOME_ACCOUNT_ID,
            localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
            environment: "login.windows.net",
            tenantId: "testTenantId",
            username: "test@contoso.com",
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("generateCacheRecord", () => {
        it("throws invalid cache environment error", async () => {
            preferredCacheStub.mockReturnValue("");
            const testRequest: BaseAuthRequest = {
                authority: testAuthority.canonicalAuthority,
                correlationId: "CORRELATION_ID",
                scopes: ["openid", "profile", "User.Read", "email"],
            };
            const testResponse: ServerAuthorizationTokenResponse = {
                ...AUTHENTICATION_RESULT.body,
            };
            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );
            try {
                const timestamp = TimeUtils.nowSeconds();
                const tokenResp =
                    await responseHandler.handleServerTokenResponse(
                        testResponse,
                        testAuthority,
                        timestamp,
                        testRequest
                    );
                expect(tokenResp).toBeUndefined();
            } catch (e) {
                if (e instanceof AuthError) {
                    expect(e).toBeInstanceOf(ClientAuthError);
                    expect(e.errorCode).toBe(
                        ClientAuthErrorCodes.invalidCacheEnvironment
                    );
                } else {
                    throw e;
                }
            }
        });

        it("does not create AccessTokenEntity if access_token not in response", (done) => {
            const testRequest: BaseAuthRequest = {
                authority: testAuthority.canonicalAuthority,
                correlationId: "CORRELATION_ID",
                scopes: ["openid", "profile", "User.Read", "email"],
            };
            const testResponse: ServerAuthorizationTokenResponse = {
                ...AUTHENTICATION_RESULT.body,
            };
            testResponse.access_token = undefined;

            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid || "",
                tenantId: testIdTokenClaims.tid || "",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: testResponse.id_token || "",
                idTokenClaims: testIdTokenClaims,
                accessToken: "",
                fromCache: false,
                correlationId: "CORRELATION_ID",
                expiresOn: new Date(
                    Date.now() + testServerTokenResponse.body.expires_in * 1000
                ),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
            };

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );

            jest.spyOn(
                ResponseHandler,
                "generateAuthenticationResult"
            ).mockImplementation(
                async (
                    cryptoObj,
                    authority,
                    cacheRecord,
                    request,
                    idTokenObj,
                    fromTokenCache,
                    stateString
                ) => {
                    expect(authority).toBe(testAuthority);
                    expect(cacheRecord.idToken).not.toBeNull();
                    expect(cacheRecord.accessToken).toBeNull();
                    expect(cacheRecord.refreshToken).not.toBeNull();
                    done();
                    return testTokenResponse;
                }
            );
            const timestamp = TimeUtils.nowSeconds();
            responseHandler.handleServerTokenResponse(
                testResponse,
                testAuthority,
                timestamp,
                testRequest
            );
        });

        it("does not create RefreshTokenEntity if refresh_token not in response", (done) => {
            const testRequest: BaseAuthRequest = {
                authority: testAuthority.canonicalAuthority,
                correlationId: "CORRELATION_ID",
                scopes: ["openid", "profile", "User.Read", "email"],
            };
            const testResponse: ServerAuthorizationTokenResponse = {
                ...AUTHENTICATION_RESULT.body,
            };
            testResponse.refresh_token = undefined;

            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid || "",
                tenantId: testIdTokenClaims.tid || "",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: testResponse.id_token || "",
                idTokenClaims: testIdTokenClaims,
                accessToken: testResponse.access_token || "",
                fromCache: false,
                correlationId: "CORRELATION_ID",
                expiresOn: new Date(
                    Date.now() + testServerTokenResponse.body.expires_in * 1000
                ),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
            };

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );

            jest.spyOn(
                ResponseHandler,
                "generateAuthenticationResult"
            ).mockImplementation(
                async (
                    cryptoObj,
                    authority,
                    cacheRecord,
                    request,
                    idTokenObj,
                    fromTokenCache,
                    stateString
                ) => {
                    expect(authority).toBe(testAuthority);
                    expect(cacheRecord.idToken).not.toBeNull();
                    expect(cacheRecord.accessToken).not.toBeNull();
                    expect(cacheRecord.refreshToken).toBeNull();
                    done();
                    return testTokenResponse;
                }
            );

            const timestamp = TimeUtils.nowSeconds();
            responseHandler.handleServerTokenResponse(
                testResponse,
                testAuthority,
                timestamp,
                testRequest
            );
        });

        it("create CacheRecord with all token entities", (done) => {
            const testRequest: BaseAuthRequest = {
                authority: testAuthority.canonicalAuthority,
                correlationId: "CORRELATION_ID",
                scopes: ["openid", "profile", "User.Read", "email"],
            };
            const testResponse: ServerAuthorizationTokenResponse = {
                ...AUTHENTICATION_RESULT.body,
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid || "",
                tenantId: testIdTokenClaims.tid || "",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: testResponse.id_token || "",
                idTokenClaims: testIdTokenClaims,
                accessToken: testResponse.access_token || "",
                fromCache: false,
                correlationId: "CORRELATION_ID",
                expiresOn: new Date(
                    Date.now() + testServerTokenResponse.body.expires_in * 1000
                ),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
            };

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );

            jest.spyOn(
                ResponseHandler,
                "generateAuthenticationResult"
            ).mockImplementation(
                async (
                    cryptoObj,
                    authority,
                    cacheRecord,
                    request,
                    idTokenObj,
                    fromTokenCache,
                    stateString
                ) => {
                    expect(authority).toBe(testAuthority);
                    expect(cacheRecord.idToken).not.toBeNull();
                    expect(cacheRecord.accessToken).not.toBeNull();
                    expect(cacheRecord.refreshToken).not.toBeNull();
                    done();
                    return testTokenResponse;
                }
            );

            const timestamp = TimeUtils.nowSeconds();
            responseHandler.handleServerTokenResponse(
                testResponse,
                testAuthority,
                timestamp,
                testRequest
            );
        });

        it("includes spa_code in response as code", async () => {
            const testSpaCode = "sample-spa-code";

            const testRequest: BaseAuthRequest = {
                authority: testAuthority.canonicalAuthority,
                correlationId: "CORRELATION_ID",
                scopes: ["openid", "profile", "User.Read", "email"],
            };
            const testResponse: ServerAuthorizationTokenResponse = {
                ...AUTHENTICATION_RESULT.body,
                spa_code: testSpaCode,
            };

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );

            const timestamp = TimeUtils.nowSeconds();
            const response = await responseHandler.handleServerTokenResponse(
                testResponse,
                testAuthority,
                timestamp,
                testRequest
            );
            expect(response.code).toEqual(testSpaCode);
        });

        it("should ensure realm property in cached access token if no tenant id is available via claim or authority (OIDC scenario)", (done) => {
            const { tid, ...tokenClaims } = ID_TOKEN_CLAIMS;

            claimsStub = jest
                .spyOn(AuthToken, "extractTokenClaims")
                .mockReturnValue(tokenClaims);

            const testResponse: ServerAuthorizationTokenResponse = {
                token_type: AuthenticationScheme.BEARER,
                scope: "openid",
                expires_in: 3599,
                ext_expires_in: 3599,
                access_token: "access-token",
                refresh_token: "refresh-token",
                id_token: "id-token",
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
            };

            const testAuthority = new Authority(
                "https://login.live.com",
                networkInterface,
                testCacheManager,
                {
                    protocolMode: ProtocolMode.OIDC,
                    knownAuthorities: ["login.live.com"],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: "",
                },
                logger,
                TEST_CONFIG.CORRELATION_ID
            );

            const timestamp = TimeUtils.nowSeconds();

            const testRequest: BaseAuthRequest = {
                authority: testAuthority.canonicalAuthority,
                correlationId: "CORRELATION_ID",
                scopes: ["openid"],
            };

            const responseHandler = new ResponseHandler(
                "client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );

            jest.spyOn(
                ResponseHandler,
                "generateAuthenticationResult"
            ).mockImplementation(
                async (
                    _cryptoObj,
                    _authority,
                    cacheRecord,
                    _fromTokenCache,
                    _request,
                    _idTokenClaims,
                    _requestState,
                    _serverTokenResponse,
                    _requestId
                ) => {
                    expect(cacheRecord.accessToken?.realm).toBeDefined();

                    done();

                    return {} as AuthenticationResult;
                }
            );

            responseHandler.handleServerTokenResponse(
                testResponse,
                testAuthority,
                timestamp,
                testRequest
            );
        });
    });

    describe("generateAuthenticationResult", () => {
        it("sets default values if refresh_token not in cacheRecord", async () => {
            const testRequest: BaseAuthRequest = {
                authority: testAuthority.canonicalAuthority,
                correlationId: "CORRELATION_ID",
                scopes: ["openid", "profile", "User.Read", "email"],
            };
            const testResponse: ServerAuthorizationTokenResponse = {
                ...AUTHENTICATION_RESULT.body,
            };
            testResponse.refresh_token = undefined;

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );
            const timestamp = TimeUtils.nowSeconds();
            const result = await responseHandler.handleServerTokenResponse(
                testResponse,
                testAuthority,
                timestamp,
                testRequest
            );

            expect(result.familyId).toBe("");
        });

        it("sets default values for access token using PoP scheme", async () => {
            const testRequest: BaseAuthRequest = {
                authority: testAuthority.canonicalAuthority,
                correlationId: "CORRELATION_ID",
                scopes: ["openid", "profile", "User.Read", "email"],
                resourceRequestMethod: "POST",
                resourceRequestUri: TEST_URIS.TEST_RESOURCE_ENDPT_WITH_PARAMS,
            };
            const testResponse: ServerAuthorizationTokenResponse = {
                ...POP_AUTHENTICATION_RESULT.body,
            };
            claimsStub.mockImplementation(
                (encodedToken: string, crypto: ICrypto): TokenClaims | null => {
                    switch (encodedToken) {
                        case testResponse.id_token:
                            return ID_TOKEN_CLAIMS as TokenClaims;
                        case testResponse.access_token:
                            return {
                                cnf: {
                                    kid: TEST_POP_VALUES.KID,
                                },
                            };
                        default:
                            return null;
                    }
                }
            );

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );
            const timestamp = TimeUtils.nowSeconds();
            const result = await responseHandler.handleServerTokenResponse(
                testResponse,
                testAuthority,
                timestamp,
                testRequest
            );

            expect(result.tokenType).toBe(AuthenticationScheme.POP);
            expect(result.accessToken).toBe(signedJwt);
        });

        it("Does not sign access token when PoP kid is set and PoP scheme enabled", async () => {
            const testRequest: BaseAuthRequest = {
                authority: testAuthority.canonicalAuthority,
                correlationId: "CORRELATION_ID",
                scopes: ["openid", "profile", "User.Read", "email"],
                popKid: TEST_POP_VALUES.POPKID,
            };
            const testResponse: ServerAuthorizationTokenResponse = {
                ...POP_AUTHENTICATION_RESULT.body,
            };
            claimsStub.mockImplementation(
                (encodedToken: string, crypto: ICrypto): TokenClaims | null => {
                    switch (encodedToken) {
                        case testResponse.id_token:
                            return ID_TOKEN_CLAIMS as TokenClaims;
                        case testResponse.access_token:
                            return {
                                cnf: {
                                    kid: TEST_POP_VALUES.KID,
                                },
                            };
                        default:
                            return null;
                    }
                }
            );

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );
            const timestamp = TimeUtils.nowSeconds();
            const result = await responseHandler.handleServerTokenResponse(
                testResponse,
                testAuthority,
                timestamp,
                testRequest
            );

            expect(result.tokenType).toBe(AuthenticationScheme.POP);
            expect(result.accessToken).toBe(testResponse.access_token);
        });

        it("sets default value if requestId not provided", async () => {
            const testRequest: BaseAuthRequest = {
                authority: testAuthority.canonicalAuthority,
                correlationId: "CORRELATION_ID",
                scopes: ["openid", "profile", "User.Read", "email"],
            };
            const testResponse: ServerAuthorizationTokenResponse = {
                ...AUTHENTICATION_RESULT.body,
            };
            testResponse.refresh_token = undefined;

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );
            const timestamp = TimeUtils.nowSeconds();
            const result = await responseHandler.handleServerTokenResponse(
                testResponse,
                testAuthority,
                timestamp,
                testRequest
            );

            expect(result.requestId).toBe("");
        });
    });

    describe("validateServerAuthorizationCodeResponse", () => {
        it("throws state mismatch error", (done) => {
            const testServerCodeResponse: ServerAuthorizationCodeResponse = {
                code: "testCode",
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                state: TEST_STATE_VALUES.URI_ENCODED_LIB_STATE,
            };

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );

            try {
                responseHandler.validateServerAuthorizationCodeResponse(
                    testServerCodeResponse,
                    "differentState"
                );
            } catch (e) {
                expect(e).toBeInstanceOf(ClientAuthError);
                // @ts-ignore
                expect(e.errorCode).toBe(ClientAuthErrorCodes.stateMismatch);
                done();
            }
        });

        it("Does not throw state mismatch error when states match", () => {
            const testServerCodeResponse: ServerAuthorizationCodeResponse = {
                code: "testCode",
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                state: TEST_STATE_VALUES.URI_ENCODED_LIB_STATE,
            };

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );
            responseHandler.validateServerAuthorizationCodeResponse(
                testServerCodeResponse,
                TEST_STATE_VALUES.URI_ENCODED_LIB_STATE
            );
        });

        it("Does not throw state mismatch error when Uri encoded characters have different casing", () => {
            const testServerCodeResponse: ServerAuthorizationCodeResponse = {
                code: "testCode",
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                state: TEST_STATE_VALUES.URI_ENCODED_LIB_STATE,
            };

            const testAltState =
                "eyJpZCI6IjExNTUzYTliLTcxMTYtNDhiMS05ZDQ4LWY2ZDRhOGZmODM3MSIsInRzIjoxNTkyODQ2NDgyfQ%3d%3d";
            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );
            responseHandler.validateServerAuthorizationCodeResponse(
                testServerCodeResponse,
                testAltState
            );
        });

        it("throws interactionRequiredError", (done) => {
            const testServerCodeResponse: ServerAuthorizationCodeResponse = {
                code: "testCode",
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                state: TEST_STATE_VALUES.URI_ENCODED_LIB_STATE,
                error: "interaction_required",
            };

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );
            try {
                responseHandler.validateServerAuthorizationCodeResponse(
                    testServerCodeResponse,
                    TEST_STATE_VALUES.URI_ENCODED_LIB_STATE
                );
            } catch (e) {
                expect(e).toBeInstanceOf(InteractionRequiredAuthError);
                done();
            }
        });

        it("thows ServerError if error in response", (done) => {
            const testServerCodeResponse: ServerAuthorizationCodeResponse = {
                code: "testCode",
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                state: TEST_STATE_VALUES.URI_ENCODED_LIB_STATE,
                error: "test_error",
            };

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );
            try {
                responseHandler.validateServerAuthorizationCodeResponse(
                    testServerCodeResponse,
                    TEST_STATE_VALUES.URI_ENCODED_LIB_STATE
                );
            } catch (e) {
                expect(e).toBeInstanceOf(ServerError);
                done();
            }
        });

        it("throws ServerError if error_description in response", (done) => {
            const testServerCodeResponse: ServerAuthorizationCodeResponse = {
                code: "testCode",
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                state: TEST_STATE_VALUES.URI_ENCODED_LIB_STATE,
                error_description: "test_error",
            };

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );
            try {
                responseHandler.validateServerAuthorizationCodeResponse(
                    testServerCodeResponse,
                    TEST_STATE_VALUES.URI_ENCODED_LIB_STATE
                );
            } catch (e) {
                expect(e).toBeInstanceOf(ServerError);
                done();
            }
        });

        it("throws ServerError if suberror in response", (done) => {
            const testServerCodeResponse: ServerAuthorizationCodeResponse = {
                code: "testCode",
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                state: TEST_STATE_VALUES.URI_ENCODED_LIB_STATE,
                suberror: "test_error",
            };

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );
            try {
                responseHandler.validateServerAuthorizationCodeResponse(
                    testServerCodeResponse,
                    TEST_STATE_VALUES.URI_ENCODED_LIB_STATE
                );
            } catch (e) {
                expect(e).toBeInstanceOf(ServerError);
                done();
            }
        });

        it("does not call buildClientInfo if clientInfo not in response", () => {
            const testServerCodeResponse: ServerAuthorizationCodeResponse = {
                code: "testCode",
                state: TEST_STATE_VALUES.URI_ENCODED_LIB_STATE,
            };
            // Can't spy on buildClientInfo, spy on one of its function calls instead
            const buildClientInfoSpy = jest.spyOn(
                cryptoInterface,
                "base64Decode"
            );

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );
            responseHandler.validateServerAuthorizationCodeResponse(
                testServerCodeResponse,
                TEST_STATE_VALUES.URI_ENCODED_LIB_STATE
            );
            expect(buildClientInfoSpy).not.toHaveBeenCalled();
        });

        it("throws invalid state error", (done) => {
            const testServerCodeResponse: ServerAuthorizationCodeResponse = {
                code: "testCode",
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                state: TEST_STATE_VALUES.URI_ENCODED_LIB_STATE,
            };

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );

            try {
                responseHandler.validateServerAuthorizationCodeResponse(
                    testServerCodeResponse,
                    "dummy-state-%20%%%30%%%%%40"
                );
            } catch (e) {
                expect(e).toBeInstanceOf(ClientAuthError);
                const err = e as ClientAuthError;
                expect(err.errorCode).toBe(ClientAuthErrorCodes.invalidState);
                done();
            }
        });

        it("throws ServerError and parser error no", (done) => {
            const testServerCodeResponse: ServerAuthorizationCodeResponse = {
                code: "testCode",
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                state: TEST_STATE_VALUES.URI_ENCODED_LIB_STATE,
                error: "test_error",
                error_uri:
                    "https://login.microsoftonline.com/error_code=500011",
            };

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );
            try {
                responseHandler.validateServerAuthorizationCodeResponse(
                    testServerCodeResponse,
                    TEST_STATE_VALUES.URI_ENCODED_LIB_STATE
                );
            } catch (e) {
                expect(e).toBeInstanceOf(ServerError);
                const serverError = e as ServerError;
                expect(serverError.errorNo).toEqual("500011");
                done();
            }
        });

        it("throws InteractionRequiredAuthError and parser error no", (done) => {
            const testServerCodeResponse: ServerAuthorizationCodeResponse = {
                code: "testCode",
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                state: TEST_STATE_VALUES.URI_ENCODED_LIB_STATE,
                error: "interaction_required",
                error_uri:
                    "https://login.microsoftonline.com/error_code=500011",
            };

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );
            try {
                responseHandler.validateServerAuthorizationCodeResponse(
                    testServerCodeResponse,
                    TEST_STATE_VALUES.URI_ENCODED_LIB_STATE
                );
            } catch (e) {
                expect(e).toBeInstanceOf(InteractionRequiredAuthError);
                const serverError = e as InteractionRequiredAuthError;
                expect(serverError.errorNo).toEqual("500011");
                done();
            }
        });

        it("throws ServerError and skips invalid error uri", (done) => {
            const testServerCodeResponse: ServerAuthorizationCodeResponse = {
                code: "testCode",
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                state: TEST_STATE_VALUES.URI_ENCODED_LIB_STATE,
                error: "test_error",
                error_uri: "https://login.microsoftonline.com/500011",
            };

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );
            try {
                responseHandler.validateServerAuthorizationCodeResponse(
                    testServerCodeResponse,
                    TEST_STATE_VALUES.URI_ENCODED_LIB_STATE
                );
            } catch (e) {
                expect(e).toBeInstanceOf(ServerError);
                const serverError = e as ServerError;
                expect(serverError.errorNo).toBeUndefined();
                done();
            }
        });

        it("throws ServerError and skips undefined error uri", (done) => {
            const testServerCodeResponse: ServerAuthorizationCodeResponse = {
                code: "testCode",
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                state: TEST_STATE_VALUES.URI_ENCODED_LIB_STATE,
                error: "test_error",
                error_uri: undefined,
            };

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );
            try {
                responseHandler.validateServerAuthorizationCodeResponse(
                    testServerCodeResponse,
                    TEST_STATE_VALUES.URI_ENCODED_LIB_STATE
                );
            } catch (e) {
                expect(e).toBeInstanceOf(ServerError);
                const serverError = e as ServerError;
                expect(serverError.errorNo).toBeUndefined();
                done();
            }
        });

        it("throws ServerError and skips empty error uri", (done) => {
            const testServerCodeResponse: ServerAuthorizationCodeResponse = {
                code: "testCode",
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                state: TEST_STATE_VALUES.URI_ENCODED_LIB_STATE,
                error: "test_error",
                error_uri: "",
            };

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );
            try {
                responseHandler.validateServerAuthorizationCodeResponse(
                    testServerCodeResponse,
                    TEST_STATE_VALUES.URI_ENCODED_LIB_STATE
                );
            } catch (e) {
                expect(e).toBeInstanceOf(ServerError);
                const serverError = e as ServerError;
                expect(serverError.errorNo).toBeUndefined();
                done();
            }
        });
    });

    describe("validateTokenResponse", () => {
        it("captures server error no", (done) => {
            const testTokenResponse: ServerAuthorizationTokenResponse = {
                error: "test error",
                error_description: "test error description",
                error_codes: ["50011"],
            };

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );

            try {
                responseHandler.validateTokenResponse(testTokenResponse);
            } catch (e) {
                expect(e).toBeInstanceOf(ServerError);
                const serverError = e as ServerError;
                expect(serverError.errorCode).toEqual(testTokenResponse.error);
                expect(serverError.errorMessage).toContain(
                    testTokenResponse.error_description
                );
                expect(serverError.errorNo).toEqual(
                    testTokenResponse.error_codes![0]
                );
                done();
            }
        });

        it("captures InteractionRequiredAuthError error no", (done) => {
            const testTokenResponse: ServerAuthorizationTokenResponse = {
                error: "interaction_required",
                error_description: "test error description",
                error_codes: ["50011"],
            };

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );

            try {
                responseHandler.validateTokenResponse(testTokenResponse);
            } catch (e) {
                expect(e).toBeInstanceOf(InteractionRequiredAuthError);
                const serverError = e as InteractionRequiredAuthError;
                expect(serverError.errorCode).toEqual(testTokenResponse.error);
                expect(serverError.errorMessage).toContain(
                    testTokenResponse.error_description
                );
                expect(serverError.errorNo).toEqual(
                    testTokenResponse.error_codes![0]
                );
                done();
            }
        });

        it("captures first server error no when multiple provided", (done) => {
            const testTokenResponse: ServerAuthorizationTokenResponse = {
                error: "test error",
                error_description: "test error description",
                error_codes: ["50011", "12345"],
            };

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );

            try {
                responseHandler.validateTokenResponse(testTokenResponse);
            } catch (e) {
                expect(e).toBeInstanceOf(ServerError);
                const serverError = e as ServerError;
                expect(serverError.errorCode).toEqual(testTokenResponse.error);
                expect(serverError.errorMessage).toContain(
                    testTokenResponse.error_description
                );
                expect(serverError.errorNo).toEqual(
                    testTokenResponse.error_codes![0]
                );
                done();
            }
        });

        it("skips error no when no error codes are provided", (done) => {
            const testTokenResponse: ServerAuthorizationTokenResponse = {
                error: "test error",
                error_description: "test error description",
                error_codes: [],
            };

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );

            try {
                responseHandler.validateTokenResponse(testTokenResponse);
            } catch (e) {
                expect(e).toBeInstanceOf(ServerError);
                const serverError = e as ServerError;
                expect(serverError.errorCode).toEqual(testTokenResponse.error);
                expect(serverError.errorMessage).toContain(
                    testTokenResponse.error_description
                );
                expect(serverError.errorNo).toBeUndefined();
                done();
            }
        });
    });

    describe("captures cache error", () => {
        it("captures cache quota error by checking error code", async () => {
            const testRequest: BaseAuthRequest = {
                authority: testAuthority.canonicalAuthority,
                correlationId: "CORRELATION_ID",
                scopes: ["openid", "profile", "User.Read", "email"],
            };
            const testResponse: ServerAuthorizationTokenResponse = {
                ...AUTHENTICATION_RESULT.body,
            };
            const errorMessage = "storage error message";
            const quotaExceededError = new Error(errorMessage);
            quotaExceededError.name = "QuotaExceededError";

            jest.spyOn(
                CacheManager.prototype,
                <any>"saveAccessToken"
            ).mockRejectedValue(quotaExceededError);

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );

            try {
                const timestamp = TimeUtils.nowSeconds();
                await responseHandler.handleServerTokenResponse(
                    testResponse,
                    testAuthority,
                    timestamp,
                    testRequest
                );
                throw Error("should throw cache error");
            } catch (e) {
                expect(e).toBeInstanceOf(CacheError);
                const cacheError: CacheError = e as CacheError;
                expect(cacheError.errorCode).toEqual("cache_quota_exceeded");
                expect(cacheError.errorMessage).toEqual(
                    CacheErrorMessages[cacheQuotaExceededErrorCode]
                );
            }
        });

        it("captures cache quota error by checking error message", async () => {
            const testRequest: BaseAuthRequest = {
                authority: testAuthority.canonicalAuthority,
                correlationId: "CORRELATION_ID",
                scopes: ["openid", "profile", "User.Read", "email"],
            };
            const testResponse: ServerAuthorizationTokenResponse = {
                ...AUTHENTICATION_RESULT.body,
            };
            const errorMessage =
                "Failed to run localstorage.setItem(). Local storage exceeded the quota.";
            const quotaExceededError = new Error(errorMessage);

            jest.spyOn(
                CacheManager.prototype,
                <any>"saveAccessToken"
            ).mockRejectedValue(quotaExceededError);

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );

            try {
                const timestamp = TimeUtils.nowSeconds();
                await responseHandler.handleServerTokenResponse(
                    testResponse,
                    testAuthority,
                    timestamp,
                    testRequest
                );
                throw Error("should throw cache error");
            } catch (e) {
                expect(e).toBeInstanceOf(CacheError);
                const cacheError: CacheError = e as CacheError;
                expect(cacheError.errorCode).toEqual("cache_quota_exceeded");
                expect(cacheError.errorMessage).toEqual(
                    CacheErrorMessages[cacheQuotaExceededErrorCode]
                );
            }
        });

        it("captures dummy cache error", async () => {
            const testRequest: BaseAuthRequest = {
                authority: testAuthority.canonicalAuthority,
                correlationId: "CORRELATION_ID",
                scopes: ["openid", "profile", "User.Read", "email"],
            };
            const testResponse: ServerAuthorizationTokenResponse = {
                ...AUTHENTICATION_RESULT.body,
            };
            const errorMessage = "Dummy cache error";
            const error = new Error(errorMessage);
            error.name = "DummyError";

            jest.spyOn(
                CacheManager.prototype,
                <any>"saveAccessToken"
            ).mockRejectedValue(error);

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );

            try {
                const timestamp = TimeUtils.nowSeconds();
                await responseHandler.handleServerTokenResponse(
                    testResponse,
                    testAuthority,
                    timestamp,
                    testRequest
                );
                throw Error("should throw cache error");
            } catch (e) {
                expect(e).toBeInstanceOf(CacheError);
                const cacheError: CacheError = e as CacheError;
                expect(cacheError.errorCode).toEqual("DummyError");
                expect(cacheError.errorMessage).toEqual(errorMessage);
            }
        });

        it("captures unknown cache error", async () => {
            const testRequest: BaseAuthRequest = {
                authority: testAuthority.canonicalAuthority,
                correlationId: "CORRELATION_ID",
                scopes: ["openid", "profile", "User.Read", "email"],
            };
            const testResponse: ServerAuthorizationTokenResponse = {
                ...AUTHENTICATION_RESULT.body,
            };
            const errorMessage = "Dummy cache error";
            const error = new DOMException(errorMessage);

            jest.spyOn(
                CacheManager.prototype,
                <any>"saveAccessToken"
            ).mockRejectedValue(error);

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                null,
                null
            );

            try {
                const timestamp = TimeUtils.nowSeconds();
                await responseHandler.handleServerTokenResponse(
                    testResponse,
                    testAuthority,
                    timestamp,
                    testRequest
                );
                throw Error("should throw cache error");
            } catch (e) {
                expect(e).toBeInstanceOf(CacheError);
                const cacheError: CacheError = e as CacheError;
                expect(cacheError.errorCode).toEqual(
                    CacheErrorCodes.cacheUnknownErrorCode
                );
                expect(cacheError.errorMessage).toEqual(
                    CacheErrorMessages[CacheErrorCodes.cacheUnknownErrorCode]
                );
            }
        });
    });
});

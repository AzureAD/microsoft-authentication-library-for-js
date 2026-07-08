import { TestTimeUtils } from "msal-test-utils";
import { AccountInfo } from "../../src/account/AccountInfo.js";
import * as AuthToken from "../../src/account/AuthToken.js";
import { TokenClaims } from "../../src/account/TokenClaims.js";
import { Authority } from "../../src/authority/Authority.js";
import { AuthorityOptions } from "../../src/authority/AuthorityOptions.js";
import { ProtocolMode } from "../../src/authority/ProtocolMode.js";
import { CacheManager } from "../../src/cache/CacheManager.js";
import * as AccountEntityUtils from "../../src/cache/utils/AccountEntityUtils.js";
import { ICrypto } from "../../src/crypto/ICrypto.js";
import {
    AuthError,
    getDefaultErrorMessage,
} from "../../src/error/AuthError.js";
import { CacheError, CacheErrorCodes } from "../../src/error/CacheError.js";
import { cacheQuotaExceeded } from "../../src/error/CacheErrorCodes.js";
import {
    ClientAuthError,
    ClientAuthErrorCodes,
} from "../../src/error/ClientAuthError.js";
import { InteractionRequiredAuthError } from "../../src/error/InteractionRequiredAuthError.js";
import { ServerError } from "../../src/error/ServerError.js";
import { Logger, LogLevel } from "../../src/logger/Logger.js";
import {
    INetworkModule,
    NetworkRequestOptions,
} from "../../src/network/INetworkModule.js";
import { BaseAuthRequest } from "../../src/request/BaseAuthRequest.js";
import { AuthenticationResult } from "../../src/response/AuthenticationResult.js";
import {
    buildAccountToCache,
    ResponseHandler,
} from "../../src/response/ResponseHandler.js";
import { ServerAuthorizationTokenResponse } from "../../src/response/ServerAuthorizationTokenResponse.js";
import { StubPerformanceClient } from "../../src/telemetry/performance/StubPerformanceClient.js";
import { AuthenticationScheme } from "../../src/utils/Constants.js";
import * as TimeUtils from "../../src/utils/TimeUtils.js";
import { mockCrypto, MockStorageClass } from "../client/ClientTestUtils.js";
import {
    AUTHENTICATION_RESULT,
    TEST_CRYPTO_VALUES,
    ID_TOKEN_CLAIMS,
    POP_AUTHENTICATION_RESULT,
    TEST_CONFIG,
    TEST_DATA_CLIENT_INFO,
    TEST_POP_VALUES,
    TEST_TOKEN_LIFETIMES,
    TEST_TOKENS,
    TEST_URIS,
} from "../test_kit/StringConstants.js";

const networkInterface: INetworkModule = {
    sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
        return {} as T;
    },
    sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
        return {} as T;
    },
};

const cryptoInterface: ICrypto = mockCrypto;

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
    login_hint: "testLoginHint",
};
const testAccount: AccountInfo = {
    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_ENCODED_HOME_ACCOUNT_ID,
    localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
    environment: "login.windows.net",
    tenantId: testIdTokenClaims.tid || "",
    username: testIdTokenClaims.preferred_username || "",
    loginHint: testIdTokenClaims.login_hint,
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
    logger,
    new StubPerformanceClient(),
    { canonicalAuthority: TEST_CONFIG.validAuthority }
);

const testAuthority = new Authority(
    "https://login.microsoftonline.com/common",
    networkInterface,
    testCacheManager,
    authorityOptions,
    logger,
    TEST_CONFIG.CORRELATION_ID,
    new StubPerformanceClient()
);

const stubPerformanceClient = new StubPerformanceClient();

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
        jest.spyOn(AccountEntityUtils, "getAccountInfo").mockReturnValue({
            homeAccountId: TEST_DATA_CLIENT_INFO.TEST_ENCODED_HOME_ACCOUNT_ID,
            localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
            environment: "login.windows.net",
            tenantId: "testTenantId",
            username: "test@contoso.com",
            loginHint: "testLoginHint",
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
                stubPerformanceClient,
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
                        testRequest,
                        0
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
                expiresOn: TestTimeUtils.nowDateWithOffset(
                    testServerTokenResponse.body.expires_in
                ),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
            };

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                stubPerformanceClient,
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
                testRequest,
                0
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
                expiresOn: TestTimeUtils.nowDateWithOffset(
                    testServerTokenResponse.body.expires_in
                ),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
            };

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                stubPerformanceClient,
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
                testRequest,
                0
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
                expiresOn: TestTimeUtils.nowDateWithOffset(
                    testServerTokenResponse.body.expires_in
                ),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
            };

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                stubPerformanceClient,
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
                testRequest,
                0
            );
        });

        it("adds rt expiry to performance fields when refresh_token_expires_in provided", async () => {
            const testRequest: BaseAuthRequest = {
                authority: testAuthority.canonicalAuthority,
                correlationId: "CORRELATION_ID",
                scopes: ["openid", "profile", "User.Read", "email"],
            };
            const refreshTokenExpiresIn = 600;
            const testResponse: ServerAuthorizationTokenResponse = {
                ...AUTHENTICATION_RESULT.body,
                refresh_token_expires_in: refreshTokenExpiresIn,
            };

            const perfClient = new StubPerformanceClient();
            const addFieldsSpy = jest.spyOn(perfClient, "addFields");

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                perfClient,
                null,
                null
            );

            const reqTimestamp = 1000;
            await responseHandler.handleServerTokenResponse(
                testResponse,
                testAuthority,
                reqTimestamp,
                testRequest,
                0
            );

            expect(addFieldsSpy).toHaveBeenCalledWith(
                {
                    ntwkRtExpiresOnSeconds:
                        reqTimestamp + refreshTokenExpiresIn,
                },
                testRequest.correlationId
            );
        });

        it("persists attribute-token partition and precomputed hash on access token entity", (done) => {
            const testRequest: BaseAuthRequest = {
                authority: testAuthority.canonicalAuthority,
                correlationId: "CORRELATION_ID",
                scopes: ["openid", "profile", "User.Read", "email"],
                attributeTokens: ["zeta", "alpha"],
            };
            const testResponse: ServerAuthorizationTokenResponse = {
                ...AUTHENTICATION_RESULT.body,
            };
            const hashStringSpy = jest.spyOn(cryptoInterface, "hashString");

            const responseHandler = new ResponseHandler(
                "this-is-a-client-id",
                testCacheManager,
                cryptoInterface,
                logger,
                stubPerformanceClient,
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
                    try {
                        expect(
                            cacheRecord.accessToken
                                ?.additionalCacheKeyComponents
                        ).toEqual({
                            attribute_tokens: "attribute_tokens:alpha zeta",
                        });
                        expect(hashStringSpy).toHaveBeenCalledWith(
                            "attribute_tokensattribute_tokens:alpha zeta"
                        );
                        expect(
                            cacheRecord.accessToken
                                ?.additionalCacheKeyComponentsHash
                        ).toBe(TEST_CRYPTO_VALUES.TEST_SHA256_HASH);
                        done();
                    } catch (error) {
                        done(error);
                    }
                    return {} as AuthenticationResult;
                }
            );

            const timestamp = TimeUtils.nowSeconds();
            responseHandler.handleServerTokenResponse(
                testResponse,
                testAuthority,
                timestamp,
                testRequest,
                0
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
                stubPerformanceClient,
                null,
                null
            );

            const timestamp = TimeUtils.nowSeconds();
            const response = await responseHandler.handleServerTokenResponse(
                testResponse,
                testAuthority,
                timestamp,
                testRequest,
                0
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
                TEST_CONFIG.CORRELATION_ID,
                new StubPerformanceClient()
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
                stubPerformanceClient,
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
                testRequest,
                0
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
                stubPerformanceClient,
                null,
                null
            );
            const timestamp = TimeUtils.nowSeconds();
            const result = await responseHandler.handleServerTokenResponse(
                testResponse,
                testAuthority,
                timestamp,
                testRequest,
                0
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
                stubPerformanceClient,
                null,
                null
            );
            const timestamp = TimeUtils.nowSeconds();
            const result = await responseHandler.handleServerTokenResponse(
                testResponse,
                testAuthority,
                timestamp,
                testRequest,
                0
            );

            expect(result.tokenType).toBe(AuthenticationScheme.POP);
            expect(result.accessToken).toBe(TEST_TOKENS.POP_TOKEN);
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
                stubPerformanceClient,
                null,
                null
            );
            const timestamp = TimeUtils.nowSeconds();
            const result = await responseHandler.handleServerTokenResponse(
                testResponse,
                testAuthority,
                timestamp,
                testRequest,
                0
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
                stubPerformanceClient,
                null,
                null
            );
            const timestamp = TimeUtils.nowSeconds();
            const result = await responseHandler.handleServerTokenResponse(
                testResponse,
                testAuthority,
                timestamp,
                testRequest,
                0
            );

            expect(result.requestId).toBe("");
        });

        it("saves tokens to cache when handling refresh token response and account exists in cache under authority alias", async () => {
            // Re-apply only the mocks we need
            jest.spyOn(
                Authority.prototype,
                "getPreferredCache"
            ).mockReturnValue("login.microsoftonline.com");
            claimsStub.mockImplementation((encodedIdToken, crypto) => {
                return ID_TOKEN_CLAIMS as TokenClaims;
            });

            // Mock authority metadata to recognize aliases
            jest.spyOn(
                CacheManager.prototype,
                "getAuthorityMetadataByAlias"
            ).mockImplementation((host: string) => {
                // login.microsoftonline.com and login.windows.net are aliases of each other
                const aliases = [
                    "login.microsoftonline.com",
                    "login.windows.net",
                    "login.microsoft.com",
                ];
                if (aliases.includes(host)) {
                    return {
                        aliases: aliases,
                        preferred_cache: "login.windows.net",
                        preferred_network: "login.microsoftonline.com",
                        aliasesFromNetwork: false,
                        canonical_authority: host,
                        authorization_endpoint: "",
                        token_endpoint: "",
                        end_session_endpoint: "",
                        issuer: "",
                        jwks_uri: "",
                        endpointsFromNetwork: false,
                        expiresAt: 0,
                    };
                }
                return null;
            });

            // Mock getAllAccounts to return an account when called with matching filter
            // This simulates that the account exists in cache under an authority alias
            jest.spyOn(
                CacheManager.prototype,
                "getAllAccounts"
            ).mockReturnValue([testAccount]);

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
                stubPerformanceClient,
                null,
                null
            );

            const saveCacheRecordSpy = jest.spyOn(
                CacheManager.prototype,
                "saveCacheRecord"
            );

            const timestamp = TimeUtils.nowSeconds();
            // handlingRefreshTokenResponse = true, forceCacheRefreshTokenResponse = false
            await responseHandler.handleServerTokenResponse(
                testResponse,
                testAuthority,
                timestamp,
                testRequest,
                0, // apiId
                undefined, // authCodePayload
                undefined, // userAssertionHash
                true, // handlingRefreshTokenResponse
                false // forceCacheRefreshTokenResponse
            );

            // Verify saveCacheRecord was called, meaning tokens were saved even though
            // the account was cached under a different authority alias
            expect(saveCacheRecordSpy).toHaveBeenCalled();
        });

        it("does not save tokens to cache when handling refresh token response and account does not exist in cache", async () => {
            // Ensure no accounts in cache
            const allAccountKeys = testCacheManager.getAccountKeys();
            for (const key of allAccountKeys) {
                const account = testCacheManager.getAccount(key);
                if (account) {
                    testCacheManager.removeAccount(
                        AccountEntityUtils.getAccountInfo(account),
                        "test-correlation-id"
                    );
                }
            }

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
                stubPerformanceClient,
                null,
                null
            );

            const saveCacheRecordSpy = jest.spyOn(
                CacheManager.prototype,
                "saveCacheRecord"
            );

            const timestamp = TimeUtils.nowSeconds();
            // handlingRefreshTokenResponse = true, forceCacheRefreshTokenResponse = false
            await responseHandler.handleServerTokenResponse(
                testResponse,
                testAuthority,
                timestamp,
                testRequest,
                0, // apiId
                undefined, // authCodePayload
                undefined, // userAssertionHash
                true, // handlingRefreshTokenResponse
                false // forceCacheRefreshTokenResponse
            );

            // Verify saveCacheRecord was NOT called, meaning tokens were not saved
            expect(saveCacheRecordSpy).not.toHaveBeenCalled();
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
                stubPerformanceClient,
                null,
                null
            );

            try {
                responseHandler.validateTokenResponse(
                    testTokenResponse,
                    TEST_CONFIG.CORRELATION_ID
                );
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
                stubPerformanceClient,
                null,
                null
            );

            try {
                responseHandler.validateTokenResponse(
                    testTokenResponse,
                    TEST_CONFIG.CORRELATION_ID
                );
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
                stubPerformanceClient,
                null,
                null
            );

            try {
                responseHandler.validateTokenResponse(
                    testTokenResponse,
                    TEST_CONFIG.CORRELATION_ID
                );
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
                stubPerformanceClient,
                null,
                null
            );

            try {
                responseHandler.validateTokenResponse(
                    testTokenResponse,
                    TEST_CONFIG.CORRELATION_ID
                );
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
                stubPerformanceClient,
                null,
                null
            );

            try {
                const timestamp = TimeUtils.nowSeconds();
                await responseHandler.handleServerTokenResponse(
                    testResponse,
                    testAuthority,
                    timestamp,
                    testRequest,
                    0
                );
                throw Error("should throw cache error");
            } catch (e) {
                expect(e).toBeInstanceOf(CacheError);
                const cacheError: CacheError = e as CacheError;
                expect(cacheError.errorCode).toEqual("cache_quota_exceeded");
                expect(cacheError.errorMessage).toEqual(
                    getDefaultErrorMessage(cacheQuotaExceeded)
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
                stubPerformanceClient,
                null,
                null
            );

            try {
                const timestamp = TimeUtils.nowSeconds();
                await responseHandler.handleServerTokenResponse(
                    testResponse,
                    testAuthority,
                    timestamp,
                    testRequest,
                    0
                );
                throw Error("should throw cache error");
            } catch (e) {
                expect(e).toBeInstanceOf(CacheError);
                const cacheError: CacheError = e as CacheError;
                expect(cacheError.errorCode).toEqual("cache_quota_exceeded");
                expect(cacheError.errorMessage).toEqual(
                    getDefaultErrorMessage(cacheQuotaExceeded)
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
                stubPerformanceClient,
                null,
                null
            );

            try {
                const timestamp = TimeUtils.nowSeconds();
                await responseHandler.handleServerTokenResponse(
                    testResponse,
                    testAuthority,
                    timestamp,
                    testRequest,
                    0
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
                stubPerformanceClient,
                null,
                null
            );

            try {
                const timestamp = TimeUtils.nowSeconds();
                await responseHandler.handleServerTokenResponse(
                    testResponse,
                    testAuthority,
                    timestamp,
                    testRequest,
                    0
                );
                throw Error("should throw cache error");
            } catch (e) {
                expect(e).toBeInstanceOf(CacheError);
                const cacheError: CacheError = e as CacheError;
                expect(cacheError.errorCode).toEqual(
                    CacheErrorCodes.cacheErrorUnknown
                );
                expect(cacheError.errorMessage).toEqual(
                    getDefaultErrorMessage(CacheErrorCodes.cacheErrorUnknown)
                );
            }
        });
    });

    describe("buildAccountToCache", () => {
        it("reuses cached account when cache keys have a prefix not starting with homeAccountId", () => {
            const homeAccountId =
                TEST_DATA_CLIENT_INFO.TEST_ENCODED_HOME_ACCOUNT_ID;
            const homeTenantId = homeAccountId.split(".")[1];
            const environment = "login.windows.net";

            // Create an AccountEntity already in cache with a home tenant profile
            const existingAccount = AccountEntityUtils.createAccountEntity(
                {
                    homeAccountId,
                    idTokenClaims: {
                        ...testIdTokenClaims,
                        tid: homeTenantId,
                    },
                    environment,
                },
                testAuthority,
                "",
                mockCrypto.base64Decode
            );
            existingAccount.tenantProfiles = [
                {
                    tenantId: homeTenantId,
                    localAccountId: existingAccount.localAccountId,
                    isHomeTenant: true,
                    username: testIdTokenClaims.preferred_username || "",
                },
            ];

            // Simulate a cache key with a prefix (like msal-browser's "msal.2|" prefix)
            const prefixedKey = `msal.2|${homeAccountId}|${environment}|${homeTenantId}`;

            // Override getAccountKeys and getAccount to use prefixed keys
            jest.spyOn(testCacheManager, "getAccountKeys").mockReturnValue([
                prefixedKey,
            ]);
            jest.spyOn(testCacheManager, "getAccount").mockImplementation(
                (key: string) => {
                    if (key === prefixedKey) {
                        return existingAccount;
                    }
                    return null;
                }
            );

            const guestTenantId = "guest-tenant-id";
            const result = buildAccountToCache(
                testCacheManager,
                testAuthority,
                homeAccountId,
                mockCrypto.base64Decode,
                TEST_CONFIG.CORRELATION_ID,
                {
                    ...testIdTokenClaims,
                    tid: guestTenantId,
                },
                undefined, // clientInfo
                environment,
                guestTenantId
            );

            // Should preserve the existing home tenant profile and add guest
            expect(result.tenantProfiles).toHaveLength(2);
            expect(
                result.tenantProfiles?.find(
                    (tp) => tp.tenantId === homeTenantId
                )
            ).toBeDefined();
            expect(
                result.tenantProfiles?.find(
                    (tp) => tp.tenantId === guestTenantId
                )
            ).toBeDefined();
        });

        it("creates new account when no cached account matches homeAccountId", () => {
            jest.spyOn(testCacheManager, "getAccountKeys").mockReturnValue([]);

            const homeAccountId =
                TEST_DATA_CLIENT_INFO.TEST_ENCODED_HOME_ACCOUNT_ID;
            const tenantId = testIdTokenClaims.tid || "";

            const result = buildAccountToCache(
                testCacheManager,
                testAuthority,
                homeAccountId,
                mockCrypto.base64Decode,
                TEST_CONFIG.CORRELATION_ID,
                testIdTokenClaims,
                undefined,
                "login.windows.net",
                tenantId
            );

            expect(result.homeAccountId).toEqual(homeAccountId);
            expect(result.tenantProfiles).toHaveLength(1);
            expect(result.tenantProfiles?.[0].tenantId).toEqual(tenantId);
        });

        it("does not add duplicate tenant profile if tenant already exists in cache", () => {
            const homeAccountId =
                TEST_DATA_CLIENT_INFO.TEST_ENCODED_HOME_ACCOUNT_ID;
            const tenantId = testIdTokenClaims.tid || "";
            const environment = "login.windows.net";

            const existingAccount = AccountEntityUtils.createAccountEntity(
                {
                    homeAccountId,
                    idTokenClaims: {
                        ...testIdTokenClaims,
                        tid: tenantId,
                    },
                    environment,
                },
                testAuthority,
                "",
                mockCrypto.base64Decode
            );
            existingAccount.tenantProfiles = [
                {
                    tenantId,
                    localAccountId: existingAccount.localAccountId,
                    isHomeTenant: true,
                    username: testIdTokenClaims.preferred_username || "",
                },
            ];

            jest.spyOn(
                testCacheManager,
                "getAccountsFilteredBy"
            ).mockReturnValue([existingAccount]);

            const result = buildAccountToCache(
                testCacheManager,
                testAuthority,
                homeAccountId,
                mockCrypto.base64Decode,
                TEST_CONFIG.CORRELATION_ID,
                testIdTokenClaims,
                undefined,
                environment,
                tenantId
            );

            expect(result.tenantProfiles).toHaveLength(1);
            expect(result.tenantProfiles?.[0].tenantId).toEqual(tenantId);
        });

        it("falls back to new account and logs warning when multiple accounts match homeAccountId", () => {
            const homeAccountId =
                TEST_DATA_CLIENT_INFO.TEST_ENCODED_HOME_ACCOUNT_ID;
            const environment = "login.windows.net";

            const account1 = AccountEntityUtils.createAccountEntity(
                {
                    homeAccountId,
                    idTokenClaims: testIdTokenClaims,
                    environment,
                },
                testAuthority,
                "",
                mockCrypto.base64Decode
            );
            const account2 = AccountEntityUtils.createAccountEntity(
                {
                    homeAccountId,
                    idTokenClaims: testIdTokenClaims,
                    environment,
                },
                testAuthority,
                "",
                mockCrypto.base64Decode
            );

            jest.spyOn(
                testCacheManager,
                "getAccountsFilteredBy"
            ).mockReturnValue([account1, account2]);

            const warningSpy = jest.spyOn(Logger.prototype, "warning");

            const tenantId = testIdTokenClaims.tid || "";
            const result = buildAccountToCache(
                testCacheManager,
                testAuthority,
                homeAccountId,
                mockCrypto.base64Decode,
                TEST_CONFIG.CORRELATION_ID,
                testIdTokenClaims,
                undefined,
                environment,
                tenantId,
                undefined,
                undefined,
                logger
            );

            expect(result.tenantProfiles).toHaveLength(1);
            expect(warningSpy).toHaveBeenCalledWith(
                expect.stringContaining("Multiple base accounts"),
                expect.any(String)
            );
        });

        it("uses account matching authority environment when multiple environments present in cache", () => {
            const homeAccountId =
                TEST_DATA_CLIENT_INFO.TEST_ENCODED_HOME_ACCOUNT_ID;

            const accountWindows = AccountEntityUtils.createAccountEntity(
                {
                    homeAccountId,
                    idTokenClaims: testIdTokenClaims,
                    environment: "login.windows.net",
                },
                testAuthority,
                "",
                mockCrypto.base64Decode
            );
            accountWindows.tenantProfiles = [
                {
                    tenantId: testIdTokenClaims.tid || "",
                    localAccountId: accountWindows.localAccountId,
                    isHomeTenant: true,
                    username: testIdTokenClaims.preferred_username || "",
                },
            ];

            const accountOther = AccountEntityUtils.createAccountEntity(
                {
                    homeAccountId,
                    idTokenClaims: testIdTokenClaims,
                    environment: "login.other-cloud.example",
                },
                testAuthority,
                "",
                mockCrypto.base64Decode
            );

            const keyWindows = `${homeAccountId}-login.windows.net-${testIdTokenClaims.tid}`;
            const keyOther = `${homeAccountId}-login.other-cloud.example-${testIdTokenClaims.tid}`;

            jest.spyOn(testCacheManager, "getAccountKeys").mockReturnValue([
                keyWindows,
                keyOther,
            ]);
            jest.spyOn(testCacheManager, "getAccount").mockImplementation(
                (key: string) => {
                    if (key === keyWindows) return accountWindows;
                    if (key === keyOther) return accountOther;
                    return null;
                }
            );

            const guestTenantId = "guest-tenant-id";
            const result = buildAccountToCache(
                testCacheManager,
                testAuthority,
                homeAccountId,
                mockCrypto.base64Decode,
                TEST_CONFIG.CORRELATION_ID,
                {
                    ...testIdTokenClaims,
                    tid: guestTenantId,
                },
                undefined,
                undefined, // no explicit environment; uses getPreferredCache() = "login.microsoftonline.com"
                guestTenantId
            );

            // accountWindows should be matched via alias; accountOther should not match
            expect(result.environment).toEqual("login.windows.net");
            expect(result.tenantProfiles).toHaveLength(2);
            expect(
                result.tenantProfiles?.find(
                    (tp) => tp.tenantId === testIdTokenClaims.tid
                )
            ).toBeDefined();
            expect(
                result.tenantProfiles?.find(
                    (tp) => tp.tenantId === guestTenantId
                )
            ).toBeDefined();
        });
    });
});

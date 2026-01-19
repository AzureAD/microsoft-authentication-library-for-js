import { ServerAuthorizationTokenResponse } from "../../src/response/ServerAuthorizationTokenResponse.js";
import { ResponseHandler } from "../../src/response/ResponseHandler.js";
import {
    AUTHENTICATION_RESULT,
    ID_TOKEN_CLAIMS,
    POP_AUTHENTICATION_RESULT,
    TEST_CONFIG,
    TEST_DATA_CLIENT_INFO,
    TEST_POP_VALUES,
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
import { mockCrypto, MockStorageClass } from "../client/ClientTestUtils.js";
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
import { cacheQuotaExceeded } from "../../src/error/CacheErrorCodes.js";
import { TestTimeUtils } from "msal-test-utils";
import { StubPerformanceClient } from "../../src/telemetry/performance/StubPerformanceClient.js";

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
    new StubPerformanceClient()
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
        jest.spyOn(AccountEntity, "getAccountInfo").mockReturnValue({
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
                null,
                null,
                perfClient
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

        it("sets cachedByApiId on cached account", async () => {
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

            const timestamp = TimeUtils.nowSeconds();
            const apiId = 1234;
            await responseHandler.handleServerTokenResponse(
                testResponse,
                testAuthority,
                timestamp,
                testRequest,
                apiId
            );

            const accountKeys = testCacheManager.getAccountKeys();
            expect(accountKeys.length).toBeGreaterThan(0);
            const account = testCacheManager.getAccount(accountKeys[0]);
            expect(account?.cachedByApiId).toBe(apiId);
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
                testRequest,
                0
            );
        });

        it("saves tokens to cache when handling refresh token response and account exists in cache under authority alias", async () => {
            // Restore the getAccountInfo mock for this test to use real implementation
            jest.restoreAllMocks();

            // Re-apply only the mocks we need
            jest.spyOn(
                Authority.prototype,
                "getPreferredCache"
            ).mockReturnValue("login.microsoftonline.com");
            jest.spyOn(AuthToken, "extractTokenClaims").mockImplementation(
                (encodedIdToken, crypto) => {
                    return ID_TOKEN_CLAIMS as TokenClaims;
                }
            );

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

            // Setup account in cache with login.windows.net (an alias of login.microsoftonline.com)
            // The homeAccountId must match what handleServerTokenResponse generates (oid.tid from ID token claims)
            const expectedHomeAccountId = `${ID_TOKEN_CLAIMS.oid}.${ID_TOKEN_CLAIMS.tid}`;
            const accountEntity = new AccountEntity();
            accountEntity.homeAccountId = expectedHomeAccountId;
            accountEntity.localAccountId = ID_TOKEN_CLAIMS.oid;
            accountEntity.environment = "login.windows.net"; // Different alias than getPreferredCache returns
            accountEntity.realm = ID_TOKEN_CLAIMS.tid;
            accountEntity.username = "test@contoso.com";
            accountEntity.authorityType = "MSSTS";
            accountEntity.clientInfo =
                TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO;
            // Add home tenant profile to enable localAccountId matching
            accountEntity.tenantProfiles = [
                {
                    tenantId: ID_TOKEN_CLAIMS.tid,
                    localAccountId: ID_TOKEN_CLAIMS.oid,
                    isHomeTenant: true,
                    username: "test@contoso.com",
                },
            ];
            await testCacheManager.setAccount(accountEntity);

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
                0,
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
                        AccountEntity.getAccountInfo(account),
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
                0,
                undefined, // authCodePayload
                undefined, // userAssertionHash
                true, // handlingRefreshTokenResponse
                false // forceCacheRefreshTokenResponse
            );

            // Verify saveCacheRecord was NOT called, meaning tokens were not saved
            expect(saveCacheRecordSpy).not.toHaveBeenCalled();
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
                    testRequest,
                    0
                );
                throw Error("should throw cache error");
            } catch (e) {
                expect(e).toBeInstanceOf(CacheError);
                const cacheError: CacheError = e as CacheError;
                expect(cacheError.errorCode).toEqual("cache_quota_exceeded");
                expect(cacheError.errorMessage).toEqual(
                    CacheErrorMessages[cacheQuotaExceeded]
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
                    testRequest,
                    0
                );
                throw Error("should throw cache error");
            } catch (e) {
                expect(e).toBeInstanceOf(CacheError);
                const cacheError: CacheError = e as CacheError;
                expect(cacheError.errorCode).toEqual("cache_quota_exceeded");
                expect(cacheError.errorMessage).toEqual(
                    CacheErrorMessages[cacheQuotaExceeded]
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
                    CacheErrorMessages[CacheErrorCodes.cacheErrorUnknown]
                );
            }
        });
    });
});

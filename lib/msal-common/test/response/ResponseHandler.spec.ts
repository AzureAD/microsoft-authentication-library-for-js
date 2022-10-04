import sinon from "sinon";
import { ServerAuthorizationTokenResponse } from "../../src/response/ServerAuthorizationTokenResponse";
import { ResponseHandler } from "../../src/response/ResponseHandler";
import { AUTHENTICATION_RESULT, RANDOM_TEST_GUID, TEST_CONFIG, ID_TOKEN_CLAIMS, TEST_DATA_CLIENT_INFO, TEST_STATE_VALUES, TEST_POP_VALUES, POP_AUTHENTICATION_RESULT, TEST_URIS, TEST_TOKEN_LIFETIMES, TEST_TOKENS, TEST_CRYPTO_VALUES } from "../test_kit/StringConstants";
import { Authority } from "../../src/authority/Authority";
import { INetworkModule, NetworkRequestOptions } from "../../src/network/INetworkModule";
import { ICrypto, PkceCodes } from "../../src/crypto/ICrypto";
import { ServerAuthorizationCodeResponse } from "../../src/response/ServerAuthorizationCodeResponse";
import { MockStorageClass } from "../client/ClientTestUtils";
import { TokenClaims } from "../../src/account/TokenClaims";
import { AccountInfo } from "../../src/account/AccountInfo";
import { AuthenticationResult } from "../../src/response/AuthenticationResult";
import { AuthenticationScheme } from "../../src/utils/Constants";
import { AuthorityOptions } from "../../src/authority/AuthorityOptions";
import { ProtocolMode } from "../../src/authority/ProtocolMode";
import { LogLevel, Logger } from "../../src/logger/Logger";
import { AuthToken } from "../../src/account/AuthToken";
import { AccountEntity } from "../../src/cache/entities/AccountEntity";
import { BaseAuthRequest } from "../../src/request/BaseAuthRequest";
import { TimeUtils } from "../../src/utils/TimeUtils";
import { AuthError } from "../../src/error/AuthError";
import { ClientAuthError, ClientAuthErrorMessage } from "../../src/error/ClientAuthError";
import { InteractionRequiredAuthError } from "../../src/error/InteractionRequiredAuthError";
import { ServerError } from "../../src/error/ServerError";

const networkInterface: INetworkModule = {
    sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
        return {} as T;
    },
    sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
        return {} as T;
    }
};
const signedJwt = "SignedJwt";
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
    async generatePkceCodes(): Promise<PkceCodes> {
        return {
            challenge: TEST_CONFIG.TEST_CHALLENGE,
            verifier: TEST_CONFIG.TEST_VERIFIER,
        };
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
    }
};

const testCacheManager = new MockStorageClass(TEST_CONFIG.MSAL_CLIENT_ID, cryptoInterface);

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
        client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO
    }
};
const testIdTokenClaims: TokenClaims = {
    "ver": "2.0",
    "iss": "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
    "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
    "name": "Abe Lincoln",
    "preferred_username": "AbeLi@microsoft.com",
    "oid": "00000000-0000-0000-66f3-3332eca7ea81",
    "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
    "nonce": "123523",
};
const testAccount: AccountInfo = {
    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_ENCODED_HOME_ACCOUNT_ID,
    localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
    environment: "login.windows.net",
    tenantId: testIdTokenClaims.tid || "",
    username: testIdTokenClaims.preferred_username || ""
}

const authorityOptions: AuthorityOptions = {
    protocolMode: ProtocolMode.AAD,
    knownAuthorities: ["login.microsoftonline.com"],
    cloudDiscoveryMetadata: "",
    authorityMetadata: ""
}
const testAuthority = new Authority("https://login.microsoftonline.com/common", networkInterface, testCacheManager, authorityOptions);
const testLoggerCallback = (level: LogLevel, message: string, containsPii: boolean): void => {
    if (containsPii) {
        console.log(`Log level: ${level} Message: ${message}`);
    }
};
const loggerOptions = {
    loggerCallback: testLoggerCallback,
}

describe("ResponseHandler.ts", () => {
    let preferredCacheStub: sinon.SinonStub;
    let claimsStub: sinon.SinonStub;
    beforeEach(() => {
        preferredCacheStub = sinon.stub(Authority.prototype, "getPreferredCache").returns("login.microsoftonline.com");
        claimsStub = sinon.stub(AuthToken, "extractTokenClaims").callsFake((encodedIdToken, crypto) => {
            return ID_TOKEN_CLAIMS as TokenClaims;
        });
        sinon.stub(ResponseHandler.prototype, <any>"generateAccountEntity").returns(new AccountEntity());
        sinon.stub(AccountEntity.prototype, "getAccountInfo").returns({
            homeAccountId: TEST_DATA_CLIENT_INFO.TEST_ENCODED_HOME_ACCOUNT_ID,
            localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
            environment: "login.windows.net",
            tenantId: "testTenantId",
            username: "test@contoso.com"
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("generateCacheRecord", () => {
        it("throws invalid cache environment error", async () => {
            preferredCacheStub.returns("");
            const testRequest: BaseAuthRequest = {
                authority: testAuthority.canonicalAuthority,
                correlationId: "CORRELATION_ID",
                scopes: ["openid", "profile", "User.Read", "email"]
            };
            const testResponse: ServerAuthorizationTokenResponse = {...AUTHENTICATION_RESULT.body};
            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, new Logger(loggerOptions), null, null);
            try {
                const timestamp = TimeUtils.nowSeconds();
                const tokenResp = await responseHandler.handleServerTokenResponse(testResponse, testAuthority, timestamp, testRequest);
                expect(tokenResp).toBeUndefined();
            } catch(e) {
                if (e instanceof AuthError) {
                    expect(e).toBeInstanceOf(ClientAuthError);
                    expect(e.errorCode).toBe(ClientAuthErrorMessage.invalidCacheEnvironment.code);
                    expect(e.errorMessage).toBe(ClientAuthErrorMessage.invalidCacheEnvironment.desc);
                } else {
                    throw e;
                }
            }
        });

        it("doesn't create AccessTokenEntity if access_token not in response", (done) => {
            const testRequest: BaseAuthRequest = {
                authority: testAuthority.canonicalAuthority,
                correlationId: "CORRELATION_ID",
                scopes: ["openid", "profile", "User.Read", "email"]
            };
            const testResponse: ServerAuthorizationTokenResponse = {...AUTHENTICATION_RESULT.body};
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
                expiresOn: new Date(Date.now() + (testServerTokenResponse.body.expires_in * 1000)),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER
            };

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, new Logger(loggerOptions), null, null);

            sinon.stub(ResponseHandler, "generateAuthenticationResult").callsFake(async (cryptoObj, authority, cacheRecord, request, idTokenObj, fromTokenCache, stateString) => {
                expect(authority).toBe(testAuthority);
                expect(cacheRecord.idToken).not.toBeNull();
                expect(cacheRecord.accessToken).toBeNull();
                expect(cacheRecord.refreshToken).not.toBeNull();
                done();
                return testTokenResponse;
            });
            const timestamp = TimeUtils.nowSeconds();
            responseHandler.handleServerTokenResponse(testResponse, testAuthority, timestamp, testRequest);
        });

        it("doesn't create RefreshTokenEntity if refresh_token not in response", (done) => {
            const testRequest: BaseAuthRequest = {
                authority: testAuthority.canonicalAuthority,
                correlationId: "CORRELATION_ID",
                scopes: ["openid", "profile", "User.Read", "email"]
            };
            const testResponse: ServerAuthorizationTokenResponse = {...AUTHENTICATION_RESULT.body};
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
                expiresOn: new Date(Date.now() + (testServerTokenResponse.body.expires_in * 1000)),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER
            };

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, new Logger(loggerOptions), null, null);

            sinon.stub(ResponseHandler, "generateAuthenticationResult").callsFake(async (cryptoObj, authority, cacheRecord, request, idTokenObj, fromTokenCache, stateString) => {
                expect(authority).toBe(testAuthority);
                expect(cacheRecord.idToken).not.toBeNull();
                expect(cacheRecord.accessToken).not.toBeNull();
                expect(cacheRecord.refreshToken).toBeNull();
                done();
                return testTokenResponse;
            });

            const timestamp = TimeUtils.nowSeconds();
            responseHandler.handleServerTokenResponse(testResponse, testAuthority, timestamp, testRequest);
        });

        it("create CacheRecord with all token entities", (done) => {
            const testRequest: BaseAuthRequest = {
                authority: testAuthority.canonicalAuthority,
                correlationId: "CORRELATION_ID",
                scopes: ["openid", "profile", "User.Read", "email"]
            };
            const testResponse: ServerAuthorizationTokenResponse = {...AUTHENTICATION_RESULT.body};
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
                expiresOn: new Date(Date.now() + (testServerTokenResponse.body.expires_in * 1000)),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER
            };


            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, new Logger(loggerOptions), null, null);

            sinon.stub(ResponseHandler, "generateAuthenticationResult").callsFake(async (cryptoObj, authority, cacheRecord, request, idTokenObj, fromTokenCache, stateString) => {
                expect(authority).toBe(testAuthority);
                expect(cacheRecord.idToken).not.toBeNull();
                expect(cacheRecord.accessToken).not.toBeNull();
                expect(cacheRecord.refreshToken).not.toBeNull();
                done();
                return testTokenResponse;
            });

            const timestamp = TimeUtils.nowSeconds();
            responseHandler.handleServerTokenResponse(testResponse, testAuthority, timestamp, testRequest)
        });

        it("includes spa_code in response as code", async () => {
            const testSpaCode = "sample-spa-code";

            const testRequest: BaseAuthRequest = {
                authority: testAuthority.canonicalAuthority,
                correlationId: "CORRELATION_ID",
                scopes: ["openid", "profile", "User.Read", "email"]
            };
            const testResponse: ServerAuthorizationTokenResponse = {
                ...AUTHENTICATION_RESULT.body,
                spa_code: testSpaCode
            };

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, new Logger(loggerOptions), null, null);

            const timestamp = TimeUtils.nowSeconds();
            const response = await responseHandler.handleServerTokenResponse(testResponse, testAuthority, timestamp, testRequest);
            expect(response.code).toEqual(testSpaCode);
        });
    });

    describe("generateAuthenticationResult", () => {
        it("sets default values if refresh_token not in cacheRecord", async () => {
            const testRequest: BaseAuthRequest = {
                authority: testAuthority.canonicalAuthority,
                correlationId: "CORRELATION_ID",
                scopes: ["openid", "profile", "User.Read", "email"]
            };
            const testResponse: ServerAuthorizationTokenResponse = {...AUTHENTICATION_RESULT.body};
            testResponse.refresh_token = undefined;

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, new Logger(loggerOptions), null, null);
            const timestamp = TimeUtils.nowSeconds();
            const result = await responseHandler.handleServerTokenResponse(testResponse, testAuthority, timestamp, testRequest);

            expect(result.familyId).toBe("");
        });

        it("sets default values for access token using PoP scheme", async () => {
            const testRequest: BaseAuthRequest = {
                authority: testAuthority.canonicalAuthority,
                correlationId: "CORRELATION_ID",
                scopes: ["openid", "profile", "User.Read", "email"],
                resourceRequestMethod: "POST",
                resourceRequestUri: TEST_URIS.TEST_RESOURCE_ENDPT_WITH_PARAMS
            };
            const testResponse: ServerAuthorizationTokenResponse = { ...POP_AUTHENTICATION_RESULT.body };
            claimsStub.callsFake((encodedToken: string, crypto: ICrypto): TokenClaims|null => {
                switch (encodedToken) {
                    case testResponse.id_token:
                        return ID_TOKEN_CLAIMS as TokenClaims;
                    case testResponse.access_token:
                        return {
                            cnf: {
                                kid: TEST_POP_VALUES.KID
                            }
                        };
                    default:
                        return null;
                }
            });

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, new Logger(loggerOptions), null, null);
            const timestamp = TimeUtils.nowSeconds();
            const result = await responseHandler.handleServerTokenResponse(testResponse, testAuthority, timestamp, testRequest);

            expect(result.tokenType).toBe(AuthenticationScheme.POP);
            expect(result.accessToken).toBe(signedJwt);
        });

        it("sets default value if requestId not provided", async () => {
            const testRequest: BaseAuthRequest = {
                authority: testAuthority.canonicalAuthority,
                correlationId: "CORRELATION_ID",
                scopes: ["openid", "profile", "User.Read", "email"]
            };
            const testResponse: ServerAuthorizationTokenResponse = {...AUTHENTICATION_RESULT.body};
            testResponse.refresh_token = undefined;

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, new Logger(loggerOptions), null, null);
            const timestamp = TimeUtils.nowSeconds();
            const result = await responseHandler.handleServerTokenResponse(testResponse, testAuthority, timestamp, testRequest);

            expect(result.requestId).toBe("");
        });
    });

    describe("validateServerAuthorizationCodeResponse", () => {
        afterEach(() => {
            sinon.restore();
        });

        it("throws state mismatch error", (done) => {
            const testServerCodeResponse: ServerAuthorizationCodeResponse = {
                code: "testCode",
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                state: TEST_STATE_VALUES.URI_ENCODED_LIB_STATE
            };

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, new Logger(loggerOptions), null, null);
            const stateMismatchSpy = sinon.spy(ClientAuthError, "createStateMismatchError");

            try {
                responseHandler.validateServerAuthorizationCodeResponse(testServerCodeResponse, "differentState", cryptoInterface);
            } catch (e) {
                expect(e).toBeInstanceOf(ClientAuthError);
                expect(stateMismatchSpy.calledOnce).toBe(true);
                done();
            }
        });

        it("Does not throw state mismatch error when states match", () => {
            const testServerCodeResponse: ServerAuthorizationCodeResponse = {
                code: "testCode",
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                state: TEST_STATE_VALUES.URI_ENCODED_LIB_STATE
            };
            const stateMismatchSpy = sinon.spy(ClientAuthError, "createStateMismatchError");

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, new Logger(loggerOptions), null, null);
            responseHandler.validateServerAuthorizationCodeResponse(testServerCodeResponse, TEST_STATE_VALUES.URI_ENCODED_LIB_STATE, cryptoInterface);
            expect(stateMismatchSpy.notCalled).toBe(true);
        });

        it("Does not throw state mismatch error when Uri encoded characters have different casing", () => {
            const testServerCodeResponse: ServerAuthorizationCodeResponse = {
                code: "testCode",
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                state: TEST_STATE_VALUES.URI_ENCODED_LIB_STATE
            };
            const stateMismatchSpy = sinon.spy(ClientAuthError, "createStateMismatchError");

            const testAltState = "eyJpZCI6IjExNTUzYTliLTcxMTYtNDhiMS05ZDQ4LWY2ZDRhOGZmODM3MSIsInRzIjoxNTkyODQ2NDgyfQ%3d%3d";
            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, new Logger(loggerOptions), null, null);
            responseHandler.validateServerAuthorizationCodeResponse(testServerCodeResponse, testAltState, cryptoInterface);
            expect(stateMismatchSpy.notCalled).toBe(true);
        });

        it("throws interactionRequiredError", (done) => {
            const testServerCodeResponse: ServerAuthorizationCodeResponse = {
                code: "testCode",
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                state: TEST_STATE_VALUES.URI_ENCODED_LIB_STATE,
                error: "interaction_required"
            };

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, new Logger(loggerOptions), null, null);
            try {
                responseHandler.validateServerAuthorizationCodeResponse(testServerCodeResponse, TEST_STATE_VALUES.URI_ENCODED_LIB_STATE, cryptoInterface);
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
                error: "test_error"
            };

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, new Logger(loggerOptions), null, null);
            try {
                responseHandler.validateServerAuthorizationCodeResponse(testServerCodeResponse, TEST_STATE_VALUES.URI_ENCODED_LIB_STATE, cryptoInterface);
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
                error_description: "test_error"
            };

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, new Logger(loggerOptions), null, null);
            try {
                responseHandler.validateServerAuthorizationCodeResponse(testServerCodeResponse, TEST_STATE_VALUES.URI_ENCODED_LIB_STATE, cryptoInterface);
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
                suberror: "test_error"
            };

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, new Logger(loggerOptions), null, null);
            try {
                responseHandler.validateServerAuthorizationCodeResponse(testServerCodeResponse, TEST_STATE_VALUES.URI_ENCODED_LIB_STATE, cryptoInterface);
            } catch (e) {
                expect(e).toBeInstanceOf(ServerError);
                done();
            }

        });

        it("calls buildClientInfo if clientInfo in response", () => {
            const testServerCodeResponse: ServerAuthorizationCodeResponse = {
                code: "testCode",
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                state: TEST_STATE_VALUES.URI_ENCODED_LIB_STATE
            };
            // Can't spy on buildClientInfo, spy on one of its function calls instead
            const buildClientInfoSpy = sinon.spy(cryptoInterface, "base64Decode");

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, new Logger(loggerOptions), null, null);
            responseHandler.validateServerAuthorizationCodeResponse(testServerCodeResponse, TEST_STATE_VALUES.URI_ENCODED_LIB_STATE, cryptoInterface);
            expect(buildClientInfoSpy.calledOnce).toBe(true);
            expect(buildClientInfoSpy.calledWith(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO)).toBe(true);
        });

        it("does not call buildClientInfo if clientInfo not in response", () => {
            const testServerCodeResponse: ServerAuthorizationCodeResponse = {
                code: "testCode",
                state: TEST_STATE_VALUES.URI_ENCODED_LIB_STATE
            };
            // Can't spy on buildClientInfo, spy on one of its function calls instead
            const buildClientInfoSpy = sinon.spy(cryptoInterface, "base64Decode");

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, new Logger(loggerOptions), null, null);
            responseHandler.validateServerAuthorizationCodeResponse(testServerCodeResponse, TEST_STATE_VALUES.URI_ENCODED_LIB_STATE, cryptoInterface);
            expect(buildClientInfoSpy.notCalled).toBe(true);
        });
    });
});

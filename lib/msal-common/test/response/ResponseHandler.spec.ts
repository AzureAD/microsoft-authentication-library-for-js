import * as Mocha from "mocha";
import { expect } from "chai";
import sinon from "sinon";
import { ServerAuthorizationTokenResponse } from "../../src/response/ServerAuthorizationTokenResponse";
import { ResponseHandler } from "../../src/response/ResponseHandler";
import { AUTHENTICATION_RESULT, RANDOM_TEST_GUID, TEST_CONFIG, ID_TOKEN_CLAIMS, TEST_DATA_CLIENT_INFO, TEST_STATE_VALUES, TEST_POP_VALUES, POP_AUTHENTICATION_RESULT, TEST_URIS, DEFAULT_OPENID_CONFIG_RESPONSE } from "../test_kit/StringConstants";
import { Authority } from "../../src/authority/Authority";
import { INetworkModule, NetworkRequestOptions } from "../../src/network/INetworkModule";
import { ICrypto, PkceCodes } from "../../src/crypto/ICrypto";
import { ClientTestUtils } from "../client/ClientTestUtils";
import { AccountEntity, ClientAuthError, ClientAuthErrorMessage, InteractionRequiredAuthError, ServerError, AuthToken, AuthError, TokenClaims, AuthenticationScheme, ProtocolMode, Logger, LogLevel, AuthorityOptions, TimeUtils, BaseAuthRequest } from "../../src";
import { ServerAuthorizationCodeResponse } from "../../src/response/ServerAuthorizationCodeResponse";
import { MockStorageClass } from "../client/ClientTestUtils";

const networkInterface: INetworkModule = {
    sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
        return null;
    },
    sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
        return null;
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
                TEST_POP_VALUES.DECODED_REQ_CNF;
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
                TEST_POP_VALUES.ENCODED_REQ_CNF;
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
    }
};

const testCacheManager = new MockStorageClass(TEST_CONFIG.MSAL_CLIENT_ID, cryptoInterface);

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
            homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
            localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
            environment: "login.windows.net",
            tenantId: "testTenantId",
            username: "test@contoso.com"
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("generateCacheRecord", async () => {
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
                expect(tokenResp).to.be.undefined;
            } catch(e) {
                if (e instanceof AuthError) {
                    expect(e).to.be.instanceOf(ClientAuthError);
                    expect(e.errorCode).to.be.eq(ClientAuthErrorMessage.invalidCacheEnvironment.code);
                    expect(e.errorMessage).to.be.eq(ClientAuthErrorMessage.invalidCacheEnvironment.desc);
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
            testResponse.access_token = null;

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, new Logger(loggerOptions), null, null);

            sinon.stub(ResponseHandler, "generateAuthenticationResult").callsFake((cryptoObj, authority, cacheRecord, request, idTokenObj, fromTokenCache, stateString) => {
                expect(authority).to.be.eq(testAuthority);
                expect(cacheRecord.idToken).to.not.be.null;
                expect(cacheRecord.accessToken).to.be.null;
                expect(cacheRecord.refreshToken).to.not.be.null;
                done();
                return null;
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
            testResponse.refresh_token = null;

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, new Logger(loggerOptions), null, null);

            sinon.stub(ResponseHandler, "generateAuthenticationResult").callsFake((cryptoObj, authority, cacheRecord, idTokenObj, fromTokenCache, stateString, resourceReqMethod, resourceReqUri) => {
                expect(authority).to.be.eq(testAuthority);
                expect(cacheRecord.idToken).to.not.be.null;
                expect(cacheRecord.accessToken).to.not.be.null;
                expect(cacheRecord.refreshToken).to.be.null;
                done();
                return null;
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

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, new Logger(loggerOptions), null, null);

            sinon.stub(ResponseHandler, "generateAuthenticationResult").callsFake((cryptoObj, authority, cacheRecord, idTokenObj, fromTokenCache, stateString, resourceReqMethod, resourceReqUri) => {
                expect(authority).to.be.eq(testAuthority);
                expect(cacheRecord.idToken).to.not.be.null;
                expect(cacheRecord.accessToken).to.not.be.null;
                expect(cacheRecord.refreshToken).to.not.be.null;
                done();
                return null;
            });

            const timestamp = TimeUtils.nowSeconds();
            responseHandler.handleServerTokenResponse(testResponse, testAuthority, timestamp, testRequest);
        });
    });

    describe("generateAuthenticationResult", async () => {
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

            expect(result.familyId).to.be.eq("");
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
            claimsStub.callsFake((encodedToken: string, crypto: ICrypto): TokenClaims => {
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

            expect(result.tokenType).to.be.eq(AuthenticationScheme.POP);
            expect(result.accessToken).to.be.eq(signedJwt);
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
                expect(e).to.be.instanceOf(ClientAuthError);
                expect(stateMismatchSpy.calledOnce).to.be.true;
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
            expect(stateMismatchSpy.notCalled).to.be.true;
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
            expect(stateMismatchSpy.notCalled).to.be.true;
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
                expect(e).to.be.instanceOf(InteractionRequiredAuthError);
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
                expect(e).to.be.instanceOf(ServerError);
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
                expect(e).to.be.instanceOf(ServerError);
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
                expect(e).to.be.instanceOf(ServerError);
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
            expect(buildClientInfoSpy.calledOnce).to.be.true;
            expect(buildClientInfoSpy.calledWith(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO)).to.be.true;
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
            expect(buildClientInfoSpy.notCalled).to.be.true;
        });
    });
});

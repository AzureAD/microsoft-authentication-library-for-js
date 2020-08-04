import * as Mocha from "mocha";
import { expect } from "chai";
import sinon from "sinon";
import { ServerAuthorizationTokenResponse } from "../../src/server/ServerAuthorizationTokenResponse";
import { ResponseHandler } from "../../src/response/ResponseHandler";
import { AUTHENTICATION_RESULT, RANDOM_TEST_GUID, TEST_CONFIG, ID_TOKEN_CLAIMS, TEST_DATA_CLIENT_INFO, TEST_STATE_VALUES } from "../utils/StringConstants";
import { Authority } from "../../src/authority/Authority";
import { INetworkModule, NetworkRequestOptions } from "../../src/network/INetworkModule";
import { CacheManager } from "../../src/cache/CacheManager";
import { ICrypto, PkceCodes } from "../../src/crypto/ICrypto";
import { IdToken } from "../../src/account/IdToken";
import { IdTokenClaims } from "../../src/account/IdTokenClaims";
import { ClientTestUtils } from "../client/ClientTestUtils";
import { AccountEntity, TrustedAuthority, ClientAuthError, ClientAuthErrorMessage, InteractionRequiredAuthError, ServerError } from "../../src";
import { ServerAuthorizationCodeResponse } from "../../src/server/ServerAuthorizationCodeResponse";
import { buildClientInfo } from "../../src/account/ClientInfo";

const networkInterface: INetworkModule = {
    sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
        return null;
    },
    sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
        return null;
    }
};

const cryptoInterface: ICrypto = {
    createNewGuid(): string {
        return RANDOM_TEST_GUID;
    },
    base64Decode(input: string): string {
        switch (input) {
            case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
            default:
                return input;
        }
    },
    base64Encode(input: string): string {
        return input;
    },
    async generatePkceCodes(): Promise<PkceCodes> {
        return {
            challenge: TEST_CONFIG.TEST_CHALLENGE,
            verifier: TEST_CONFIG.TEST_VERIFIER,
        };
    },
}

let store = {};
class TestCacheManager extends CacheManager {
    setItem(key: string, value: string | object, type?: string): void {
        store[key] = value as string;
    }
    getItem(key: string, type?: string): string | object {
        return store[key];
    }
    removeItem(key: string, type?: string): boolean {
        let result: boolean = false;
        if (!!store[key]) {
            delete store[key];
            result = true;
        }

        return result;
    }
    containsKey(key: string, type?: string): boolean {
        return !!store[key];
    }
    getKeys(): string[] {
        return Object.keys(store);
    }
    clear(): void {
        store = {};
    }
}
const testCacheManager = new TestCacheManager;

let authority = new Authority("https://login.microsoftonline.com/common", networkInterface);

describe("ResponseHandler.ts", () => {
    beforeEach(() => {
        sinon.stub(IdToken, "extractIdToken").callsFake((encodedIdToken, crypto) => {
            return ID_TOKEN_CLAIMS as IdTokenClaims;
        });
        sinon.stub(ResponseHandler.prototype, <any>"generateAccountEntity").returns(new AccountEntity());
        sinon.stub(AccountEntity.prototype, "getAccountInfo").returns({
            homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
            environment: "login.windows.net",
            tenantId: "testTenantId",
            username: "test@contoso.com"
        });
        ClientTestUtils.setCloudDiscoveryMetadataStubs();
    });

    afterEach(() => {
        sinon.restore();
    })

    describe("generateCacheRecord", () => {
        it("throws invalid cache environment error", (done) => {
            sinon.restore();
            sinon.stub(IdToken, "extractIdToken").callsFake((encodedIdToken, crypto) => {
                return ID_TOKEN_CLAIMS as IdTokenClaims;
            });
            sinon.stub(ResponseHandler.prototype, <any>"generateAccountEntity").returns(new AccountEntity());
            sinon.stub(AccountEntity.prototype, "getAccountInfo").returns({
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                environment: "login.windows.net",
                tenantId: "testTenantId",
                username: "test@contoso.com"
            });
            sinon.stub(TrustedAuthority, "getCloudDiscoveryMetadata").returns(null);

            const testResponse: ServerAuthorizationTokenResponse = {...AUTHENTICATION_RESULT.body};
            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, null);

            try {
                responseHandler.handleServerTokenResponse(testResponse, authority);
            } catch(e) {
                expect(e).to.be.instanceOf(ClientAuthError);
                expect(e.errorCode).to.be.eq(ClientAuthErrorMessage.invalidCacheEnvironment.code);
                expect(e.errorMessage).to.be.eq(ClientAuthErrorMessage.invalidCacheEnvironment.desc);
                done();
            }
        });

        it("doesn't create AccessTokenEntity if access_token not in response", (done) => {
            const testResponse: ServerAuthorizationTokenResponse = {...AUTHENTICATION_RESULT.body};
            testResponse.access_token = null;

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, null);

            sinon.stub(ResponseHandler, "generateAuthenticationResult").callsFake((cacheRecord, idTokenObj, fromTokenCache, stateString) => {
                expect(cacheRecord.idToken).to.not.be.null;
                expect(cacheRecord.accessToken).to.be.null;
                expect(cacheRecord.refreshToken).to.not.be.null;
                done();
                return null;
            });

            responseHandler.handleServerTokenResponse(testResponse, authority);
        });

        it("doesn't create RefreshTokenEntity if refresh_token not in response", (done) => {
            const testResponse: ServerAuthorizationTokenResponse = {...AUTHENTICATION_RESULT.body};
            testResponse.refresh_token = null;

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, null);

            sinon.stub(ResponseHandler, "generateAuthenticationResult").callsFake((cacheRecord, idTokenObj, fromTokenCache, stateString) => {
                expect(cacheRecord.idToken).to.not.be.null;
                expect(cacheRecord.accessToken).to.not.be.null;
                expect(cacheRecord.refreshToken).to.be.null;
                done();
                return null;
            });

            responseHandler.handleServerTokenResponse(testResponse, authority);
        });

        it("create CacheRecord with all token entities", (done) => {
            const testResponse: ServerAuthorizationTokenResponse = {...AUTHENTICATION_RESULT.body};

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, null);

            sinon.stub(ResponseHandler, "generateAuthenticationResult").callsFake((cacheRecord, idTokenObj, fromTokenCache, stateString) => {
                expect(cacheRecord.idToken).to.not.be.null;
                expect(cacheRecord.accessToken).to.not.be.null;
                expect(cacheRecord.refreshToken).to.not.be.null;
                done();
                return null;
            });

            responseHandler.handleServerTokenResponse(testResponse, authority);
        });
    });

    describe("generateAuthenticationResult", () => {
        it("sets default values if access_token not in cacheRecord", () => {
            const testResponse: ServerAuthorizationTokenResponse = {...AUTHENTICATION_RESULT.body};
            testResponse.access_token = null;

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, null);
            const result = responseHandler.handleServerTokenResponse(testResponse, authority);

            expect(result.accessToken).to.be.eq("");
            expect(result.scopes).to.be.length(0);
            expect(result.expiresOn).to.be.null;
            expect(result.extExpiresOn).to.be.null;
        });

        it("sets default values if refresh_token not in cacheRecord", () => {
            const testResponse: ServerAuthorizationTokenResponse = {...AUTHENTICATION_RESULT.body};
            testResponse.refresh_token = null;

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, null);
            const result = responseHandler.handleServerTokenResponse(testResponse, authority);

            expect(result.familyId).to.be.null;
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

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, null);
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

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, null);
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
            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, null);
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

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, null);
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

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, null);
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

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, null);
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

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, null);
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

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, null);
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

            const responseHandler = new ResponseHandler("this-is-a-client-id", testCacheManager, cryptoInterface, null);
            responseHandler.validateServerAuthorizationCodeResponse(testServerCodeResponse, TEST_STATE_VALUES.URI_ENCODED_LIB_STATE, cryptoInterface);
            expect(buildClientInfoSpy.notCalled).to.be.true;
        });
    });
});
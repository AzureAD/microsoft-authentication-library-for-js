import { expect } from "chai";
import sinon from "sinon";
import { ResponseHandler } from "../../src/response/ResponseHandler";
import { TEST_CONFIG, RANDOM_TEST_GUID, TEST_TOKENS, TEST_URIS, TEST_DATA_CLIENT_INFO, TEST_TOKEN_LIFETIMES } from "../utils/StringConstants";
import { CacheHelpers } from "../../src/cache/CacheHelpers";
import { ICacheStorage } from "../../src/cache/ICacheStorage";
import { ICrypto, PkceCodes } from "../../src/crypto/ICrypto";
import { Logger, LogLevel } from "../../src/logger/Logger";
import { IdTokenClaims } from "../../src/account/IdTokenClaims";
import { IdToken } from "../../src/account/IdToken";
import { LoggerOptions } from "../../src/config/ClientConfiguration";
import { Account } from "../../src/account/Account";
import { TokenResponse } from "../../src/response/TokenResponse";
import { ServerAuthorizationCodeResponse } from "../../src/server/ServerAuthorizationCodeResponse";
import { ClientAuthErrorMessage, ClientAuthError } from "../../src/error/ClientAuthError";
import { TemporaryCacheKeys, Constants, PersistentCacheKeys } from "../../src/utils/Constants";
import { ServerError } from "../../src/error/ServerError";
import { CodeResponse } from "../../src";
import { ServerAuthorizationTokenResponse } from "../../src/server/ServerAuthorizationTokenResponse";
import { TimeUtils } from "../../src/utils/TimeUtils";
import { InteractionRequiredAuthErrorMessage, InteractionRequiredAuthError } from "../../src/error/InteractionRequiredAuthError";
import { AccessTokenKey } from "../../src/cache/AccessTokenKey";
import { AccessTokenValue } from "../../src/cache/AccessTokenValue";

describe("ResponseHandler.ts Class Unit Tests", () => {

    let store = {};
    let cacheStorage: ICacheStorage;
    let cacheHelpers: CacheHelpers;
    let cryptoInterface: ICrypto;
    let logger: Logger;
    let idToken: IdToken;
    let testAccount: Account;
    beforeEach(() => {
        cacheStorage = {
            setItem(key: string, value: string): void {
                store[key] = value;
            },
            getItem(key: string): string {
                return store[key];
            },
            removeItem(key: string): void {
                delete store[key];
            },
            containsKey(key: string): boolean {
                return !!store[key];
            },
            getKeys(): string[] {
                return Object.keys(store);
            },
            clear(): void {
                store = {};
            }
        };
        cacheHelpers = new CacheHelpers(cacheStorage);
        cryptoInterface = {
            createNewGuid(): string {
                return RANDOM_TEST_GUID;
            },
            base64Decode(input: string): string {
                return input;
            },
            base64Encode(input: string): string {
                switch (input) {
                    case "123-test-uid":
                        return "MTIzLXRlc3QtdWlk";
                    case "456-test-utid":
                        return "NDU2LXRlc3QtdXRpZA==";
                    default:
                        return input;
                }
            },
            async generatePkceCodes(): Promise<PkceCodes> {
                return {
                    challenge: TEST_CONFIG.TEST_CHALLENGE,
                    verifier: TEST_CONFIG.TEST_VERIFIER
                }
            }
        };
        const loggerOptions: LoggerOptions = {
            loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {
                return;
            },
            piiLoggingEnabled: true,
            logLevel: LogLevel.Info
        };
        logger = new Logger(loggerOptions);
        const idTokenClaims: IdTokenClaims = {
            "ver": "2.0",
            "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
            "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
            "exp": "1536361411",
            "name": "Abe Lincoln",
            "preferred_username": "AbeLi@microsoft.com",
            "oid": "00000000-0000-0000-66f3-3332eca7ea81",
            "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
            "nonce": "123523"
        };
        sinon.stub(IdToken, "extractIdToken").returns(idTokenClaims);
        idToken = new IdToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);
        testAccount = new Account(idTokenClaims.oid, TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID, idTokenClaims, TEST_TOKENS.IDTOKEN_V2);
    });

    afterEach(() => {
        store = {};
        sinon.restore();
    });

    describe("Constructor", () => {

        it("Correctly creates a ResponseHandler object", () => {
            const responseHandler = new ResponseHandler(TEST_CONFIG.MSAL_CLIENT_ID, cacheStorage, cacheHelpers, cryptoInterface, logger);
            expect(responseHandler instanceof ResponseHandler).to.be.true;
        });
    });

    describe("setResponseIdToken()", () => {

        it("returns a tokenResponse with the idToken values filled in", () => {
            const tokenResponse: TokenResponse = {
                uniqueId: "",
                tenantId: "",
                scopes: ["openid", "profile"],
                tokenType: TEST_CONFIG.TOKEN_TYPE_BEARER,
                idToken: "",
                idTokenClaims: null,
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                expiresOn: null,
                account: testAccount,
                userRequestState: TEST_CONFIG.STATE
            }

            const expectedTokenResponse: TokenResponse = {
                ...tokenResponse,
                uniqueId: idToken.claims.oid,
                tenantId: idToken.claims.tid,
                idToken: idToken.rawIdToken,
                idTokenClaims: idToken.claims,
                expiresOn: new Date(Number(idToken.claims.exp) * 1000)
            };
            expect(ResponseHandler.setResponseIdToken(tokenResponse, idToken)).to.be.deep.eq(expectedTokenResponse);
        });

        it("returns null if original response is null or empty", () => {
            expect(ResponseHandler.setResponseIdToken(null, null)).to.be.null;
        });

        it("returns originalResponse if no idTokenObj given", () => {
            const tokenResponse: TokenResponse = {
                uniqueId: "",
                tenantId: "",
                scopes: ["openid", "profile"],
                tokenType: TEST_CONFIG.TOKEN_TYPE_BEARER,
                idToken: "",
                idTokenClaims: null,
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                expiresOn: null,
                account: testAccount,
                userRequestState: TEST_CONFIG.STATE
            };
            expect(ResponseHandler.setResponseIdToken(tokenResponse, null)).to.be.deep.eq(tokenResponse);
        });
    });

    describe("handleServerCodeResponse()", () => {

        let responseHandler: ResponseHandler;
        beforeEach(() => {
            responseHandler = new ResponseHandler(TEST_CONFIG.MSAL_CLIENT_ID, cacheStorage, cacheHelpers, cryptoInterface, logger);
        });

        it("throws state mismatch error if cached state does not match hash state", () => {
            const testServerParams: ServerAuthorizationCodeResponse = {
                code: "thisIsATestCode",
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                state: TEST_CONFIG.STATE
            };

            cacheStorage.setItem(TemporaryCacheKeys.REQUEST_STATE, RANDOM_TEST_GUID);
            expect(() => responseHandler.handleServerCodeResponse(testServerParams)).to.throw(ClientAuthErrorMessage.stateMismatchError.desc);
            expect(store).to.be.empty;

            cacheStorage.setItem(TemporaryCacheKeys.REQUEST_STATE, RANDOM_TEST_GUID);
            expect(() => responseHandler.handleServerCodeResponse(testServerParams)).to.throw(ClientAuthError);
            expect(store).to.be.empty;
        });

        it("throws ServerError if hash contains error parameters", () => {
            const TEST_ERROR_CODE: string = "test";
            const TEST_ERROR_MSG: string = "This is a test error";
            const testServerParams: ServerAuthorizationCodeResponse = {
                error: TEST_ERROR_CODE,
                error_description: TEST_ERROR_MSG,
                state: RANDOM_TEST_GUID
            };

            cacheStorage.setItem(TemporaryCacheKeys.REQUEST_STATE, RANDOM_TEST_GUID);
            expect(() => responseHandler.handleServerCodeResponse(testServerParams)).to.throw(TEST_ERROR_MSG);
            expect(store).to.be.empty;

            cacheStorage.setItem(TemporaryCacheKeys.REQUEST_STATE, RANDOM_TEST_GUID);
            expect(() => responseHandler.handleServerCodeResponse(testServerParams)).to.throw(ServerError);
            expect(store).to.be.empty;
        });

        it("throws InteractionRequiredAuthError if hash contains error parameters", () => {
            const TEST_ERROR_CODE: string = InteractionRequiredAuthErrorMessage.interactionRequired.code;
            const TEST_ERROR_MSG: string = `This is an ${InteractionRequiredAuthErrorMessage.interactionRequired.code} test error`;
            const testServerParams: ServerAuthorizationCodeResponse = {
                error: TEST_ERROR_CODE,
                error_description: TEST_ERROR_MSG,
                state: RANDOM_TEST_GUID
            };

            cacheStorage.setItem(TemporaryCacheKeys.REQUEST_STATE, RANDOM_TEST_GUID);
            expect(() => responseHandler.handleServerCodeResponse(testServerParams)).to.throw(TEST_ERROR_MSG);
            expect(store).to.be.empty;

            cacheStorage.setItem(TemporaryCacheKeys.REQUEST_STATE, RANDOM_TEST_GUID);
            expect(() => responseHandler.handleServerCodeResponse(testServerParams)).to.throw(InteractionRequiredAuthError);
            expect(store).to.be.empty;
        });

        it("Throws error if client info cannot be parsed correctly", () => {
            const testServerParams: ServerAuthorizationCodeResponse = {
                code: "thisIsATestCode",
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                state: RANDOM_TEST_GUID
            };

            cryptoInterface.base64Decode = (input: string): string => {
                throw "decoding error";
            };
            responseHandler = new ResponseHandler(TEST_CONFIG.MSAL_CLIENT_ID, cacheStorage, cacheHelpers, cryptoInterface, logger);
            cacheStorage.setItem(TemporaryCacheKeys.REQUEST_STATE, RANDOM_TEST_GUID);
            expect(() => responseHandler.handleServerCodeResponse(testServerParams)).to.throw(ClientAuthErrorMessage.clientInfoDecodingError.desc);
            expect(store).to.be.empty;

            cacheStorage.setItem(TemporaryCacheKeys.REQUEST_STATE, RANDOM_TEST_GUID);
            expect(() => responseHandler.handleServerCodeResponse(testServerParams)).to.throw(ClientAuthError);
            expect(store).to.be.empty;
        });

        it("Successfully handles a valid response from the server", () => {
            const testServerParams: ServerAuthorizationCodeResponse = {
                code: "thisIsATestCode",
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                state: RANDOM_TEST_GUID
            };

            cryptoInterface.base64Decode = (input: string): string => {
                switch (input) {
                    case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                        return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                    default:
                        return input;
                }
            };
            responseHandler = new ResponseHandler(TEST_CONFIG.MSAL_CLIENT_ID, cacheStorage, cacheHelpers, cryptoInterface, logger);
            cacheStorage.setItem(TemporaryCacheKeys.REQUEST_STATE, RANDOM_TEST_GUID);
            const codeResponse: CodeResponse = responseHandler.handleServerCodeResponse(testServerParams);
            expect(codeResponse).to.be.not.null;
            expect(codeResponse.code).to.be.eq(testServerParams.code);
            expect(codeResponse.userRequestState).to.be.eq(testServerParams.state);
        });
    });

    describe("validateServerAuthorizationTokenResponse()", () => {

        it("throws server error if it detects error values", () => {
            const testServerParams: ServerAuthorizationTokenResponse = {
                error: "TEST_CODE",
                error_description: "this is an error",
                error_codes: [],
                timestamp: "",
                trace_id: TEST_CONFIG.MSAL_CLIENT_ID,
                correlation_id: RANDOM_TEST_GUID
            };

            const responseHandler = new ResponseHandler(TEST_CONFIG.MSAL_CLIENT_ID, cacheStorage, cacheHelpers, cryptoInterface, logger);
            expect(() => responseHandler.validateServerAuthorizationTokenResponse(testServerParams)).to.throw(testServerParams.error_description);
            expect(() => responseHandler.validateServerAuthorizationTokenResponse(testServerParams)).to.throw(ServerError);
        });
    });

    describe("createTokenResponse()", () => {

        let responseHandler: ResponseHandler;
        let testServerParams: ServerAuthorizationTokenResponse;
        let expectedTokenResponse: TokenResponse;
        let atKey: AccessTokenKey;
        let atValue: AccessTokenValue;
        
        beforeEach(() => {
            responseHandler = new ResponseHandler(TEST_CONFIG.MSAL_CLIENT_ID, cacheStorage, cacheHelpers, cryptoInterface, logger);

            testServerParams = {
                token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                scope: "openid profile email",
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2
            };

            expectedTokenResponse = {
                uniqueId: idToken.claims.oid,
                tenantId: idToken.claims.tid,
                scopes: TEST_CONFIG.DEFAULT_SCOPES, 
                tokenType: TEST_CONFIG.TOKEN_TYPE_BEARER,
                idToken: idToken.rawIdToken,
                idTokenClaims: idToken.claims,
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                expiresOn: null,
                account: testAccount,
                userRequestState: ""
            };

            atKey = {
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                scopes: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                resource: "",
                homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID 
            };
            atValue = {
                tokenType: TEST_CONFIG.TOKEN_TYPE_BEARER,
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                idToken: TEST_TOKENS.IDTOKEN_V2,
                expiresOnSec: `${TimeUtils.nowSeconds() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN}`,
                extExpiresOnSec: `${TimeUtils.nowSeconds() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN}`
            };
        });

        it("throws error if idToken nonce is null or empty", () => {     
            sinon.restore();
            const idTokenClaims: IdTokenClaims = {
                "ver": "2.0",
                "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "exp": "1536361411",
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "nonce": ""
            };
            sinon.stub(IdToken, "extractIdToken").returns(idTokenClaims);
            const testResource = "";
            expect(() => responseHandler.createTokenResponse(testServerParams, `${Constants.DEFAULT_AUTHORITY}/`, testResource, RANDOM_TEST_GUID)).to.throw(ClientAuthErrorMessage.invalidIdToken.desc);
            expect(() => responseHandler.createTokenResponse(testServerParams, `${Constants.DEFAULT_AUTHORITY}/`, testResource, RANDOM_TEST_GUID)).to.throw(ClientAuthError);
        });

        it("throws error if nonce does not match", () => {
            const testResource = "";
            cacheStorage.setItem(cacheHelpers.generateNonceKey(RANDOM_TEST_GUID), "ThisDoesNotMatch");
            expect(() => responseHandler.createTokenResponse(testServerParams, `${Constants.DEFAULT_AUTHORITY}/`, testResource, RANDOM_TEST_GUID)).to.throw(ClientAuthErrorMessage.nonceMismatchError.desc);
            expect(() => responseHandler.createTokenResponse(testServerParams, `${Constants.DEFAULT_AUTHORITY}/`, testResource, RANDOM_TEST_GUID)).to.throw(ClientAuthError);
        });

        it("throws error if accounts do not match", () => {
            cryptoInterface.base64Decode = (input: string): string => {
                switch (input) {
                    case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                        return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                    default:
                        return input;
                }
            };

            const testAccount2: Account = {
                ...testAccount,
                accountIdentifier: RANDOM_TEST_GUID,
                homeAccountIdentifier: TEST_CONFIG.MSAL_TENANT_ID,
                name: "Some 1 Else",
                userName: "sum1else@test.com"
            };
            cacheStorage.setItem(cacheHelpers.generateNonceKey(RANDOM_TEST_GUID), idToken.claims.nonce);
            cacheStorage.setItem(PersistentCacheKeys.CLIENT_INFO, TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO);
            cacheStorage.setItem(cacheHelpers.generateAcquireTokenAccountKey(TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID), JSON.stringify(testAccount2));
            expect(() => responseHandler.createTokenResponse(testServerParams, `${Constants.DEFAULT_AUTHORITY}/`, "", RANDOM_TEST_GUID)).to.throw(ClientAuthErrorMessage.accountMismatchError.desc);
        });

        it("Successfully saves a token in the cache and returns a valid response", () => {
            cryptoInterface.base64Decode = (input: string): string => {
                switch (input) {
                    case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                        return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                    default:
                        return input;
                }
            };

            testServerParams.scope = "openid profile offline_access";

            cacheStorage.setItem(cacheHelpers.generateNonceKey(RANDOM_TEST_GUID), idToken.claims.nonce);
            cacheStorage.setItem(PersistentCacheKeys.CLIENT_INFO, TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO);
            cacheStorage.setItem(cacheHelpers.generateAcquireTokenAccountKey(TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID), JSON.stringify(testAccount));
            const tokenResponse = responseHandler.createTokenResponse(testServerParams, `${Constants.DEFAULT_AUTHORITY}/`, "", RANDOM_TEST_GUID);

            expect(tokenResponse.uniqueId).to.be.eq(expectedTokenResponse.uniqueId);
            expect(tokenResponse.tenantId).to.be.eq(expectedTokenResponse.tenantId);
            expect(tokenResponse.scopes).to.be.deep.eq(expectedTokenResponse.scopes);
            expect(tokenResponse.tokenType).to.be.eq(expectedTokenResponse.tokenType);
            expect(tokenResponse.idToken).to.be.eq(expectedTokenResponse.idToken);
            expect(tokenResponse.idTokenClaims).to.be.deep.eq(expectedTokenResponse.idTokenClaims);
            expect(tokenResponse.accessToken).to.be.eq(expectedTokenResponse.accessToken);
            expect(tokenResponse.expiresOn.getTime() / 1000 <= TimeUtils.nowSeconds() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN);
            expect(tokenResponse.account).to.be.deep.eq(expectedTokenResponse.account);
            expect(tokenResponse.userRequestState).to.be.eq(expectedTokenResponse.userRequestState);
        });

        it("Successfully overwrites a token if the scopes are intersecting", () => {
            cryptoInterface.base64Decode = (input: string): string => {
                switch (input) {
                    case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                        return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                    default:
                        return input;
                }
            };

            cacheStorage.setItem(JSON.stringify(atKey), JSON.stringify(atValue));
            const expectedScopes = [...TEST_CONFIG.DEFAULT_SCOPES, "user.read"];
            expectedTokenResponse.scopes= expectedScopes;
            
            testServerParams.scope = "openid profile offline_access user.read";
            
            cacheStorage.setItem(cacheHelpers.generateNonceKey(RANDOM_TEST_GUID), idToken.claims.nonce);
            cacheStorage.setItem(PersistentCacheKeys.CLIENT_INFO, TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO);
            cacheStorage.setItem(cacheHelpers.generateAcquireTokenAccountKey(TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID), JSON.stringify(testAccount));
            expect(cacheStorage.getKeys().length).to.be.eq(4);
            const tokenResponse = responseHandler.createTokenResponse(testServerParams, `${Constants.DEFAULT_AUTHORITY}/`, "", RANDOM_TEST_GUID);

            expect(tokenResponse.uniqueId).to.be.eq(expectedTokenResponse.uniqueId);
            expect(tokenResponse.tenantId).to.be.eq(expectedTokenResponse.tenantId);
            expect(tokenResponse.scopes).to.be.deep.eq(expectedTokenResponse.scopes);
            expect(tokenResponse.tokenType).to.be.eq(expectedTokenResponse.tokenType);
            expect(tokenResponse.idToken).to.be.eq(expectedTokenResponse.idToken);
            expect(tokenResponse.idTokenClaims).to.be.deep.eq(expectedTokenResponse.idTokenClaims);
            expect(tokenResponse.accessToken).to.be.eq(expectedTokenResponse.accessToken);
            expect(tokenResponse.expiresOn.getTime() / 1000 <= TimeUtils.nowSeconds() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN);
            expect(tokenResponse.account).to.be.deep.eq(expectedTokenResponse.account);
            expect(tokenResponse.userRequestState).to.be.eq(expectedTokenResponse.userRequestState);
            expect(cacheStorage.getKeys().length).to.be.eq(5);
        });

        it("Successfully creates a new token if the scopes are not intersecting", () => {
            cryptoInterface.base64Decode = (input: string): string => {
                switch (input) {
                    case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                        return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                    default:
                        return input;
                }
            };

            cacheStorage.setItem(JSON.stringify(atKey), JSON.stringify(atValue));

            const expectedScopes = ["offline_access", "testscope"];
            expectedTokenResponse.scopes = expectedScopes;
            
            const testScopes = "offline_access testscope";
            testServerParams.scope = testScopes;

            const expectedNewAtKey: AccessTokenKey = atKey;
            expectedNewAtKey.scopes = testScopes;
            const expectedNewAtValue: AccessTokenValue = atValue;

            cacheStorage.setItem(cacheHelpers.generateNonceKey(RANDOM_TEST_GUID), idToken.claims.nonce);
            cacheStorage.setItem(PersistentCacheKeys.CLIENT_INFO, TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO);
            cacheStorage.setItem(cacheHelpers.generateAcquireTokenAccountKey(TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID), JSON.stringify(testAccount));
            expect(cacheStorage.getKeys().length).to.be.eq(4);
            const tokenResponse = responseHandler.createTokenResponse(testServerParams, `${Constants.DEFAULT_AUTHORITY}/`, "", RANDOM_TEST_GUID);

            expect(tokenResponse.uniqueId).to.be.eq(expectedTokenResponse.uniqueId);
            expect(tokenResponse.tenantId).to.be.eq(expectedTokenResponse.tenantId);
            expect(tokenResponse.scopes).to.be.deep.eq(expectedTokenResponse.scopes);
            expect(tokenResponse.tokenType).to.be.eq(expectedTokenResponse.tokenType);
            expect(tokenResponse.idToken).to.be.eq(expectedTokenResponse.idToken);
            expect(tokenResponse.idTokenClaims).to.be.deep.eq(expectedTokenResponse.idTokenClaims);
            expect(tokenResponse.accessToken).to.be.eq(expectedTokenResponse.accessToken);
            expect(tokenResponse.expiresOn.getTime() / 1000 <= TimeUtils.nowSeconds() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN);
            expect(tokenResponse.account).to.be.deep.eq(expectedTokenResponse.account);
            expect(tokenResponse.userRequestState).to.be.eq(expectedTokenResponse.userRequestState);
            expect(cacheStorage.getKeys().length).to.be.eq(6);
            expect(cacheStorage.containsKey(JSON.stringify(atKey))).to.be.true;
            expect(cacheStorage.containsKey(JSON.stringify(expectedNewAtKey))).to.be.true;
            expect(cacheStorage.getItem(JSON.stringify(atKey))).to.be.eq(JSON.stringify(atValue));
            expect(cacheStorage.getItem(JSON.stringify(expectedNewAtKey))).to.be.eq(JSON.stringify(expectedNewAtValue));
        });
    });
});

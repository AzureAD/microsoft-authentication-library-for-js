import { expect } from "chai";
import sinon from "sinon";
import { SPAResponseHandler } from "../../src/response/SPAResponseHandler";
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
import { Constants, PersistentCacheKeys } from "../../src/utils/Constants";
import { ServerError } from "../../src/error/ServerError";
import { ServerAuthorizationTokenResponse } from "../../src/server/ServerAuthorizationTokenResponse";
import { TimeUtils } from "../../src/utils/TimeUtils";
import { InteractionRequiredAuthErrorMessage, InteractionRequiredAuthError, InteractionRequiredAuthSubErrorMessage } from "../../src/error/InteractionRequiredAuthError";
import { AccessTokenKey } from "../../src/cache/AccessTokenKey";
import { AccessTokenValue } from "../../src/cache/AccessTokenValue";
import { InMemoryCache } from "../../src/unifiedCache/utils/CacheTypes";

describe("SPAResponseHandler.ts Class Unit Tests", () => {

    let store = {};
    let cacheStorage: ICacheStorage;
    let cacheHelpers: CacheHelpers;
    let cryptoInterface: ICrypto;
    let logger: Logger;
    let testIdToken: IdToken;
    let testAccount: Account;
    beforeEach(() => {
        cacheStorage = {
            setItem(key: string, value: string): void {
                store[key] = value;
            },
            getItem(key: string): string {
                return store[key];
            },
            removeItem(key: string): boolean {
                delete store[key];
                return true;
            },
            containsKey(key: string): boolean {
                return !!store[key];
            },
            getKeys(): string[] {
                return Object.keys(store);
            },
            clear(): void {
                store = {};
            },
            getCache(): object {
                return null;
            },
            setCache(): void {
                return null;
            },
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
        testIdToken = new IdToken(TEST_TOKENS.IDTOKEN_V2, cryptoInterface);
        testAccount = new Account(idTokenClaims.oid, TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID, idTokenClaims, TEST_TOKENS.IDTOKEN_V2);
    });

    afterEach(() => {
        store = {};
        sinon.restore();
    });

    describe("Constructor", () => {

        it("Correctly creates a SPAResponseHandler object", () => {
            const spaResponseHandler = new SPAResponseHandler(TEST_CONFIG.MSAL_CLIENT_ID, cacheStorage, cacheHelpers, cryptoInterface, logger);
            expect(spaResponseHandler instanceof SPAResponseHandler).to.be.true;
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
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                expiresOn: null,
                account: testAccount,
                userRequestState: TEST_CONFIG.STATE
            }

            const expectedTokenResponse: TokenResponse = {
                ...tokenResponse,
                uniqueId: testIdToken.claims.oid,
                tenantId: testIdToken.claims.tid,
                idToken: testIdToken.rawIdToken,
                idTokenClaims: testIdToken.claims,
                expiresOn: new Date(Number(testIdToken.claims.exp) * 1000)
            };
            expect(SPAResponseHandler.setResponseIdToken(tokenResponse, testIdToken)).to.be.deep.eq(expectedTokenResponse);
        });

        it("returns null if original response is null or empty", () => {
            expect(SPAResponseHandler.setResponseIdToken(null, null)).to.be.null;
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
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                expiresOn: null,
                account: testAccount,
                userRequestState: TEST_CONFIG.STATE
            };
            expect(SPAResponseHandler.setResponseIdToken(tokenResponse, null)).to.be.deep.eq(tokenResponse);
        });
    });

    describe("handleServerCodeResponse()", () => {

        let spaResponseHandler: SPAResponseHandler;
        beforeEach(() => {
            spaResponseHandler = new SPAResponseHandler(TEST_CONFIG.MSAL_CLIENT_ID, cacheStorage, cacheHelpers, cryptoInterface, logger);
        });

        it("throws state mismatch error if cached state does not match hash state", () => {
            const testServerParams: ServerAuthorizationCodeResponse = {
                code: "thisIsATestCode",
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                state: TEST_CONFIG.STATE
            };

            expect(() => spaResponseHandler.handleServerCodeResponse(testServerParams, RANDOM_TEST_GUID)).to.throw(ClientAuthErrorMessage.stateMismatchError.desc);
            expect(store).to.be.empty;

            expect(() => spaResponseHandler.handleServerCodeResponse(testServerParams, RANDOM_TEST_GUID)).to.throw(ClientAuthError);
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

            expect(() => spaResponseHandler.handleServerCodeResponse(testServerParams, RANDOM_TEST_GUID)).to.throw(TEST_ERROR_MSG);
            expect(store).to.be.empty;

            expect(() => spaResponseHandler.handleServerCodeResponse(testServerParams, RANDOM_TEST_GUID)).to.throw(ServerError);
            expect(store).to.be.empty;
        });

        it("throws InteractionRequiredAuthError if hash contains error parameters", () => {
            const TEST_ERROR_CODE: string = InteractionRequiredAuthErrorMessage[0];
            const TEST_ERROR_MSG: string = `This is an ${InteractionRequiredAuthErrorMessage[0]} test error`;
            const testServerParams: ServerAuthorizationCodeResponse = {
                error: TEST_ERROR_CODE,
                error_description: TEST_ERROR_MSG,
                state: RANDOM_TEST_GUID
            };

            expect(() => spaResponseHandler.handleServerCodeResponse(testServerParams, RANDOM_TEST_GUID)).to.throw(TEST_ERROR_MSG);
            expect(store).to.be.empty;

            expect(() => spaResponseHandler.handleServerCodeResponse(testServerParams, RANDOM_TEST_GUID)).to.throw(InteractionRequiredAuthError);
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
            spaResponseHandler = new SPAResponseHandler(TEST_CONFIG.MSAL_CLIENT_ID, cacheStorage, cacheHelpers, cryptoInterface, logger);
            expect(() => spaResponseHandler.handleServerCodeResponse(testServerParams, RANDOM_TEST_GUID)).to.throw(ClientAuthErrorMessage.clientInfoDecodingError.desc);
            expect(store).to.be.empty;

            expect(() => spaResponseHandler.handleServerCodeResponse(testServerParams, RANDOM_TEST_GUID)).to.throw(ClientAuthError);
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
            spaResponseHandler = new SPAResponseHandler(TEST_CONFIG.MSAL_CLIENT_ID, cacheStorage, cacheHelpers, cryptoInterface, logger);
            const code = spaResponseHandler.handleServerCodeResponse(testServerParams, RANDOM_TEST_GUID);
            expect(code).to.be.eq(testServerParams.code);
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

            const spaResponseHandler = new SPAResponseHandler(TEST_CONFIG.MSAL_CLIENT_ID, cacheStorage, cacheHelpers, cryptoInterface, logger);
            expect(() => spaResponseHandler.validateServerAuthorizationTokenResponse(testServerParams)).to.throw(testServerParams.error_description);
            expect(() => spaResponseHandler.validateServerAuthorizationTokenResponse(testServerParams)).to.throw(ServerError);
        });

        it("throws InteractionRequiredAuthError if hash contains error parameters", () => {
            const TEST_ERROR_CODE: string = InteractionRequiredAuthErrorMessage[0];
            const TEST_ERROR_MSG: string = `This is an ${InteractionRequiredAuthErrorMessage[0]} test error`;
            const testServerParams: ServerAuthorizationTokenResponse = {
                error: TEST_ERROR_CODE,
                error_description: TEST_ERROR_MSG
            };

            const responseHandler = new SPAResponseHandler(TEST_CONFIG.MSAL_CLIENT_ID, cacheStorage, cacheHelpers, cryptoInterface, logger);
            expect(() => responseHandler.validateServerAuthorizationTokenResponse(testServerParams)).to.throw(testServerParams.error_description);
            expect(() => responseHandler.validateServerAuthorizationTokenResponse(testServerParams)).to.throw(ServerError);
            expect(() => responseHandler.validateServerAuthorizationTokenResponse(testServerParams)).to.throw(InteractionRequiredAuthError);
        });

        it("throws InteractionRequiredAuthError if hash contains interaction required sub-error", () => {
            const TEST_ERROR_CODE: string = InteractionRequiredAuthErrorMessage[0];
            const TEST_ERROR_MSG: string = `This is an ${InteractionRequiredAuthErrorMessage[0]} test error`;
            const testServerParams: ServerAuthorizationTokenResponse = {
                error: "invalid_grant",
                error_description: "test error",
                suberror: InteractionRequiredAuthSubErrorMessage[0]
            };

            const responseHandler = new SPAResponseHandler(TEST_CONFIG.MSAL_CLIENT_ID, cacheStorage, cacheHelpers, cryptoInterface, logger);
            expect(() => responseHandler.validateServerAuthorizationTokenResponse(testServerParams)).to.throw(testServerParams.error_description);
            expect(() => responseHandler.validateServerAuthorizationTokenResponse(testServerParams)).to.throw(ServerError);
            expect(() => responseHandler.validateServerAuthorizationTokenResponse(testServerParams)).to.throw(InteractionRequiredAuthError);
        });
    });

    describe("createTokenResponse()", () => {

        let responseHandler: SPAResponseHandler;
        let testServerParams: ServerAuthorizationTokenResponse;
        let expectedTokenResponse: TokenResponse;
        let atKey: AccessTokenKey;
        let atValue: AccessTokenValue;

        beforeEach(() => {
            responseHandler = new SPAResponseHandler(TEST_CONFIG.MSAL_CLIENT_ID, cacheStorage, cacheHelpers, cryptoInterface, logger);

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
                uniqueId: testIdToken.claims.oid,
                tenantId: testIdToken.claims.tid,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                tokenType: TEST_CONFIG.TOKEN_TYPE_BEARER,
                idToken: testIdToken.rawIdToken,
                idTokenClaims: testIdToken.claims,
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                expiresOn: null,
                account: testAccount,
                userRequestState: RANDOM_TEST_GUID
            };

            atKey = {
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                scopes: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID
            };
            atValue = {
                tokenType: TEST_CONFIG.TOKEN_TYPE_BEARER,
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                idToken: TEST_TOKENS.IDTOKEN_V2,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
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
            expect(() => responseHandler.createTokenResponse(testServerParams, RANDOM_TEST_GUID, `${Constants.DEFAULT_AUTHORITY}/`, null, RANDOM_TEST_GUID)).to.throw(ClientAuthErrorMessage.invalidIdToken.desc);
            expect(() => responseHandler.createTokenResponse(testServerParams, RANDOM_TEST_GUID, `${Constants.DEFAULT_AUTHORITY}/`, null, RANDOM_TEST_GUID)).to.throw(ClientAuthError);
        });

        it("throws error if nonce does not match", () => {
            expect(() => responseHandler.createTokenResponse(testServerParams, RANDOM_TEST_GUID, `${Constants.DEFAULT_AUTHORITY}/`, null, RANDOM_TEST_GUID)).to.throw(ClientAuthErrorMessage.nonceMismatchError.desc);
            expect(() => responseHandler.createTokenResponse(testServerParams, RANDOM_TEST_GUID, `${Constants.DEFAULT_AUTHORITY}/`, null, RANDOM_TEST_GUID)).to.throw(ClientAuthError);
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
            cacheStorage.setItem(PersistentCacheKeys.CLIENT_INFO, TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO);
            expect(() => responseHandler.createTokenResponse(testServerParams, RANDOM_TEST_GUID, `${Constants.DEFAULT_AUTHORITY}/`, testAccount2)).to.throw(ClientAuthErrorMessage.accountMismatchError.desc);
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

            cacheStorage.setItem(PersistentCacheKeys.CLIENT_INFO, TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO);
            const tokenResponse = responseHandler.createTokenResponse(testServerParams, RANDOM_TEST_GUID, `${Constants.DEFAULT_AUTHORITY}/`, testAccount);

            expect(tokenResponse.uniqueId).to.be.eq(expectedTokenResponse.uniqueId);
            expect(tokenResponse.tenantId).to.be.eq(expectedTokenResponse.tenantId);
            expect(tokenResponse.scopes).to.be.deep.eq(expectedTokenResponse.scopes);
            expect(tokenResponse.tokenType).to.be.eq(expectedTokenResponse.tokenType);
            expect(tokenResponse.idToken).to.be.eq(expectedTokenResponse.idToken);
            expect(tokenResponse.idTokenClaims).to.be.deep.eq(expectedTokenResponse.idTokenClaims);
            expect(tokenResponse.accessToken).to.be.eq(expectedTokenResponse.accessToken);
            expect(tokenResponse.refreshToken).to.be.eq(expectedTokenResponse.refreshToken);
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

			cacheStorage.setItem(PersistentCacheKeys.CLIENT_INFO, TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO);
			cacheStorage.setItem(PersistentCacheKeys.ID_TOKEN, TEST_TOKENS.IDTOKEN_V2);
            expect(cacheStorage.getKeys().length).to.be.eq(3);
            const tokenResponse = responseHandler.createTokenResponse(testServerParams, RANDOM_TEST_GUID, `${Constants.DEFAULT_AUTHORITY}/`, testAccount);

            expect(tokenResponse.uniqueId).to.be.eq(expectedTokenResponse.uniqueId);
            expect(tokenResponse.tenantId).to.be.eq(expectedTokenResponse.tenantId);
            expect(tokenResponse.scopes).to.be.deep.eq(expectedTokenResponse.scopes);
            expect(tokenResponse.tokenType).to.be.eq(expectedTokenResponse.tokenType);
            expect(tokenResponse.idToken).to.be.eq(expectedTokenResponse.idToken);
            expect(tokenResponse.idTokenClaims).to.be.deep.eq(expectedTokenResponse.idTokenClaims);
            expect(tokenResponse.accessToken).to.be.eq(expectedTokenResponse.accessToken);
            expect(tokenResponse.refreshToken).to.be.eq(expectedTokenResponse.refreshToken);
            expect(tokenResponse.expiresOn.getTime() / 1000 <= TimeUtils.nowSeconds() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN);
            expect(tokenResponse.account).to.be.deep.eq(expectedTokenResponse.account);
			expect(tokenResponse.userRequestState).to.be.eq(expectedTokenResponse.userRequestState);
			expect(cacheStorage.getKeys().length).to.be.eq(3);
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
			cacheStorage.setItem(PersistentCacheKeys.ID_TOKEN, TEST_TOKENS.IDTOKEN_V2);
            cacheStorage.setItem(PersistentCacheKeys.CLIENT_INFO, TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO);
            expect(cacheStorage.getKeys().length).to.be.eq(3);
            const tokenResponse = responseHandler.createTokenResponse(testServerParams, RANDOM_TEST_GUID, `${Constants.DEFAULT_AUTHORITY}/`, testAccount);

            expect(tokenResponse.uniqueId).to.be.eq(expectedTokenResponse.uniqueId);
            expect(tokenResponse.tenantId).to.be.eq(expectedTokenResponse.tenantId);
            expect(tokenResponse.scopes).to.be.deep.eq(expectedTokenResponse.scopes);
            expect(tokenResponse.tokenType).to.be.eq(expectedTokenResponse.tokenType);
            expect(tokenResponse.idToken).to.be.eq(expectedTokenResponse.idToken);
            expect(tokenResponse.idTokenClaims).to.be.deep.eq(expectedTokenResponse.idTokenClaims);
            expect(tokenResponse.accessToken).to.be.eq(expectedTokenResponse.accessToken);
            expect(tokenResponse.refreshToken).to.be.eq(expectedTokenResponse.refreshToken);
            expect(tokenResponse.expiresOn.getTime() / 1000 <= TimeUtils.nowSeconds() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN);
            expect(tokenResponse.account).to.be.deep.eq(expectedTokenResponse.account);
            expect(tokenResponse.userRequestState).to.be.eq(expectedTokenResponse.userRequestState);
            expect(cacheStorage.getKeys().length).to.be.eq(4);
            expect(cacheStorage.containsKey(JSON.stringify(atKey))).to.be.true;
            expect(cacheStorage.containsKey(JSON.stringify(expectedNewAtKey))).to.be.true;
            expect(cacheStorage.getItem(JSON.stringify(atKey))).to.be.eq(JSON.stringify(atValue));
            expect(cacheStorage.getItem(JSON.stringify(expectedNewAtKey))).to.be.eq(JSON.stringify(expectedNewAtValue));
        });
    });
});

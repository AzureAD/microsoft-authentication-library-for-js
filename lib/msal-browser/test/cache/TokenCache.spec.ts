import sinon from "sinon";
import { Logger, LogLevel,IdTokenEntity, AccessTokenEntity, ClientInfo, ScopeSet, ServerAuthorizationROPCResponse} from "@azure/msal-common";
import { TokenCache, LoadTokenOptions } from "./../../src/cache/TokenCache";
import { CryptoOps } from "../../src/crypto/CryptoOps";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager";
import { CacheOptions, Configuration } from "../../src/config/Configuration";
import { BrowserCacheLocation } from "../../src/utils/BrowserConstants";
import { TEST_CONFIG, TEST_DATA_CLIENT_INFO, TEST_TOKENS, TEST_TOKEN_LIFETIMES, TEST_URIS } from "../utils/StringConstants";
import { BrowserAuthErrorMessage, SilentRequest } from "../../src";


describe("TokenCache tests", () => {

    let configuration: Configuration;
    let logger: Logger;
    let browserStorage: BrowserCacheManager;
    let cacheConfig: Required<CacheOptions>;

    const cryptoObj = new CryptoOps();
    beforeEach(() => {
        configuration = {
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        };
        cacheConfig = {
            cacheLocation: BrowserCacheLocation.SessionStorage,
            storeAuthStateInCookie: false,
            secureCookies: false
        }; 
        logger = new Logger({
            loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {},
            piiLoggingEnabled: true
        });
        browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, cryptoObj, logger);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        sinon.restore();
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    describe("loadTokens()", () => {
        let tokenCache: TokenCache;
        let testEnvironment: string;
        let testClientInfo: ClientInfo;
        let testIdToken: string;
        let idTokenEntity: IdTokenEntity;
        let idTokenKey: string;
        let testAccessToken: string;
        let accessTokenEntity: AccessTokenEntity;
        let accessTokenKey: string;
        let scopeString: string;

        beforeEach(() => {
            tokenCache = new TokenCache(configuration, browserStorage, logger, cryptoObj);
            testEnvironment = 'login.microsoftonline.com'

            testClientInfo = {
                uid: TEST_DATA_CLIENT_INFO.TEST_UID_ENCODED,
                utid: TEST_DATA_CLIENT_INFO.TEST_UTID_ENCODED
            }

            testIdToken = TEST_TOKENS.IDTOKEN_V2;
            idTokenEntity = IdTokenEntity.createIdTokenEntity(TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID, testEnvironment, TEST_TOKENS.IDTOKEN_V2, configuration.auth.clientId, TEST_CONFIG.TENANT)
            idTokenKey = idTokenEntity.generateCredentialKey();

            scopeString = new ScopeSet(TEST_CONFIG.DEFAULT_SCOPES).printScopes();
            testAccessToken = TEST_TOKENS.ACCESS_TOKEN,
            accessTokenEntity = AccessTokenEntity.createAccessTokenEntity(TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID, testEnvironment, testAccessToken, configuration.auth.clientId, TEST_CONFIG.TENANT, scopeString, TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN, TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP, cryptoObj);
            accessTokenKey = accessTokenEntity.generateCredentialKey();
        });

        afterEach(() => {
            browserStorage.clear();
        });

        it("loads id token with a request account", () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: {
                    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                    environment: testEnvironment,
                    tenantId: TEST_CONFIG.TENANT,
                    username: "username",
                    localAccountId: "localAccountId" 
                }
            };
            const response: ServerAuthorizationROPCResponse = {
                id_token: testIdToken
            };
            const options: LoadTokenOptions = {};
            tokenCache.loadTokens(request, response, options); 

            expect(browserStorage.getIdTokenCredential(idTokenKey)).toEqual(idTokenEntity);
        });

        it("loads id token with request authority and client info", () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                authority: `${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}`
            };
            const response: ServerAuthorizationROPCResponse = {
                id_token: testIdToken
            };
            const options: LoadTokenOptions = {
                clientInfo: testClientInfo
            };
            tokenCache.loadTokens(request, response, options);

            expect(browserStorage.getIdTokenCredential(idTokenKey)).toEqual(idTokenEntity);
        });

        it("throws error if id token not provided in response", () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: {
                    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                    environment: testEnvironment,
                    tenantId: TEST_CONFIG.TENANT,
                    username: "username",
                    localAccountId: "localAccountId" 
                }
            };
            const response: ServerAuthorizationROPCResponse = {};
            const options: LoadTokenOptions = {};

            expect(() => tokenCache.loadTokens(request, response, options)).toThrowError(`${BrowserAuthErrorMessage.unableToLoadTokenError.desc} | Please ensure server response includes id token.`);
        });

        it("throws error if request does not have account and authority", () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
            };
            const response: ServerAuthorizationROPCResponse = {
                id_token: testIdToken
            };
            const options: LoadTokenOptions = {};

            expect(() => tokenCache.loadTokens(request, response, options)).toThrowError(`${BrowserAuthErrorMessage.unableToLoadTokenError.desc} | Please provide a request with an account, or a request with authority and clientInfo.`);
        });

        it("throws error if server response provided does not have expires_in", () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: {
                    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                    environment: testEnvironment,
                    tenantId: TEST_CONFIG.TENANT,
                    username: "username",
                    localAccountId: "localAccountId" 
                }
            };
            const response: ServerAuthorizationROPCResponse = {
                id_token: testIdToken,
                access_token: testAccessToken
            };
            const options: LoadTokenOptions = {};

            expect(() => tokenCache.loadTokens(request, response, options)).toThrowError(`${BrowserAuthErrorMessage.unableToLoadTokenError.code}: ${BrowserAuthErrorMessage.unableToLoadTokenError.desc} | Please ensure server response includes expires_in value.`);
        });

        it("throws error if extendedExpiresOn not provided in options", () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: {
                    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                    environment: testEnvironment,
                    tenantId: TEST_CONFIG.TENANT,
                    username: "username",
                    localAccountId: "localAccountId" 
                }
            };
            const response: ServerAuthorizationROPCResponse = {
                id_token: testIdToken,
                access_token: testAccessToken,
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN
            };
            const options: LoadTokenOptions = {};

            expect(() => tokenCache.loadTokens(request, response, options)).toThrowError(`${BrowserAuthErrorMessage.unableToLoadTokenError.code}: ${BrowserAuthErrorMessage.unableToLoadTokenError.desc} | Please provide an extendedExpiresOn value in the options.`);
        });

        it("loads access tokens from server response and token options", () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: {
                    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                    environment: testEnvironment,
                    tenantId: TEST_CONFIG.TENANT,
                    username: "username",
                    localAccountId: "localAccountId" 
                }
            };
            const response: ServerAuthorizationROPCResponse = {
                id_token: testIdToken,
                access_token: testAccessToken,
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
            };
            const options: LoadTokenOptions = {
                extendedExpiresOn: TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP
            };
            tokenCache.loadTokens(request, response, options); 

            expect(browserStorage.getAccessTokenCredential(accessTokenKey)).toEqual(accessTokenEntity);
        });

        it("throws error if callback not provided in non-browser environment", () => {
            tokenCache.isBrowserEnvironment = false;
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: {
                    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                    environment: testEnvironment,
                    tenantId: TEST_CONFIG.TENANT,
                    username: "username",
                    localAccountId: "localAccountId" 
                }
            };
            const response: ServerAuthorizationROPCResponse = {
                id_token: testIdToken,
                access_token: testAccessToken,
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN
            };
            const options: LoadTokenOptions = {};

            expect(() => tokenCache.loadTokens(request, response, options)).toThrowError(`${BrowserAuthErrorMessage.unableToLoadTokenError.code}: ${BrowserAuthErrorMessage.unableToLoadTokenError.desc} | Please provide callback to cache id tokens in non-browser environments.`);
        });

    });
});

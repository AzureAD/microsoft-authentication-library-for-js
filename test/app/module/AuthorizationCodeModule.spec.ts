import * as Mocha from "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
const expect = chai.expect;
chai.use(chaiAsPromised);
import { AuthorizationCodeModule } from "../../../src/app/module/AuthorizationCodeModule";
import { TEST_CONFIG, TEST_URIS, RANDOM_TEST_GUID, DEFAULT_OPENID_CONFIG_RESPONSE, TEST_TOKENS } from "../../utils/StringConstants";
import { AuthModule } from "../../../src/app/module/AuthModule";
import { AuthenticationParameters } from "../../../src/request/AuthenticationParameters";
import { ClientConfigurationError } from "../../../src/error/ClientConfigurationError";
import { LogLevel, PkceCodes, NetworkRequestOptions, PublicClientSPAConfiguration, Authority, StringUtils, Constants, TokenExchangeParameters, AuthError } from "../../../src";
import sinon from "sinon";
import { AadAuthority } from "../../../src/auth/authority/AadAuthority";
import { AADServerParamKeys, TemporaryCacheKeys, PersistentCacheKeys } from "../../../src/utils/Constants";
import { ServerCodeRequestParameters } from "../../../src/server/ServerCodeRequestParameters";
import { IdTokenClaims } from "../../../src/auth/IdTokenClaims";
import { IdToken } from "../../../src/auth/IdToken";

describe("AuthorizationCodeModule.ts Class Unit Tests", () => {


    const testLoggerCallback = (level: LogLevel, message: string, containsPii: boolean): void => {
        if (containsPii) {
            console.log(`Log level: ${level} Message: ${message}`);
        }
    }

    let store = {};
    let defaultAuthConfig: PublicClientSPAConfiguration;

    beforeEach(() => {
        let store = {};
        defaultAuthConfig = {
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                tmp_clientSecret: TEST_CONFIG.MSAL_CLIENT_SECRET,
                authority: TEST_CONFIG.validAuthority,
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                postLogoutRedirectUri: TEST_URIS.TEST_LOGOUT_URI
            },
            storageInterface: {
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
            },
            networkInterface: {
                sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                },
                sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                }
            },
            cryptoInterface: {
                createNewGuid(): string {
                    return RANDOM_TEST_GUID;
                },
                base64Decode(input: string): string {
                    return input;
                },
                base64Encode(input: string): string {
                    return input;
                },
                async generatePkceCodes(): Promise<PkceCodes> {
                    return {
                        challenge: TEST_CONFIG.TEST_CHALLENGE,
                        verifier: TEST_CONFIG.TEST_VERIFIER
                    }
                }
            },
            loggerOptions: {
                loggerCallback: testLoggerCallback
            }
        };
    });

    describe("Constructor", () => {

        it("creates an AuthorizationCodeModule that extends the AuthModule", () => {
            const authModule = new AuthorizationCodeModule(defaultAuthConfig);
            expect(authModule).to.be.not.null;
            expect(authModule instanceof AuthorizationCodeModule).to.be.true;
            expect(authModule instanceof AuthModule).to.be.true;
        });
    });

    describe("Login Url Creation", () => {

        let authModule: AuthorizationCodeModule;

        beforeEach(() => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            authModule = new AuthorizationCodeModule(defaultAuthConfig);
        });

        afterEach(() => {
            sinon.restore();
        });
        
        it("Creates a loginUrl with default scopes", async () => {
            const emptyRequest: AuthenticationParameters = {};
            const loginUrl = await authModule.createLoginUrl(emptyRequest);
            expect(loginUrl).to.contain(Constants.DEFAULT_AUTHORITY);
            expect(loginUrl).to.contain(DEFAULT_OPENID_CONFIG_RESPONSE.authorization_endpoint);
            expect(loginUrl).to.contain(`${AADServerParamKeys.SCOPE}=${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIR_URI)}`);
        });

        it("Updates cache entries correctly", async () => {
            const emptyRequest: AuthenticationParameters = {};
            const loginUrl = await authModule.createLoginUrl(emptyRequest);
            expect(defaultAuthConfig.storageInterface.getItem(TemporaryCacheKeys.REQUEST_STATE)).to.be.deep.eq(RANDOM_TEST_GUID);
            expect(defaultAuthConfig.storageInterface.getItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|${RANDOM_TEST_GUID}`)).to.be.eq(RANDOM_TEST_GUID);
            expect(defaultAuthConfig.storageInterface.getItem(`${TemporaryCacheKeys.AUTHORITY}|${RANDOM_TEST_GUID}`)).to.be.eq(Constants.DEFAULT_AUTHORITY);
        });

        it("Uses scopes from given token request", async () => {
            const testScope1 = "testscope1";
            const testScope2 = "testscope2";
            const loginRequest: AuthenticationParameters = {
                scopes: [testScope1, testScope2]
            };
            const loginUrl = await authModule.createLoginUrl(loginRequest);
            expect(loginUrl).to.contain(`${AADServerParamKeys.SCOPE}=${encodeURIComponent(`${testScope1} ${testScope2} ${Constants.OPENID_SCOPE} ${Constants.PROFILE_SCOPE} ${Constants.OFFLINE_ACCESS_SCOPE}`)}`);
        });

        it("Caches token request correctly", async () => {
            const emptyRequest: AuthenticationParameters = {};
            const loginUrl = await authModule.createLoginUrl(emptyRequest);
            const cachedRequest: TokenExchangeParameters = JSON.parse(defaultAuthConfig.storageInterface.getItem(TemporaryCacheKeys.REQUEST_PARAMS));
            expect(cachedRequest.scopes).to.be.empty;
            expect(cachedRequest.codeVerifier).to.be.deep.eq(TEST_CONFIG.TEST_VERIFIER);
            expect(cachedRequest.authority).to.be.deep.eq(`${Constants.DEFAULT_AUTHORITY}/`);
            expect(cachedRequest.correlationId).to.be.deep.eq(RANDOM_TEST_GUID);
            expect(cachedRequest.extraQueryParameters).to.be.undefined;
            expect(cachedRequest.resource).to.be.undefined;
        });

        it("Uses authority if given in request", async () => {
            const loginRequest: AuthenticationParameters = {
                authority: TEST_URIS.ALTERNATE_INSTANCE
            };
            const loginUrl = await authModule.createLoginUrl(loginRequest);
            expect(loginUrl).to.contain(TEST_URIS.ALTERNATE_INSTANCE);
            expect(loginUrl).to.contain(DEFAULT_OPENID_CONFIG_RESPONSE.authorization_endpoint);
            expect(loginUrl).to.contain(`${AADServerParamKeys.SCOPE}=${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIR_URI)}`);
        });

        it("Cleans cache before error is thrown", async () => {
            const guidCreationErr = "GUID can't be created.";
            const emptyRequest: AuthenticationParameters = {};
            defaultAuthConfig.cryptoInterface.createNewGuid = (): string => {
                throw AuthError.createUnexpectedError(guidCreationErr);
            };
            authModule = new AuthorizationCodeModule(defaultAuthConfig);
            await expect(authModule.createLoginUrl(emptyRequest)).to.be.rejectedWith(guidCreationErr);
            expect(store).to.be.empty;
        });

        it("Uses adal token from cache if it is present.", async () => {
            const idTokenClaims: IdTokenClaims = {
                "iss": "https://sts.windows.net/fa15d692-e9c7-4460-a743-29f2956fd429/",
                "exp": "1536279024",
                "name": "abeli",
                "nonce": "123523",
                "oid": "05833b6b-aa1d-42d4-9ec0-1b2bb9194438",
                "sub": "5_J9rSss8-jvt_Icu6ueRNL8xXb8LF4Fsg_KooC2RJQ",
                "tid": "fa15d692-e9c7-4460-a743-29f2956fd429",
                "ver": "1.0"
            };
            sinon.stub(IdToken, "extractIdToken").returns(idTokenClaims);
            defaultAuthConfig.storageInterface.setItem(PersistentCacheKeys.ADAL_ID_TOKEN, TEST_TOKENS.IDTOKEN_V1);
            const testToken = new IdToken(TEST_TOKENS.IDTOKEN_V1, defaultAuthConfig.cryptoInterface);
            const queryParamSpy = sinon.spy(ServerCodeRequestParameters.prototype, "populateQueryParams");
            authModule = new AuthorizationCodeModule(defaultAuthConfig);
            const emptyRequest: AuthenticationParameters = {};
            const loginUrl = await authModule.createLoginUrl(emptyRequest);
            expect(queryParamSpy.calledWith(testToken)).to.be.true;
        });

        it("Does not use adal token from cache if it is present and SSO params have been given.", async () => {
            const idTokenClaims: IdTokenClaims = {
                "iss": "https://sts.windows.net/fa15d692-e9c7-4460-a743-29f2956fd429/",
                "exp": "1536279024",
                "name": "abeli",
                "nonce": "123523",
                "oid": "05833b6b-aa1d-42d4-9ec0-1b2bb9194438",
                "sub": "5_J9rSss8-jvt_Icu6ueRNL8xXb8LF4Fsg_KooC2RJQ",
                "tid": "fa15d692-e9c7-4460-a743-29f2956fd429",
                "ver": "1.0"
            };
            sinon.stub(IdToken, "extractIdToken").returns(idTokenClaims);
            defaultAuthConfig.storageInterface.setItem(PersistentCacheKeys.ADAL_ID_TOKEN, TEST_TOKENS.IDTOKEN_V1);
            const testToken = new IdToken(TEST_TOKENS.IDTOKEN_V1, defaultAuthConfig.cryptoInterface);
            const queryParamSpy = sinon.spy(ServerCodeRequestParameters.prototype, "populateQueryParams");
            authModule = new AuthorizationCodeModule(defaultAuthConfig);
            const loginRequest: AuthenticationParameters = {
                loginHint: "AbeLi@microsoft.com"
            };
            const loginUrl = await authModule.createLoginUrl(loginRequest);
            expect(queryParamSpy.calledWith(testToken)).to.be.false;
        });


    });

    describe("Acquire Token Url Creation", () => {
        
    });

    describe("Token Acquisition", () => {
        
    });

    describe("Getters and setters", () => {

        let redirectUriFunc = () => {
            return TEST_URIS.TEST_REDIR_URI;
        };

        let postLogoutRedirectUriFunc = () => {
            return TEST_URIS.TEST_LOGOUT_URI;
        };

        let authModule_functionRedirectUris = new AuthorizationCodeModule({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                tmp_clientSecret: TEST_CONFIG.MSAL_CLIENT_SECRET,
                authority: TEST_CONFIG.validAuthority,
                redirectUri: redirectUriFunc,
                postLogoutRedirectUri: postLogoutRedirectUriFunc
            },
            storageInterface: null,
            networkInterface: null,
            cryptoInterface: null,
            loggerOptions: {
                loggerCallback: testLoggerCallback
            }
        });

        let authModule_noRedirectUris = new AuthorizationCodeModule({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                tmp_clientSecret: TEST_CONFIG.MSAL_CLIENT_SECRET,
                authority: TEST_CONFIG.validAuthority
            },
            storageInterface: null,
            networkInterface: null,
            cryptoInterface: null,
            loggerOptions: {
                loggerCallback: testLoggerCallback
            }
        });

        it("gets configured redirect uri", () => {
            const authModule = new AuthorizationCodeModule(defaultAuthConfig);
            expect(authModule.getRedirectUri()).to.be.deep.eq(TEST_URIS.TEST_REDIR_URI);
        });

        it("gets configured redirect uri if uri is a function", () => {
            expect(authModule_functionRedirectUris.getRedirectUri()).to.be.deep.eq(TEST_URIS.TEST_REDIR_URI);
        });

        it("throws error if redirect uri is null/empty", () => {
            expect(() => authModule_noRedirectUris.getRedirectUri()).to.throw(ClientConfigurationError.createRedirectUriEmptyError().message);
        });

        it("gets configured post logout redirect uri", () => {
            const authModule = new AuthorizationCodeModule(defaultAuthConfig);
            expect(authModule.getPostLogoutRedirectUri()).to.be.deep.eq(TEST_URIS.TEST_LOGOUT_URI);
        });

        it("gets configured post logout redirect uri if uri is a function", () => {
            expect(authModule_functionRedirectUris.getPostLogoutRedirectUri()).to.be.deep.eq(TEST_URIS.TEST_LOGOUT_URI);
        });

        it("throws error if post logout redirect uri is null/empty", () => {
            expect(() => authModule_noRedirectUris.getPostLogoutRedirectUri()).to.throw(ClientConfigurationError.createPostLogoutRedirectUriEmptyError().message);
        });
    });
});

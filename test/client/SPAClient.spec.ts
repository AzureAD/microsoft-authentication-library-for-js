import { expect } from "chai";
import { SPAClient } from "../../src/client/SPAClient";
import { TEST_CONFIG, TEST_URIS, RANDOM_TEST_GUID, DEFAULT_OPENID_CONFIG_RESPONSE, TEST_TOKENS, ALTERNATE_OPENID_CONFIG_RESPONSE, TEST_DATA_CLIENT_INFO, TEST_TOKEN_LIFETIMES } from "../utils/StringConstants";
import { BaseClient } from "../../src/client/BaseClient";
import { AuthenticationParameters } from "../../src/request/AuthenticationParameters";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";
import sinon from "sinon";
import { AADServerParamKeys, TemporaryCacheKeys, PersistentCacheKeys, Constants } from "../../src/utils/Constants";
import { ServerCodeRequestParameters } from "../../src/server/ServerCodeRequestParameters";
import { IdTokenClaims } from "../../src/account/IdTokenClaims";
import { IdToken } from "../../src/account/IdToken";
import { LogLevel } from "../../src/logger/Logger";
import { SPAConfiguration } from "../../src/config/SPAConfiguration";
import { NetworkRequestOptions } from "../../src/network/INetworkModule";
import { Authority } from "../../src/authority/Authority";
import { PkceCodes } from "../../src/crypto/ICrypto";
import { TokenExchangeParameters } from "../../src/request/TokenExchangeParameters";
import { ClientAuthErrorMessage } from "../../src/error/ClientAuthError";
import { AuthError } from "../../src/error/AuthError";
import { CodeResponse } from "../../src/response/CodeResponse";
import { TokenResponse, Account, AuthorityFactory, TokenRenewParameters } from "../../src";
import { buildClientInfo } from "../../src/account/ClientInfo";
import { TimeUtils } from "../../src/utils/TimeUtils";
import { AccessTokenKey } from "../../src/cache/AccessTokenKey";
import { AccessTokenValue } from "../../src/cache/AccessTokenValue";
import { Configuration } from "../../src/config/Configuration";
import { ClientInfo } from "../../src/account/ClientInfo";

describe("SPAClient.ts Class Unit Tests", () => {

    const testLoggerCallback = (level: LogLevel, message: string, containsPii: boolean): void => {
        if (containsPii) {
            console.log(`Log level: ${level} Message: ${message}`);
        }
    };

    let store = {};
    let defaultAuthConfig: SPAConfiguration;

    beforeEach(() => {
        defaultAuthConfig = {
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
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
                    };
                }
            },
            loggerOptions: {
                loggerCallback: testLoggerCallback
            }
        };
    });

    describe("Constructor", () => {

        it("creates an SPAClient that extends the Client", () => {
            const client = new SPAClient(defaultAuthConfig);
            expect(client).to.be.not.null;
            expect(client instanceof SPAClient).to.be.true;
            expect(client instanceof BaseClient).to.be.true;
        });
    });

    describe("Login Url Creation", () => {

        let Client: SPAClient;
        beforeEach(() => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            Client = new SPAClient(defaultAuthConfig);
        });

        afterEach(() => {
            sinon.restore();
            store = {};
        });

        it("Creates a login URL with default scopes", async () => {
            const emptyRequest: AuthenticationParameters = {};
            const loginUrl = await Client.createLoginUrl(emptyRequest);
            expect(loginUrl).to.contain(Constants.DEFAULT_AUTHORITY);
            expect(loginUrl).to.contain(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common"));
            expect(loginUrl).to.contain(`${AADServerParamKeys.SCOPE}=${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIR_URI)}`);
        });

        it("Creates a login URL with scopes from given token request", async () => {
            const testScope1 = "testscope1";
            const testScope2 = "testscope2";
            const loginRequest: AuthenticationParameters = {
                scopes: [testScope1, testScope2]
            };
            const loginUrl = await Client.createLoginUrl(loginRequest);
            expect(loginUrl).to.contain(`${AADServerParamKeys.SCOPE}=${encodeURIComponent(`${testScope1} ${testScope2} ${Constants.OPENID_SCOPE} ${Constants.PROFILE_SCOPE} ${Constants.OFFLINE_ACCESS_SCOPE}`)}`);
        });

        it("Updates cache entries correctly", async () => {
            const emptyRequest: AuthenticationParameters = {};
            await Client.createLoginUrl(emptyRequest);
            expect(defaultAuthConfig.storageInterface.getItem(TemporaryCacheKeys.REQUEST_STATE)).to.be.deep.eq(RANDOM_TEST_GUID);
            expect(defaultAuthConfig.storageInterface.getItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|${RANDOM_TEST_GUID}`)).to.be.eq(RANDOM_TEST_GUID);
            expect(defaultAuthConfig.storageInterface.getItem(`${TemporaryCacheKeys.AUTHORITY}|${RANDOM_TEST_GUID}`)).to.be.eq(`${Constants.DEFAULT_AUTHORITY}/`);
        });

        it("Caches token request correctly", async () => {
            const emptyRequest: AuthenticationParameters = {};
            await Client.createLoginUrl(emptyRequest);
            const cachedRequest: TokenExchangeParameters = JSON.parse(defaultAuthConfig.storageInterface.getItem(TemporaryCacheKeys.REQUEST_PARAMS));
            expect(cachedRequest.scopes).to.be.deep.eq([TEST_CONFIG.MSAL_CLIENT_ID]);
            expect(cachedRequest.codeVerifier).to.be.deep.eq(TEST_CONFIG.TEST_VERIFIER);
            expect(cachedRequest.authority).to.be.deep.eq(`${Constants.DEFAULT_AUTHORITY}/`);
            expect(cachedRequest.correlationId).to.be.deep.eq(RANDOM_TEST_GUID);
            expect(cachedRequest.extraQueryParameters).to.be.undefined;
            expect(cachedRequest.resource).to.be.undefined;
        });

        it("Uses authority if given in request", async () => {
            sinon.restore();
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(ALTERNATE_OPENID_CONFIG_RESPONSE);
            const loginRequest: AuthenticationParameters = {
                authority: `${TEST_URIS.ALTERNATE_INSTANCE}/common`
            };
            const loginUrl = await Client.createLoginUrl(loginRequest);
            expect(loginUrl).to.contain(TEST_URIS.ALTERNATE_INSTANCE);
            expect(loginUrl).to.contain(ALTERNATE_OPENID_CONFIG_RESPONSE.body.authorization_endpoint);
            expect(loginUrl).to.contain(`${AADServerParamKeys.SCOPE}=${encodeURIComponent(`${Constants.OPENID_SCOPE} ${Constants.PROFILE_SCOPE} ${Constants.OFFLINE_ACCESS_SCOPE}`)}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIR_URI)}`);
        });

        it("Throws endpoint discovery error if resolveEndpointsAsync fails", async () => {
            sinon.restore();
            const exceptionString = "Could not make a network request.";
            sinon.stub(Authority.prototype, "resolveEndpointsAsync").throwsException(exceptionString);
            const emptyRequest: AuthenticationParameters = {};
            await expect(Client.createLoginUrl(emptyRequest)).to.be.rejectedWith(`${ClientAuthErrorMessage.endpointResolutionError.desc} Detail: ${exceptionString}`);
        });

        it("Cleans cache before error is thrown", async () => {
            const guidCreationErr = "GUID can't be created.";
            const emptyRequest: AuthenticationParameters = {};
            defaultAuthConfig.cryptoInterface.createNewGuid = (): string => {
                throw AuthError.createUnexpectedError(guidCreationErr);
            };
            Client = new SPAClient(defaultAuthConfig);
            await expect(Client.createLoginUrl(emptyRequest)).to.be.rejectedWith(guidCreationErr);
            expect(defaultAuthConfig.storageInterface.getKeys()).to.be.empty;
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
            Client = new SPAClient(defaultAuthConfig);
            const emptyRequest: AuthenticationParameters = {};
            await Client.createLoginUrl(emptyRequest);
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
            Client = new SPAClient(defaultAuthConfig);
            const loginRequest: AuthenticationParameters = {
                loginHint: "AbeLi@microsoft.com"
            };
            await Client.createLoginUrl(loginRequest);
            expect(queryParamSpy.calledWith(testToken)).to.be.false;
            expect(queryParamSpy.calledWith(null)).to.be.true;
        });
    });

    describe("Acquire Token Url Creation", () => {
        let Client: SPAClient;
        beforeEach(() => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            Client = new SPAClient(defaultAuthConfig);
        });

        afterEach(() => {
            sinon.restore();
            store = {};
        });

        it("Creates a acquire token URL with scopes from given token request", async () => {
            const testScope1 = "testscope1";
            const testScope2 = "testscope2";
            const tokenRequest: AuthenticationParameters = {
                scopes: [testScope1, testScope2]
            };
            const acquireTokenUrl = await Client.createAcquireTokenUrl(tokenRequest);
            expect(acquireTokenUrl).to.contain(Constants.DEFAULT_AUTHORITY);
            expect(acquireTokenUrl).to.contain(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common"));
            expect(acquireTokenUrl).to.contain(`${AADServerParamKeys.SCOPE}=${encodeURIComponent(`${testScope1} ${testScope2} ${Constants.OFFLINE_ACCESS_SCOPE}`)}`);
            expect(acquireTokenUrl).to.contain(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`);
            expect(acquireTokenUrl).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
            expect(acquireTokenUrl).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIR_URI)}`);
        });

        it("Creates a acquire token URL with replaced client id scope", async () => {
            const tokenRequest: AuthenticationParameters = {
                scopes: [TEST_CONFIG.MSAL_CLIENT_ID]
            };
            const acquireTokenUrl = await Client.createAcquireTokenUrl(tokenRequest);
            expect(acquireTokenUrl).to.contain(Constants.DEFAULT_AUTHORITY);
            expect(acquireTokenUrl).to.contain(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common"));
            expect(acquireTokenUrl).to.contain(`${AADServerParamKeys.SCOPE}=${encodeURIComponent(`${Constants.OPENID_SCOPE} ${Constants.PROFILE_SCOPE} ${Constants.OFFLINE_ACCESS_SCOPE}`)}`);
            expect(acquireTokenUrl).to.contain(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`);
            expect(acquireTokenUrl).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
            expect(acquireTokenUrl).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIR_URI)}`);
        });

        it("Throws error if no scopes are passed to createAcquireTokenUrl", async () => {
            const emptyRequest: AuthenticationParameters = {};
            await expect(Client.createAcquireTokenUrl(emptyRequest)).to.be.rejectedWith(ClientConfigurationErrorMessage.emptyScopesError.desc);
        });

        it("Throws error if empty scopes are passed to createAcquireTokenUrl", async () => {
            const emptyRequest: AuthenticationParameters = {
                scopes: []
            };
            await expect(Client.createAcquireTokenUrl(emptyRequest)).to.be.rejectedWith(ClientConfigurationErrorMessage.emptyScopesError.desc);
        });

        it("Updates cache entries correctly", async () => {
            const testScope = "testscope";
            const tokenRequest: AuthenticationParameters = {
                scopes: [testScope]
            };
            await Client.createAcquireTokenUrl(tokenRequest);
            expect(defaultAuthConfig.storageInterface.getItem(TemporaryCacheKeys.REQUEST_STATE)).to.be.deep.eq(RANDOM_TEST_GUID);
            expect(defaultAuthConfig.storageInterface.getItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|${RANDOM_TEST_GUID}`)).to.be.eq(RANDOM_TEST_GUID);
            expect(defaultAuthConfig.storageInterface.getItem(`${TemporaryCacheKeys.AUTHORITY}|${RANDOM_TEST_GUID}`)).to.be.eq(`${Constants.DEFAULT_AUTHORITY}/`);
        });

        it("Caches token request correctly", async () => {
            const testScope = "testscope";
            const tokenRequest: AuthenticationParameters = {
                scopes: [testScope]
            };
            await Client.createAcquireTokenUrl(tokenRequest);
            const cachedRequest: TokenExchangeParameters = JSON.parse(defaultAuthConfig.storageInterface.getItem(TemporaryCacheKeys.REQUEST_PARAMS));
            expect(cachedRequest.scopes).to.be.deep.eq([testScope]);
            expect(cachedRequest.codeVerifier).to.be.deep.eq(TEST_CONFIG.TEST_VERIFIER);
            expect(cachedRequest.authority).to.be.deep.eq(`${Constants.DEFAULT_AUTHORITY}/`);
            expect(cachedRequest.correlationId).to.be.deep.eq(RANDOM_TEST_GUID);
            expect(cachedRequest.extraQueryParameters).to.be.undefined;
            expect(cachedRequest.resource).to.be.undefined;
        });

        it("Uses authority if given in request", async () => {
            sinon.restore();
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(ALTERNATE_OPENID_CONFIG_RESPONSE);
            const tokenRequest: AuthenticationParameters = {
                authority: `${TEST_URIS.ALTERNATE_INSTANCE}/common`,
                scopes: [TEST_CONFIG.MSAL_CLIENT_ID]
            };
            const acquireTokenUrl = await Client.createAcquireTokenUrl(tokenRequest);
            expect(acquireTokenUrl).to.contain(TEST_URIS.ALTERNATE_INSTANCE);
            expect(acquireTokenUrl).to.contain(ALTERNATE_OPENID_CONFIG_RESPONSE.body.authorization_endpoint);
            expect(acquireTokenUrl).to.contain(`${AADServerParamKeys.SCOPE}=${encodeURIComponent(`${Constants.OPENID_SCOPE} ${Constants.PROFILE_SCOPE} ${Constants.OFFLINE_ACCESS_SCOPE}`)}`);
            expect(acquireTokenUrl).to.contain(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`);
            expect(acquireTokenUrl).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
            expect(acquireTokenUrl).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIR_URI)}`);
        });

        it("Throws endpoint discovery error if resolveEndpointsAsync fails", async () => {
            sinon.restore();
            const exceptionString = "Could not make a network request.";
            sinon.stub(Authority.prototype, "resolveEndpointsAsync").throwsException(exceptionString);
            const tokenRequest: AuthenticationParameters = {
                scopes: [TEST_CONFIG.MSAL_CLIENT_ID]
            };
            await expect(Client.createAcquireTokenUrl(tokenRequest)).to.be.rejectedWith(`${ClientAuthErrorMessage.endpointResolutionError.desc} Detail: ${exceptionString}`);
        });

        it("Cleans cache before error is thrown", async () => {
            const guidCreationErr = "GUID can't be created.";
            const tokenRequest: AuthenticationParameters = {
                scopes: [TEST_CONFIG.MSAL_CLIENT_ID]
            };
            defaultAuthConfig.cryptoInterface.createNewGuid = (): string => {
                throw AuthError.createUnexpectedError(guidCreationErr);
            };
            Client = new SPAClient(defaultAuthConfig);
            await expect(Client.createAcquireTokenUrl(tokenRequest)).to.be.rejectedWith(guidCreationErr);
            expect(defaultAuthConfig.storageInterface.getKeys()).to.be.empty;
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
            Client = new SPAClient(defaultAuthConfig);
            const tokenRequest: AuthenticationParameters = {
                scopes: [TEST_CONFIG.MSAL_CLIENT_ID]
            };
            await Client.createAcquireTokenUrl(tokenRequest);
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
            Client = new SPAClient(defaultAuthConfig);
            const tokenRequest: AuthenticationParameters = {
                scopes: [TEST_CONFIG.MSAL_CLIENT_ID],
                loginHint: "AbeLi@microsoft.com"
            };
            await Client.createAcquireTokenUrl(tokenRequest);
            expect(queryParamSpy.calledWith(testToken)).to.be.false;
            expect(queryParamSpy.calledWith(null)).to.be.true;
        });
    });

    describe("Token Acquisition", () => {

        describe("Exchange code for token with acquireToken()", () => {
            let Client: SPAClient;
            beforeEach(() => {
                Client = new SPAClient(defaultAuthConfig);
            });

            afterEach(() => {
                sinon.restore();
                store = {};
            });

            describe("Error Cases", () => {

                it("Throws error if null code response is passed", async () => {
                    await expect(Client.acquireToken(null)).to.be.rejectedWith(ClientAuthErrorMessage.tokenRequestCannotBeMade.desc);
                    expect(defaultAuthConfig.storageInterface.getKeys()).to.be.empty;
                });

                it("Throws error if code response does not contain PKCE code", async () => {
                    const codeResponse: CodeResponse = {
                        code: null,
                        userRequestState: RANDOM_TEST_GUID
                    };
                    await expect(Client.acquireToken(codeResponse)).to.be.rejectedWith(ClientAuthErrorMessage.tokenRequestCannotBeMade.desc);
                    expect(defaultAuthConfig.storageInterface.getKeys()).to.be.empty;
                });

                it("Throws error if request cannot be retrieved from cache", async () => {
                    const codeResponse: CodeResponse = {
                        code: "This is an auth code",
                        userRequestState: RANDOM_TEST_GUID
                    };
                    await expect(Client.acquireToken(codeResponse)).to.be.rejectedWith(ClientAuthErrorMessage.tokenRequestCacheError.desc);
                    expect(defaultAuthConfig.storageInterface.getKeys()).to.be.empty;
                });

                it("Throws error if cached request cannot be parsed correctly", async () => {
                    const cachedRequest: TokenExchangeParameters = {
                        authority: TEST_URIS.DEFAULT_INSTANCE,
                        codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                        correlationId: RANDOM_TEST_GUID,
                        scopes: [TEST_CONFIG.MSAL_CLIENT_ID],
                    };
                    const stringifiedRequest = JSON.stringify(cachedRequest);
                    defaultAuthConfig.storageInterface.setItem(TemporaryCacheKeys.REQUEST_PARAMS, stringifiedRequest.substring(0, stringifiedRequest.length / 2));
                    const codeResponse: CodeResponse = {
                        code: "This is an auth code",
                        userRequestState: RANDOM_TEST_GUID
                    };
                    await expect(Client.acquireToken(codeResponse)).to.be.rejectedWith(ClientAuthErrorMessage.tokenRequestCacheError.desc);
                    expect(defaultAuthConfig.storageInterface.getKeys()).to.be.empty;
                });

                it("Throws error if authority endpoint resolution fails", async () => {
                    const codeResponse = {
                        code: "This is an auth code",
                        userRequestState: RANDOM_TEST_GUID
                    };
                    const exceptionString = "Could not make a network request.";
                    sinon.stub(Authority.prototype, "resolveEndpointsAsync").throwsException(exceptionString);

                    const cachedRequest: TokenExchangeParameters = {
                        authority: Constants.DEFAULT_AUTHORITY,
                        codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                        correlationId: RANDOM_TEST_GUID,
                        scopes: [TEST_CONFIG.MSAL_CLIENT_ID],
                    };
                    const stringifiedRequest = JSON.stringify(cachedRequest);
                    defaultAuthConfig.storageInterface.setItem(TemporaryCacheKeys.REQUEST_PARAMS, stringifiedRequest);
                    await expect(Client.acquireToken(codeResponse)).to.be.rejectedWith(`${ClientAuthErrorMessage.endpointResolutionError.desc} Detail: ${exceptionString}`);
                });
            });

            describe("Success Cases", () => {

                let codeResponse: CodeResponse;
                let testState: string;
                beforeEach(() => {
                    // Set up required objects and mocked return values
                    defaultAuthConfig.networkInterface.sendPostRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                        return {
                            body : {
                                token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                                ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                                access_token: TEST_TOKENS.LOGIN_AT_STRING,
                                refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                                id_token: TEST_TOKENS.IDTOKEN_V2
                            }
                        };
                    };
                    defaultAuthConfig.cryptoInterface.base64Decode = (input: string): string => {
                        switch (input) {
                            case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                                return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                            default:
                                return input;
                        }
                    };
                    defaultAuthConfig.cryptoInterface.base64Encode = (input: string): string => {
                        switch (input) {
                            case "123-test-uid":
                                return "MTIzLXRlc3QtdWlk";
                            case "456-test-utid":
                                return "NDU2LXRlc3QtdXRpZA==";
                            default:
                                return input;
                        }
                    };
                    Client = new SPAClient(defaultAuthConfig);

                    testState = "{stateObject}";
                    codeResponse = {
                        code: "This is an auth code",
                        userRequestState: `${RANDOM_TEST_GUID}|${testState}`
                    };
                });

                it("Retrieves valid token response given valid code and state", async () => {
                    // Set up stubs
                    const idTokenClaims = {
                        "ver": "2.0",
                        "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                        "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                        "exp": "1536361411",
                        "name": "Abe Lincoln",
                        "preferred_username": "AbeLi@microsoft.com",
                        "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                        "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                        "nonce": "123523",
                    };
                    sinon.stub(IdToken, "extractIdToken").returns(idTokenClaims);
                    sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);

                    // Set up cache
                    defaultAuthConfig.storageInterface.setItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|${codeResponse.userRequestState}`, "123523");
                    defaultAuthConfig.storageInterface.setItem(PersistentCacheKeys.CLIENT_INFO, TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO);

                    // Build Test account
                    const idToken = new IdToken(TEST_TOKENS.IDTOKEN_V2, defaultAuthConfig.cryptoInterface);
                    const clientInfo = buildClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, defaultAuthConfig.cryptoInterface);
                    const testAccount = Account.createAccount(idToken, clientInfo, defaultAuthConfig.cryptoInterface);

                    const cachedRequest: TokenExchangeParameters = {
                        authority: Constants.DEFAULT_AUTHORITY,
                        codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                        correlationId: RANDOM_TEST_GUID,
                        scopes: [TEST_CONFIG.MSAL_CLIENT_ID],
                    };
                    const stringifiedRequest = JSON.stringify(cachedRequest);
                    defaultAuthConfig.storageInterface.setItem(TemporaryCacheKeys.REQUEST_PARAMS, stringifiedRequest);
                    defaultAuthConfig.storageInterface.setItem(`${TemporaryCacheKeys.AUTHORITY}${Constants.RESOURCE_DELIM}${RANDOM_TEST_GUID}`, `${TEST_URIS.DEFAULT_INSTANCE}/common/`);

                    // Perform test
                    const tokenResponse: TokenResponse = await Client.acquireToken(codeResponse);
                    expect(tokenResponse.uniqueId).to.be.deep.eq(idTokenClaims.oid);
                    expect(tokenResponse.tenantId).to.be.deep.eq(idTokenClaims.tid);
                    expect(tokenResponse.tokenType).to.be.deep.eq(TEST_CONFIG.TOKEN_TYPE_BEARER);
                    expect(tokenResponse.idTokenClaims).to.be.deep.eq(idTokenClaims);
                    expect(tokenResponse.idToken).to.be.deep.eq(TEST_TOKENS.IDTOKEN_V2);
                    expect(tokenResponse.accessToken).to.be.deep.eq(TEST_TOKENS.LOGIN_AT_STRING);
                    expect(tokenResponse.refreshToken).to.be.deep.eq(TEST_TOKENS.REFRESH_TOKEN);
                    expect(Account.compareAccounts(tokenResponse.account, testAccount)).to.be.true;
                    expect(tokenResponse.expiresOn.getTime() / 1000 <= TimeUtils.nowSeconds() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN).to.be.true;
                    expect(tokenResponse.scopes).to.be.deep.eq(TEST_CONFIG.DEFAULT_SCOPES);
                    expect(tokenResponse.userRequestState).to.be.deep.eq(testState);
                    expect(Account.compareAccounts(Client.getAccount(), testAccount)).to.be.true;
                });

                it("Uses authority from cache if not present in cached request", async () => {
                    // Set up stubs
                    const idTokenClaims = {
                        "ver": "2.0",
                        "iss": `${TEST_URIS.ALTERNATE_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                        "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                        "exp": "1536361411",
                        "name": "Abe Lincoln",
                        "preferred_username": "AbeLi@microsoft.com",
                        "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                        "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                        "nonce": "123523",
                    };
                    sinon.stub(IdToken, "extractIdToken").returns(idTokenClaims);
                    sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(ALTERNATE_OPENID_CONFIG_RESPONSE);
                    const authoritySpy = sinon.spy(AuthorityFactory, "createInstance");

                    // Set up cache
                    defaultAuthConfig.storageInterface.setItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|${codeResponse.userRequestState}`, "123523");
                    defaultAuthConfig.storageInterface.setItem(PersistentCacheKeys.CLIENT_INFO, TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO);

                    const cachedRequest: TokenExchangeParameters = {
                        codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                        correlationId: RANDOM_TEST_GUID,
                        scopes: [TEST_CONFIG.MSAL_CLIENT_ID],
                    };
                    const stringifiedRequest = JSON.stringify(cachedRequest);
                    defaultAuthConfig.storageInterface.setItem(TemporaryCacheKeys.REQUEST_PARAMS, stringifiedRequest);
                    defaultAuthConfig.storageInterface.setItem(`${TemporaryCacheKeys.AUTHORITY}${Constants.RESOURCE_DELIM}${codeResponse.userRequestState}`, `${TEST_URIS.ALTERNATE_INSTANCE}/common/`);

                    // Perform test
                    await Client.acquireToken(codeResponse);
                    expect(authoritySpy.calledOnceWith(`${TEST_URIS.ALTERNATE_INSTANCE}/common/`, defaultAuthConfig.networkInterface)).to.be.true;
                });
            });
        });

        describe("Renew token", () => {

            let Client: SPAClient;
            beforeEach(() => {
                Client = new SPAClient(defaultAuthConfig);
            });

            afterEach(() => {
                sinon.restore();
                store = {};
            });

            describe("Error cases", () => {

                it("Throws error if request object is null or undefined", async () => {
                    await expect(Client.renewToken(null)).to.be.rejectedWith(ClientConfigurationErrorMessage.tokenRequestEmptyError.desc);
                    await expect(Client.renewToken(undefined)).to.be.rejectedWith(ClientConfigurationErrorMessage.tokenRequestEmptyError.desc);
                });

                it("Throws error if scopes are not included in request object", async () => {
                    await expect(Client.renewToken({})).to.be.rejectedWith(ClientConfigurationErrorMessage.emptyScopesError.desc);
                });

                it("Throws error if scopes are empty in request object", async () => {
                    const tokenRequest: TokenRenewParameters = {
                        scopes: []
                    };
                    await expect(Client.renewToken(tokenRequest)).to.be.rejectedWith(ClientConfigurationErrorMessage.emptyScopesError.desc);
                });

                it("Throws error if login hasn't been completed and client id is passed as scope", async () => {
                    const tokenRequest: TokenRenewParameters = {
                        scopes: [TEST_CONFIG.MSAL_CLIENT_ID]
                    };
                    await expect(Client.renewToken(tokenRequest)).to.be.rejectedWith(ClientAuthErrorMessage.userLoginRequiredError.desc);
                });

                it("Throws error if endpoint discovery could not be completed", async () => {
                    const exceptionString = "Could not make a network request.";
                    sinon.stub(Authority.prototype, "resolveEndpointsAsync").throwsException(exceptionString);

                    const tokenRequest: TokenRenewParameters = {
                        scopes: ["scope1"]
                    };
                    await expect(Client.renewToken(tokenRequest)).to.be.rejectedWith(`${ClientAuthErrorMessage.endpointResolutionError.desc} Detail: ${exceptionString}`);
                });

                it("Throws error if it does not find token in empty cache", async () => {
                    sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
                    const tokenRequest: TokenRenewParameters = {
                        scopes: ["scope1"]
                    };
                    await expect(Client.renewToken(tokenRequest)).to.be.rejectedWith(ClientAuthErrorMessage.noTokensFoundError.desc);
                });

                it("Throws error if it does not find token in non-empty cache", async () => {
                    const testScope1 = "scope1";
                    const testScope2 = "scope2";
                    const accessTokenKey1: AccessTokenKey = {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        scopes: testScope1,
                        authority: `${Constants.DEFAULT_AUTHORITY}/`,
                        homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                        resource: "Resource1"
                    };
                    const atValue: AccessTokenValue = {
                        accessToken: TEST_TOKENS.ACCESS_TOKEN,
                        idToken: "",
                        refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                        tokenType: "Bearer",
                        expiresOnSec: `${TimeUtils.nowSeconds() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN}`,
                        extExpiresOnSec: `${TimeUtils.nowSeconds() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN}`
                    };
                    defaultAuthConfig.storageInterface.setItem(JSON.stringify(accessTokenKey1), JSON.stringify(atValue));
                    sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
                    const tokenRequest: TokenRenewParameters = {
                        scopes: [testScope2]
                    };
                    await expect(Client.renewToken(tokenRequest)).to.be.rejectedWith(ClientAuthErrorMessage.noTokensFoundError.desc);
                });

                it("Throws error if it finds too many tokens in cache for the same scope and client id but no authority, resource or account is given", async () => {
                    const testScope = "scope1";
                    const accessTokenKey1: AccessTokenKey = {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        scopes: testScope,
                        authority: `${Constants.DEFAULT_AUTHORITY}/`,
                        homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                        resource: "Resource1"
                    };
                    const accessTokenKey2: AccessTokenKey = {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        scopes: testScope,
                        authority: `${Constants.DEFAULT_AUTHORITY}/`,
                        homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                        resource: "Resource2"
                    };
                    const atValue: AccessTokenValue = {
                        accessToken: TEST_TOKENS.ACCESS_TOKEN,
                        idToken: "",
                        refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                        tokenType: "Bearer",
                        expiresOnSec: `${TimeUtils.nowSeconds() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN}`,
                        extExpiresOnSec: `${TimeUtils.nowSeconds() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN}`
                    };
                    defaultAuthConfig.storageInterface.setItem(JSON.stringify(accessTokenKey1), JSON.stringify(atValue));
                    defaultAuthConfig.storageInterface.setItem(JSON.stringify(accessTokenKey2), JSON.stringify(atValue));
                    sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
                    const tokenRequest: TokenRenewParameters = {
                        scopes: [testScope]
                    };
                    await expect(Client.renewToken(tokenRequest)).to.be.rejectedWith(ClientAuthErrorMessage.multipleMatchingTokens.desc);
                });
            });

            describe("Success cases", () => {

                it("Returns correct access token entry if it does not need to be renewed", async () => {
                    const testScope1 = "scope1";
                    const accessTokenKey1: AccessTokenKey = {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        scopes: `${testScope1} ${Constants.OFFLINE_ACCESS_SCOPE}`,
                        authority: `${Constants.DEFAULT_AUTHORITY}/`,
                        homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                        resource: "Resource1"
                    };
                    const atValue: AccessTokenValue = {
                        accessToken: TEST_TOKENS.ACCESS_TOKEN,
                        idToken: "",
                        refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                        tokenType: TEST_CONFIG.TOKEN_TYPE_BEARER,
                        expiresOnSec: `${TimeUtils.nowSeconds() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN}`,
                        extExpiresOnSec: `${TimeUtils.nowSeconds() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN}`
                    };
                    defaultAuthConfig.storageInterface.setItem(JSON.stringify(accessTokenKey1), JSON.stringify(atValue));
                    sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
                    const tokenRequest: TokenRenewParameters = {
                        scopes: [testScope1]
                    };
                    const tokenResponse = await Client.renewToken(tokenRequest);
                    expect(tokenResponse.uniqueId).to.be.empty;
                    expect(tokenResponse.tenantId).to.be.empty;
                    expect(tokenResponse.scopes).to.be.deep.eq([testScope1, Constants.OFFLINE_ACCESS_SCOPE]);
                    expect(tokenResponse.tokenType).to.be.eq(TEST_CONFIG.TOKEN_TYPE_BEARER);
                    expect(tokenResponse.idToken).to.be.empty;
                    expect(tokenResponse.idTokenClaims).to.be.null;
                    expect(tokenResponse.accessToken).to.be.eq(TEST_TOKENS.ACCESS_TOKEN);
                    expect(tokenResponse.refreshToken).to.be.eq(TEST_TOKENS.REFRESH_TOKEN);
                    expect(tokenResponse.expiresOn.getTime() / 1000 <= TimeUtils.nowSeconds() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN);
                    expect(tokenResponse.account).to.be.null;
                    expect(tokenResponse.userRequestState).to.be.empty;
                });

                it("Returns correct entry for id and access token if it does not need to be renewed", async () => {
                    defaultAuthConfig.cryptoInterface.base64Decode = (input: string): string => {
                        switch (input) {
                            case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                                return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                            default:
                                return input;
                        }
                    };
                    defaultAuthConfig.cryptoInterface.base64Encode = (input: string): string => {
                        switch (input) {
                            case "123-test-uid":
                                return "MTIzLXRlc3QtdWlk";
                            case "456-test-utid":
                                return "NDU2LXRlc3QtdXRpZA==";
                            default:
                                return input;
                        }
                    };
                    Client = new SPAClient(defaultAuthConfig);
                    const idTokenClaims = {
                        "ver": "2.0",
                        "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                        "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                        "exp": "1536361411",
                        "name": "Abe Lincoln",
                        "preferred_username": "AbeLi@microsoft.com",
                        "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                        "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                        "nonce": "123523",
                    };
                    sinon.stub(IdToken, "extractIdToken").returns(idTokenClaims);
                    const testScopes = ["scope1", "openid", "profile"];
                    const accessTokenKey1: AccessTokenKey = {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        scopes: testScopes.join(" "),
                        authority: `${Constants.DEFAULT_AUTHORITY}/`,
                        homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                        resource: "Resource1"
                    };
                    const atValue: AccessTokenValue = {
                        accessToken: TEST_TOKENS.ACCESS_TOKEN,
                        idToken: TEST_TOKENS.IDTOKEN_V2,
                        refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                        tokenType: TEST_CONFIG.TOKEN_TYPE_BEARER,
                        expiresOnSec: `${TimeUtils.nowSeconds() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN}`,
                        extExpiresOnSec: `${TimeUtils.nowSeconds() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN}`
                    };
                    defaultAuthConfig.storageInterface.setItem(PersistentCacheKeys.ID_TOKEN, TEST_TOKENS.IDTOKEN_V2);
                    defaultAuthConfig.storageInterface.setItem(PersistentCacheKeys.CLIENT_INFO, TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO);
                    defaultAuthConfig.storageInterface.setItem(JSON.stringify(accessTokenKey1), JSON.stringify(atValue));
                    sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
                    const tokenRequest: TokenRenewParameters = {
                        scopes: [testScopes[0]]
                    };
                    const tokenResponse = await Client.renewToken(tokenRequest);

                    // Build Test account
                    const idToken = new IdToken(TEST_TOKENS.IDTOKEN_V2, defaultAuthConfig.cryptoInterface);
                    const clientInfo = buildClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, defaultAuthConfig.cryptoInterface);
                    const testAccount = Account.createAccount(idToken, clientInfo, defaultAuthConfig.cryptoInterface);
                    testScopes.push(Constants.OFFLINE_ACCESS_SCOPE);
                    expect(tokenResponse.uniqueId).to.be.deep.eq(idTokenClaims.oid);
                    expect(tokenResponse.tenantId).to.be.deep.eq(idTokenClaims.tid);
                    expect(tokenResponse.tokenType).to.be.deep.eq(TEST_CONFIG.TOKEN_TYPE_BEARER);
                    expect(tokenResponse.idTokenClaims).to.be.deep.eq(idTokenClaims);
                    expect(tokenResponse.idToken).to.be.deep.eq(TEST_TOKENS.IDTOKEN_V2);
                    expect(tokenResponse.accessToken).to.be.deep.eq(TEST_TOKENS.ACCESS_TOKEN);
                    expect(tokenResponse.refreshToken).to.be.deep.eq(TEST_TOKENS.REFRESH_TOKEN);
                    expect(Account.compareAccounts(tokenResponse.account, testAccount)).to.be.true;
                    expect(tokenResponse.expiresOn.getTime() / 1000 <= TimeUtils.nowSeconds() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN).to.be.true;
                    expect(tokenResponse.scopes).to.be.deep.eq(testScopes);
                    expect(tokenResponse.userRequestState).to.be.empty;
                });
            });
        });
    });

    describe("Getters and setters", () => {

        const redirectUriFunc = () => {
            return TEST_URIS.TEST_REDIR_URI;
        };

        const postLogoutRedirectUriFunc = () => {
            return TEST_URIS.TEST_LOGOUT_URI;
        };

        const Client_functionRedirectUris = new SPAClient({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
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

        const Client_noRedirectUris = new SPAClient({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
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
            const Client = new SPAClient(defaultAuthConfig);
            expect(Client.getRedirectUri()).to.be.deep.eq(TEST_URIS.TEST_REDIR_URI);
        });

        it("gets configured redirect uri if uri is a function", () => {
            expect(Client_functionRedirectUris.getRedirectUri()).to.be.deep.eq(TEST_URIS.TEST_REDIR_URI);
        });

        it("throws error if redirect uri is null/empty", () => {
            expect(() => Client_noRedirectUris.getRedirectUri()).to.throw(ClientConfigurationError.createRedirectUriEmptyError().message);
        });

        it("gets configured post logout redirect uri", () => {
            const Client = new SPAClient(defaultAuthConfig);
            expect(Client.getPostLogoutRedirectUri()).to.be.deep.eq(TEST_URIS.TEST_LOGOUT_URI);
        });

        it("gets configured post logout redirect uri if uri is a function", () => {
            expect(Client_functionRedirectUris.getPostLogoutRedirectUri()).to.be.deep.eq(TEST_URIS.TEST_LOGOUT_URI);
        });

        it("throws error if post logout redirect uri is null/empty", () => {
            expect(() => Client_noRedirectUris.getPostLogoutRedirectUri()).to.throw(ClientConfigurationError.createPostLogoutRedirectUriEmptyError().message);
        });
    });

    describe("getAccount()", () => {
        let store;
        let config: Configuration;
        let client: SPAClient;
        let idToken: IdToken;
        let clientInfo: ClientInfo;
        let testAccount: Account;
        beforeEach(() => {
            store = {};
            config = {
                auth: {},
                systemOptions: null,
                cryptoInterface: {
                    createNewGuid(): string {
                        return RANDOM_TEST_GUID;
                    },
                    base64Decode(input: string): string {
                        return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
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
                        };
                    }
                },
                networkInterface: null,
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
                loggerOptions: null
            };

            const idTokenClaims: IdTokenClaims = {
                "ver": "2.0",
                "iss": "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "exp": "1536361411",
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "nonce": "123523",
            };
            sinon.stub(IdToken, "extractIdToken").returns(idTokenClaims);
            idToken = new IdToken(TEST_TOKENS.IDTOKEN_V2, config.cryptoInterface);
            clientInfo = buildClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, config.cryptoInterface);
            testAccount = Account.createAccount(idToken, clientInfo, config.cryptoInterface);
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            client = new SPAClient(defaultAuthConfig);
        });

        afterEach(() => {
            sinon.restore();
            store = {};
        });

        it("returns null if nothing is in the cache", () => {
            expect(client.getAccount()).to.be.null;
        });

        it("returns the current account if it exists", () => {

            expect(Account.compareAccounts(client.getAccount(), testAccount)).to.be.false;
        });

        it("Creates account object from cached id token and client info", () => {
            store[PersistentCacheKeys.ID_TOKEN] = idToken;
            store[PersistentCacheKeys.CLIENT_INFO] = clientInfo;
            expect(Account.compareAccounts(client.getAccount(), testAccount)).to.be.false;
        });
    });
});

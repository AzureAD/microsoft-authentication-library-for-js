import * as Mocha from "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
const expect = chai.expect;
chai.use(chaiAsPromised);
import sinon from "sinon";
import { SPAClient } from "../../src/client/SPAClient";
import { TEST_CONFIG, TEST_URIS, RANDOM_TEST_GUID, DEFAULT_OPENID_CONFIG_RESPONSE, TEST_TOKENS, ALTERNATE_OPENID_CONFIG_RESPONSE, TEST_DATA_CLIENT_INFO, TEST_TOKEN_LIFETIMES } from "../utils/StringConstants";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";
import { AADServerParamKeys, PersistentCacheKeys, Constants } from "../../src/utils/Constants";
import { IdTokenClaims } from "../../src/account/IdTokenClaims";
import { IdToken } from "../../src/account/IdToken";
import { LogLevel } from "../../src/logger/Logger";
import { NetworkRequestOptions } from "../../src/network/INetworkModule";
import { Authority } from "../../src/authority/Authority";
import { PkceCodes } from "../../src/crypto/ICrypto";
import { ClientAuthErrorMessage } from "../../src/error/ClientAuthError";
import { buildClientInfo, ClientInfo } from "../../src/account/ClientInfo";
import { BaseClient } from "../../src/client/BaseClient";
import { AuthorityFactory } from "../../src/authority/AuthorityFactory";
import { ServerError } from "../../src/error/ServerError";
import { ClientConfiguration } from "../../src/config/ClientConfiguration";
import { AuthorizationUrlRequest } from "../../src/request/AuthorizationUrlRequest";
import { AuthorizationCodeRequest } from "../../src/request/AuthorizationCodeRequest";
import { AadAuthority } from "../../src/authority/AadAuthority";
import { AuthenticationResult } from "../../src/response/AuthenticationResult";
import { SilentFlowRequest } from "../../src/request/SilentFlowRequest";
import { IAccount } from "../../src/account/IAccount";
import { AccountEntity } from "../../src/cache/entities/AccountEntity";
import { CacheManager } from "../../src";
import { MockStorageClass } from "./ClientTestUtils";

describe("SPAClient.ts Class Unit Tests", () => {

    const testLoggerCallback = (level: LogLevel, message: string, containsPii: boolean): void => {
        if (containsPii) {
            console.log(`Log level: ${level} Message: ${message}`);
        }
    };

    
    let defaultAuthConfig: ClientConfiguration;
    let cacheStorageMock: MockStorageClass = new MockStorageClass();

    beforeEach(() => {

        const mockHttpClient = {
            sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                return null;
            },
            sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                return null;
            }
        };

        defaultAuthConfig = {
            authOptions: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                authority: AuthorityFactory.createInstance(
                    TEST_CONFIG.validAuthority,
                    mockHttpClient
                ),
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                postLogoutRedirectUri: TEST_URIS.TEST_LOGOUT_URI,
            },
            storageInterface: cacheStorageMock,
            networkInterface: {
                sendGetRequestAsync<T>(
                    url: string,
                    options?: NetworkRequestOptions
                ): T {
                    return null;
                },
                sendPostRequestAsync<T>(
                    url: string,
                    options?: NetworkRequestOptions
                ): T {
                    return null;
                },
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
                        verifier: TEST_CONFIG.TEST_VERIFIER,
                    };
                },
            },
            loggerOptions: {
                loggerCallback: testLoggerCallback,
            },
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
            defaultAuthConfig.storageInterface.clear();
        });

        it("Creates a login URL", async () => {
            const emptyRequest: AuthorizationUrlRequest = {
				redirectUri: TEST_URIS.TEST_REDIR_URI,
				scopes: TEST_CONFIG.DEFAULT_SCOPES,
				codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
				codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD
			};
            const loginUrl = await Client.createUrl(emptyRequest);
            expect(loginUrl).to.contain(Constants.DEFAULT_AUTHORITY);
            expect(loginUrl).to.contain(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common"));
            expect(loginUrl).to.contain(`${AADServerParamKeys.SCOPE}=${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.RESPONSE_TYPE}=${Constants.CODE_RESPONSE_TYPE}`);
            expect(loginUrl).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
			expect(loginUrl).to.contain(`${AADServerParamKeys.REDIRECT_URI}=${encodeURIComponent(TEST_URIS.TEST_REDIR_URI)}`);
			expect(loginUrl).to.contain(`${AADServerParamKeys.CODE_CHALLENGE}=${encodeURIComponent(TEST_CONFIG.TEST_CHALLENGE)}`);
			expect(loginUrl).to.contain(`${AADServerParamKeys.CODE_CHALLENGE_METHOD}=${encodeURIComponent(Constants.S256_CODE_CHALLENGE_METHOD)}`);
        });

        it("Creates a login URL with scopes from given token request", async () => {
            const testScope1 = "testscope1";
            const testScope2 = "testscope2";
            const loginRequest: AuthorizationUrlRequest = {
				redirectUri: TEST_URIS.TEST_REDIR_URI,
				scopes: [testScope1, testScope2],
				codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
				codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD
            };
            const loginUrl = await Client.createUrl(loginRequest);
            expect(loginUrl).to.contain(`${AADServerParamKeys.SCOPE}=${encodeURIComponent(`${testScope1} ${testScope2}`)}`);
        });

        it("Uses authority if given in request", async () => {
            sinon.restore();
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(ALTERNATE_OPENID_CONFIG_RESPONSE);
            const loginRequest: AuthorizationUrlRequest = {
				redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
				authority: `${TEST_URIS.ALTERNATE_INSTANCE}/common`,
				codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
				codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD
            };
            const loginUrl = await Client.createUrl(loginRequest);
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
            const emptyRequest: AuthorizationUrlRequest = {
				redirectUri: TEST_URIS.TEST_REDIR_URI,
				scopes: [],
				codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
				codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD
			};
            await expect(Client.createUrl(emptyRequest)).to.be.rejectedWith(`${ClientAuthErrorMessage.endpointResolutionError.desc} Detail: ${exceptionString}`);
        });

        it("Throws error if no scopes are passed to createUrl", async () => {
            const emptyRequest: AuthorizationUrlRequest = {
				redirectUri: TEST_URIS.TEST_REDIR_URI,
				scopes: null,
				codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
				codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD
			};
            await expect(Client.createUrl(emptyRequest)).to.be.rejectedWith(ClientConfigurationErrorMessage.emptyScopesError.desc);
        });

        it("Throws error if empty scopes are passed to createUrl", async () => {
            const emptyRequest: AuthorizationUrlRequest = {
				redirectUri: TEST_URIS.TEST_REDIR_URI,
				scopes: [],
				codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
				codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD
			};
            await expect(Client.createUrl(emptyRequest)).to.be.rejectedWith(ClientConfigurationErrorMessage.emptyScopesError.desc);
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
                defaultAuthConfig.storageInterface.clear();
            });

            describe("Error Cases", () => {

                it("Throws error if null code request is passed", async () => {
                    await expect(Client.acquireToken(null, "", "")).to.be.rejectedWith(ClientAuthErrorMessage.tokenRequestCannotBeMade.desc);
                    expect(defaultAuthConfig.storageInterface.getKeys()).to.be.empty;
                });

                it("Throws error if code response does not contain PKCE code", async () => {
                    const codeRequest: AuthorizationCodeRequest = {
						redirectUri: TEST_URIS.TEST_REDIR_URI,
						scopes: ["scope"],
                        code: null
                    };
                    await expect(Client.acquireToken(codeRequest, "", "")).to.be.rejectedWith(ClientAuthErrorMessage.tokenRequestCannotBeMade.desc);
                    expect(defaultAuthConfig.storageInterface.getKeys()).to.be.empty;
                });

                it("Throws error if authority endpoint resolution fails", async () => {
					const codeRequest: AuthorizationCodeRequest = {
						authority: Constants.DEFAULT_AUTHORITY,
                        codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                        correlationId: RANDOM_TEST_GUID,
                        scopes: [TEST_CONFIG.MSAL_CLIENT_ID],
						redirectUri: TEST_URIS.TEST_REDIR_URI,
                        code: "This is an auth code"
                    };
                    const exceptionString = "Could not make a network request.";
                    sinon.stub(Authority.prototype, "resolveEndpointsAsync").throwsException(exceptionString);

                    await expect(Client.acquireToken(codeRequest, RANDOM_TEST_GUID, RANDOM_TEST_GUID)).to.be.rejectedWith(`${ClientAuthErrorMessage.endpointResolutionError.desc} Detail: ${exceptionString}`);
                });
            });

            describe("Success Cases", () => {

				let testState: string;
				let codeRequest: AuthorizationCodeRequest;
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
                                id_token: TEST_TOKENS.IDTOKEN_V2,
                                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO
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
                            case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                                return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                            default:
                                return input;
                        }
                    };
                    Client = new SPAClient(defaultAuthConfig);

                    testState = "{stateObject}";
                    codeRequest = {
						authority: Constants.DEFAULT_AUTHORITY,
                        codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                        correlationId: RANDOM_TEST_GUID,
                        scopes: [TEST_CONFIG.MSAL_CLIENT_ID],
						redirectUri: TEST_URIS.TEST_REDIR_URI,
                        code: "This is an auth code"
                    };
                });

                it("Retrieves valid token response given valid code and state", async () => {
                    sinon.restore();
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
                    sinon.stub();
                    
                    // Set up cache
                    defaultAuthConfig.storageInterface.setItem(PersistentCacheKeys.CLIENT_INFO, TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO);

                    // Build Test account
                    const idToken = new IdToken(TEST_TOKENS.IDTOKEN_V2, defaultAuthConfig.cryptoInterface);
                    const clientInfo = buildClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, defaultAuthConfig.cryptoInterface);
                    const testAccount: IAccount = {
                        homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                        environment: "login.windows.net",
                        tenantId: idTokenClaims.tid,
                        username: idTokenClaims.preferred_username
                    };

                    // Perform test
                    const tokenResponse: AuthenticationResult = await Client.acquireToken(codeRequest, testState, idTokenClaims.nonce);
                    expect(tokenResponse.uniqueId).to.be.deep.eq(idTokenClaims.oid);
                    expect(tokenResponse.tenantId).to.be.deep.eq(idTokenClaims.tid);
                    expect(tokenResponse.idTokenClaims).to.be.deep.eq(idTokenClaims);
                    expect(tokenResponse.idToken).to.be.deep.eq(TEST_TOKENS.IDTOKEN_V2);
                    expect(tokenResponse.accessToken).to.be.deep.eq(TEST_TOKENS.LOGIN_AT_STRING);
                    expect(tokenResponse.scopes).to.be.deep.eq(TEST_CONFIG.DEFAULT_SCOPES);
                    expect(tokenResponse.state).to.be.deep.eq(testState);
                });
            });
        });

        describe("Renew token", () => {

            let authClient: SPAClient;
            let testAccount: IAccount;
            beforeEach(() => {
                authClient = new SPAClient(defaultAuthConfig);
                testAccount = {
                    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                    environment: "login.windows.net",
                    tenantId: "testTenantId",
                    username: "testname@contoso.com"
                };
            });

            afterEach(() => {
                sinon.restore();
                defaultAuthConfig.storageInterface.clear();
            });

            describe("Error cases", () => {

                it("Throws error if request object is null or undefined", async () => {
                    await expect(authClient.getValidToken(null)).to.be.rejectedWith(ClientConfigurationErrorMessage.tokenRequestEmptyError.desc);
                    await expect(authClient.getValidToken(null)).to.be.rejectedWith(ClientConfigurationErrorMessage.tokenRequestEmptyError.desc);
                });

                it("Throws error if scopes are not included in request object", async () => {
                    await expect(authClient.getValidToken({
                        scopes: null,
                        account: testAccount
					})).to.be.rejectedWith(ClientConfigurationErrorMessage.emptyScopesError.desc);
                });

                it("Throws error if scopes are empty in request object", async () => {
                    const tokenRequest: SilentFlowRequest = {
                        scopes: [],
                        account: testAccount
                    };
                    await expect(authClient.getValidToken(tokenRequest)).to.be.rejectedWith(ClientConfigurationErrorMessage.emptyScopesError.desc);
                });

                it("Throws error if it does not find token in cache", async () => {
                    const testScope2 = "scope2";
                    const testAccountEntity: AccountEntity = new AccountEntity();
                    testAccountEntity.homeAccountId = TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID;
                    testAccountEntity.localAccountId = "testId";
                    testAccountEntity.environment = "login.windows.net";
                    testAccountEntity.realm = "testTenantId";
                    testAccountEntity.username = "username@contoso.com";
                    testAccountEntity.authorityType = "MSSTS";
                    sinon.stub(MockStorageClass.prototype, "getAccount").returns(testAccountEntity);
					sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
					const tokenRequest: SilentFlowRequest = {
                        scopes: [testScope2],
                        account: testAccount
                    };
                    await expect(authClient.getValidToken(tokenRequest)).to.be.rejectedWith(ClientAuthErrorMessage.noTokensFoundError.desc);
                });
            });
        });

        describe("handleFragmentResponse()", () => {

            let authModule: SPAClient;
            beforeEach(() => {
                authModule = new SPAClient(defaultAuthConfig);
            });

            afterEach(() => {
                sinon.restore();
                defaultAuthConfig.storageInterface.clear();
            });

            it("returns valid server code response", () => {
                const testSuccessHash = `#code=thisIsATestCode&client_info=${TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO}&state=${RANDOM_TEST_GUID}`;
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
                authModule = new SPAClient(defaultAuthConfig);
                const code = authModule.handleFragmentResponse(testSuccessHash, RANDOM_TEST_GUID);
                expect(code).to.be.eq(`thisIsATestCode`);
            });

            it("throws server error when error is in hash", () => {
                const testErrorHash = `#error=error_code&error_description=msal+error+description&state=${RANDOM_TEST_GUID}`;

                expect(() => authModule.handleFragmentResponse(testErrorHash, RANDOM_TEST_GUID)).to.throw("msal error description");
                expect(cacheStorageMock.store).to.be.empty;

                expect(() => authModule.handleFragmentResponse(testErrorHash, RANDOM_TEST_GUID)).to.throw(ServerError);
                expect(cacheStorageMock.store).to.be.empty;
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

		const testAuthority = new AadAuthority(TEST_CONFIG.validAuthority, null);

        const Client_functionRedirectUris = new SPAClient({
            authOptions: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                authority: testAuthority,
                redirectUri: redirectUriFunc,
                postLogoutRedirectUri: postLogoutRedirectUriFunc,
            },
            storageInterface: cacheStorageMock,
            networkInterface: null,
            cryptoInterface: null,
            loggerOptions: {
                loggerCallback: testLoggerCallback,
            },
        });

        const Client_noRedirectUris = new SPAClient({
            authOptions: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                authority: testAuthority,
            },
            storageInterface: cacheStorageMock,
            networkInterface: null,
            cryptoInterface: null,
            loggerOptions: {
                loggerCallback: testLoggerCallback,
            },
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
        let config: ClientConfiguration;
        let client: SPAClient;
        let idToken: IdToken;
        let clientInfo: ClientInfo;
        let testAccount: IAccount;
        beforeEach(() => {
            config = {
                authOptions: {
                    clientId: RANDOM_TEST_GUID,
                },
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
                            verifier: TEST_CONFIG.TEST_VERIFIER,
                        };
                    },
                },
                networkInterface: null,
                storageInterface: cacheStorageMock,
                loggerOptions: null,
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
            testAccount = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                environment: "login.windows.net",
                tenantId: idTokenClaims.tid,
                username: idTokenClaims.preferred_username
            };
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            client = new SPAClient(defaultAuthConfig);
        });

        afterEach(() => {
            sinon.restore();
            cacheStorageMock.clear();
        });

        it("returns null if nothing is in the cache", () => {
            expect(client.getAccount(TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID)).to.be.null;
        });
    });
});

import { expect } from "chai";
import { InteractionHandler } from "../../src/interaction_handler/InteractionHandler";
import { SPAClient, PkceCodes, NetworkRequestOptions, LogLevel, Account, TokenResponse, InMemoryCache, AuthorityFactory, AuthorizationCodeRequest } from "@azure/msal-common";
import { Configuration, buildConfiguration } from "../../src/config/Configuration";
import { TEST_CONFIG, TEST_URIS, TEST_DATA_CLIENT_INFO, TEST_TOKENS, TEST_TOKEN_LIFETIMES, TEST_HASHES } from "../utils/StringConstants";
import { BrowserStorage } from "../../src/cache/BrowserStorage";
import { BrowserAuthErrorMessage, BrowserAuthError } from "../../src/error/BrowserAuthError";
import sinon from "sinon";

class TestInteractionHandler extends InteractionHandler {

    constructor(authCodeModule: SPAClient, storageImpl: BrowserStorage) {
        super(authCodeModule, storageImpl);
    }

    showUI(requestUrl: string): Window {
        throw new Error("Method not implemented.");
    }

    initiateAuthRequest(requestUrl: string): Window | Promise<HTMLIFrameElement> {
		this.authCodeRequest = testAuthCodeRequest;
		return null;
    }
}

const testAuthCodeRequest: AuthorizationCodeRequest = {
	redirectUri: TEST_URIS.TEST_REDIR_URI,
	scopes: ["scope1", "scope2"],
	code: ""
};

const clearFunc = (): void => {
    return;
};

const removeFunc = (key: string): void => {
    return;
};

const setFunc = (key: string, value: string): void => {
    return;
};

const testPkceCodes = {
    challenge: "TestChallenge",
    verifier: "TestVerifier"
} as PkceCodes;

const testNetworkResult = {
    testParam: "testValue"
};

const testKeySet = ["testKey1", "testKey2"];

const networkInterface = {
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
};

describe("InteractionHandler.ts Unit Tests", () => {

    let authCodeModule: SPAClient;
    let browserStorage: BrowserStorage;
    beforeEach(() => {
        const appConfig: Configuration = {
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        };
		const configObj = buildConfiguration(appConfig);
		const authorityInstance = AuthorityFactory.createInstance(configObj.auth.authority, networkInterface);
        authCodeModule = new SPAClient({
            authOptions: {
				...configObj.auth,
				authority: authorityInstance,
			},
            systemOptions: {
                tokenRenewalOffsetSeconds: configObj.system.tokenRenewalOffsetSeconds,
                telemetry: configObj.system.telemetry
            },
            cryptoInterface: {
                createNewGuid: (): string => {
                    return "newGuid";
                },
                base64Decode: (input: string): string => {
                    return "testDecodedString";
                },
                base64Encode: (input: string): string => {
                    return "testEncodedString";
                },
                generatePkceCodes: async (): Promise<PkceCodes> => {
                    return testPkceCodes;
                }
            },
            storageInterface: {
                getCache: (): object => {
                    return {};
                },
                setCache: (): void => {
                    // dummy impl;
                },
                clear: clearFunc,
                containsKey: (key: string): boolean => {
                    return true;
                },
                getItem: (key: string): string => {
                    return "cacheItem";
                },
                getKeys: (): string[] => {
                    return testKeySet;
                },
                removeItem: removeFunc,
                setItem: setFunc
            },
            networkInterface: {
                sendGetRequestAsync: async (url: string, options?: NetworkRequestOptions): Promise<any> => {
                    return testNetworkResult;
                },
                sendPostRequestAsync: async (url: string, options?: NetworkRequestOptions): Promise<any> => {
                    return testNetworkResult;
                }
            },
            loggerOptions: {
                loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {
                    if (containsPii) {
                        console.log(`Log level: ${level} Message: ${message}`);
                    }
                },
                piiLoggingEnabled: true
            }
        });
        browserStorage = new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, configObj.cache);
    });

    afterEach(() => {
        sinon.restore();
    });

    it("Constructor", () => {
        const interactionHandler = new TestInteractionHandler(authCodeModule, browserStorage);

        expect(interactionHandler instanceof TestInteractionHandler).to.be.true;
        expect(interactionHandler instanceof InteractionHandler).to.be.true;
    });

    describe("handleCodeResponse()", () => {

        it("throws error if given location hash is empty", async () => {
            const interactionHandler = new TestInteractionHandler(authCodeModule, browserStorage);
            await expect(interactionHandler.handleCodeResponse("")).to.be.rejectedWith(BrowserAuthErrorMessage.hashEmptyError.desc);
            await expect(interactionHandler.handleCodeResponse("")).to.be.rejectedWith(BrowserAuthError);

            await expect(interactionHandler.handleCodeResponse(null)).to.be.rejectedWith(BrowserAuthErrorMessage.hashEmptyError.desc);
            await expect(interactionHandler.handleCodeResponse(null)).to.be.rejectedWith(BrowserAuthError);
        });

        it("successfully handles response", async () => {
            const testCodeResponse = "authcode";
            const idTokenClaims = {
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

            const testAccount = new Account(idTokenClaims.oid, TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID, idTokenClaims, TEST_TOKENS.IDTOKEN_V2);
            const testTokenResponse: TokenResponse = {
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                idToken: TEST_TOKENS.IDTOKEN_V2,
                scopes: ["scope1", "scope2"],
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                account: testAccount,
                expiresOn: new Date(Date.now() + (TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN * 1000)),
                idTokenClaims: idTokenClaims,
                tenantId: idTokenClaims.tid,
                tokenType: "Bearer",
                uniqueId: idTokenClaims.oid,
                userRequestState: "testState"
			};
			sinon.stub(SPAClient.prototype, "handleFragmentResponse").returns(testCodeResponse);
			const acquireTokenSpy = sinon.stub(SPAClient.prototype, "acquireToken").resolves(testTokenResponse);
            const interactionHandler = new TestInteractionHandler(authCodeModule, browserStorage);
			interactionHandler.initiateAuthRequest("testNavUrl");
            const tokenResponse = await interactionHandler.handleCodeResponse(TEST_HASHES.TEST_SUCCESS_CODE_HASH);
			expect(tokenResponse).to.deep.eq(testTokenResponse);
			expect(acquireTokenSpy.calledWith(testAuthCodeRequest, "", null)).to.be.true;
        });
    });
});

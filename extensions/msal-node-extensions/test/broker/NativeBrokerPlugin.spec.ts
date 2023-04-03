import { NativeBrokerPlugin } from "../../src/broker/NativeBrokerPlugin";
import { Account, AsyncHandle, AuthParameters, AuthResult, DiscoverAccountsResult, ErrorStatus, msalNodeRuntime, ReadAccountResult } from "@azure/msal-node-runtime";
import { AccountInfo, AuthenticationResult, NativeRequest, PromptValue } from "@azure/msal-common";
import { randomUUID } from "crypto";
import { NativeAuthError } from "../../src/error/NativeAuthError";
import { testMsalRuntimeAccount, testAccountInfo, msalRuntimeExampleError, getTestAuthenticationResult, TEST_CLIENT_ID, TEST_REDIRECTURI } from "../util/TestConstants";

describe("NativeBrokerPlugin", () => {
    const testNativeAuthError = new NativeAuthError(ErrorStatus[msalRuntimeExampleError.errorStatus], msalRuntimeExampleError.errorContext, msalRuntimeExampleError.errorCode, msalRuntimeExampleError.errorTag);
    
    const generateCorrelationId = () => {
        return randomUUID();
    };
    
    const asyncHandle: AsyncHandle = {
        CancelAsyncOperation: () => {}
    }

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("constructor tests", () => {
        it("Sets isBrokerAvailable to true if the broker is available", () => {
            jest.replaceProperty(msalNodeRuntime, 'StartupError', undefined);
            const nativeBrokerPlugin = new NativeBrokerPlugin();
            expect(nativeBrokerPlugin.isBrokerAvailable).toBe(true);
        });

        it("Sets isBrokerAvailable to false if the broker is not available", () => {
            jest.replaceProperty(msalNodeRuntime, 'StartupError', {
                errorCode: 0,
                errorStatus: ErrorStatus.Unexpected,
                errorContext: "Test Startup Error",
                errorTag: 0
            });
            const nativeBrokerPlugin = new NativeBrokerPlugin();
            expect(nativeBrokerPlugin.isBrokerAvailable).toBe(false);
        });
    });

    describe("getAccountById tests", () => {
        it("Returns account", async () => {
            const testCorrelationId = generateCorrelationId();
            jest.spyOn(msalNodeRuntime, "ReadAccountByIdAsync").mockImplementation((accountId: string, correlationId: string, callback: (result: ReadAccountResult) => void) => {
                const result: ReadAccountResult = {
                    account: testMsalRuntimeAccount,
                    CheckError: () => {},
                    telemetryData: ""
                };
                expect(accountId).toEqual(testMsalRuntimeAccount.accountId);
                expect(correlationId).toEqual(testCorrelationId);
                callback(result);

                return asyncHandle;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            const account = await nativeBrokerPlugin.getAccountById(testMsalRuntimeAccount.accountId, testCorrelationId);
            expect(account).toStrictEqual<AccountInfo>(testAccountInfo);
        });

        it("Rejects with error if Msal-Node-Runtime ReadAccountByIdAsync API throws", (done) => {
            const testCorrelationId = generateCorrelationId();
            jest.spyOn(msalNodeRuntime, "ReadAccountByIdAsync").mockImplementation(() => {
                throw msalRuntimeExampleError;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            nativeBrokerPlugin.getAccountById(testMsalRuntimeAccount.accountId, testCorrelationId).catch((error) => {
                expect(error).toStrictEqual<NativeAuthError>(testNativeAuthError);
                done();
            });
        });

        it("Rejects with error if callback is invoked with error response", (done) => {
            const testCorrelationId = generateCorrelationId();
            jest.spyOn(msalNodeRuntime, "ReadAccountByIdAsync").mockImplementation((accountId: string, correlationId: string, callback: (result: ReadAccountResult) => void) => {
                const result: ReadAccountResult = {
                    account: testMsalRuntimeAccount,
                    CheckError: () => {
                        throw msalRuntimeExampleError;
                    },
                    telemetryData: ""
                };
                expect(accountId).toEqual(testMsalRuntimeAccount.accountId);
                expect(correlationId).toEqual(testCorrelationId);
                callback(result);

                return asyncHandle;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            nativeBrokerPlugin.getAccountById(testMsalRuntimeAccount.accountId, testCorrelationId).catch((error) => {
                expect(error).toStrictEqual<NativeAuthError>(testNativeAuthError);
                done();
            });
        });
    });

    describe("getAllAccounts tests", () => {
        it("Returns accounts", async () => {
            const testCorrelationId = generateCorrelationId();
            jest.spyOn(msalNodeRuntime, "DiscoverAccountsAsync").mockImplementation((clientId: string, correlationId: string, callback: (result: DiscoverAccountsResult) => void) => {
                const result: DiscoverAccountsResult = {
                    accounts: [testMsalRuntimeAccount],
                    CheckError: () => {},
                    telemetryData: ""
                };
                expect(clientId).toEqual(TEST_CLIENT_ID);
                expect(correlationId).toEqual(testCorrelationId);
                callback(result);

                return asyncHandle;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            const accounts = await nativeBrokerPlugin.getAllAccounts(TEST_CLIENT_ID, testCorrelationId);
            expect(accounts).toStrictEqual<AccountInfo[]>([testAccountInfo]);
        });

        it("Rejects with error if Msal-Node-Runtime DiscoverAccountsAsync API throws", (done) => {
            const testCorrelationId = generateCorrelationId();
            jest.spyOn(msalNodeRuntime, "DiscoverAccountsAsync").mockImplementation(() => {
                throw msalRuntimeExampleError;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            nativeBrokerPlugin.getAllAccounts(TEST_CLIENT_ID, testCorrelationId).catch((error) => {
                expect(error).toStrictEqual<NativeAuthError>(testNativeAuthError);
                done();
            });
        });

        it("Rejects with error if callback is invoked with error response", (done) => {
            const testCorrelationId = generateCorrelationId();
            jest.spyOn(msalNodeRuntime, "DiscoverAccountsAsync").mockImplementation((clientId: string, correlationId: string, callback: (result: DiscoverAccountsResult) => void) => {
                const result: DiscoverAccountsResult = {
                    accounts: [testMsalRuntimeAccount],
                    CheckError: () => {
                        throw msalRuntimeExampleError;
                    },
                    telemetryData: ""
                };
                expect(clientId).toEqual(TEST_CLIENT_ID);
                expect(correlationId).toEqual(testCorrelationId);
                callback(result);

                return asyncHandle;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            nativeBrokerPlugin.getAllAccounts(TEST_CLIENT_ID, testCorrelationId).catch((error) => {
                expect(error).toStrictEqual<NativeAuthError>(testNativeAuthError);
                done();
            });
        });
    });

    describe("acquireTokenSilent tests", () => {
        it("Signs user in and returns successful response", async () => {
            const testCorrelationId = generateCorrelationId();
            const testAuthenticationResult = getTestAuthenticationResult(testCorrelationId);
            jest.spyOn(msalNodeRuntime, "SignInSilentlyAsync").mockImplementation((authParams: AuthParameters, correlationId: string, callback: (result: AuthResult) => void) => {
                const result: AuthResult = {
                    idToken: JSON.stringify(testAuthenticationResult.idTokenClaims),
                    accessToken: testAuthenticationResult.accessToken,
                    rawIdToken: testAuthenticationResult.idToken,
                    grantedScopes: testAuthenticationResult.scopes.join(" "),
                    expiresOn: testAuthenticationResult.expiresOn.getTime(),
                    isPopAuthorization: false,
                    account: testMsalRuntimeAccount,
                    CheckError: () => {},
                    telemetryData: ""
                };
                expect(correlationId).toEqual(testCorrelationId);
                callback(result);

                return asyncHandle;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            const request: NativeRequest = {
                clientId: TEST_CLIENT_ID,
                scopes: testAuthenticationResult.scopes,
                correlationId: testCorrelationId,
                authority: testAuthenticationResult.authority,
                redirectUri: TEST_REDIRECTURI
            }
            const response = await nativeBrokerPlugin.acquireTokenSilent(request);
            expect(response).toStrictEqual<AuthenticationResult>(testAuthenticationResult);
        });

        it("Returns successful response if user is already signed in", async () => {
            const testCorrelationId = generateCorrelationId();
            const testAuthenticationResult = getTestAuthenticationResult(testCorrelationId);

            jest.spyOn(msalNodeRuntime, "ReadAccountByIdAsync").mockImplementation((accountId: string, correlationId: string, callback: (result: ReadAccountResult) => void) => {
                const result: ReadAccountResult = {
                    account: testMsalRuntimeAccount,
                    CheckError: () => {},
                    telemetryData: ""
                };
                callback(result);

                return asyncHandle;
            });

            jest.spyOn(msalNodeRuntime, "AcquireTokenSilentlyAsync").mockImplementation((authParams: AuthParameters, correlationId: string, account: Account, callback: (result: AuthResult) => void) => {
                const result: AuthResult = {
                    idToken: JSON.stringify(testAuthenticationResult.idTokenClaims),
                    accessToken: testAuthenticationResult.accessToken,
                    rawIdToken: testAuthenticationResult.idToken,
                    grantedScopes: testAuthenticationResult.scopes.join(" "),
                    expiresOn: testAuthenticationResult.expiresOn.getTime(),
                    isPopAuthorization: false,
                    account: testMsalRuntimeAccount,
                    CheckError: () => {},
                    telemetryData: ""
                };
                expect(correlationId).toEqual(testCorrelationId);
                expect(account).toStrictEqual<Account>(testMsalRuntimeAccount);
                callback(result);

                return asyncHandle;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            const request: NativeRequest = {
                clientId: TEST_CLIENT_ID,
                scopes: testAuthenticationResult.scopes,
                correlationId: testCorrelationId,
                authority: testAuthenticationResult.authority,
                redirectUri: TEST_REDIRECTURI,
                accountId: testMsalRuntimeAccount.accountId
            }
            const response = await nativeBrokerPlugin.acquireTokenSilent(request);
            expect(response).toStrictEqual<AuthenticationResult>(testAuthenticationResult);
        });

        it("Rejects with error if Msal-Node-Runtime AcquireTokenSilentlyAsync API throws", (done) => {
            const testCorrelationId = generateCorrelationId();

            jest.spyOn(msalNodeRuntime, "ReadAccountByIdAsync").mockImplementation((accountId: string, correlationId: string, callback: (result: ReadAccountResult) => void) => {
                const result: ReadAccountResult = {
                    account: testMsalRuntimeAccount,
                    CheckError: () => {},
                    telemetryData: ""
                };
                callback(result);

                return asyncHandle;
            });

            jest.spyOn(msalNodeRuntime, "AcquireTokenSilentlyAsync").mockImplementation(() => {
                throw msalRuntimeExampleError;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            const request: NativeRequest = {
                clientId: TEST_CLIENT_ID,
                scopes: [],
                correlationId: testCorrelationId,
                authority: "",
                redirectUri: TEST_REDIRECTURI,
                accountId: testMsalRuntimeAccount.accountId
            }
            nativeBrokerPlugin.acquireTokenSilent(request).catch((error) => {
                expect(error).toStrictEqual<NativeAuthError>(testNativeAuthError);
                done();
            });
        });

        it("Rejects with error if Msal-Node-Runtime SignInSilentlyAsync API throws", (done) => {
            const testCorrelationId = generateCorrelationId();

            jest.spyOn(msalNodeRuntime, "SignInSilentlyAsync").mockImplementation(() => {
                throw msalRuntimeExampleError;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            const request: NativeRequest = {
                clientId: TEST_CLIENT_ID,
                scopes: [],
                correlationId: testCorrelationId,
                authority: "",
                redirectUri: TEST_REDIRECTURI
            }
            nativeBrokerPlugin.acquireTokenSilent(request).catch((error) => {
                expect(error).toStrictEqual<NativeAuthError>(testNativeAuthError);
                done();
            });
        });

        it("Rejects with error if callback is invoked with error response", (done) => {
            const testCorrelationId = generateCorrelationId();

            jest.spyOn(msalNodeRuntime, "SignInSilentlyAsync").mockImplementation((authParams: AuthParameters, correlationId: string, callback: (result: AuthResult) => void) => {
                const result: AuthResult = {
                    idToken: "",
                    accessToken: "",
                    rawIdToken: "",
                    grantedScopes: "",
                    expiresOn: 0,
                    isPopAuthorization: false,
                    account: null,
                    CheckError: () => {
                        throw msalRuntimeExampleError;
                    },
                    telemetryData: ""
                };
                expect(correlationId).toEqual(testCorrelationId);
                callback(result);

                return asyncHandle;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            const request: NativeRequest = {
                clientId: TEST_CLIENT_ID,
                scopes: [],
                correlationId: testCorrelationId,
                authority: "",
                redirectUri: TEST_REDIRECTURI
            }
            nativeBrokerPlugin.acquireTokenSilent(request).catch((error) => {
                expect(error).toStrictEqual<NativeAuthError>(testNativeAuthError);
                done();
            });
        });
    });

    describe("acquireTokenInteractive tests", () => {
        it("Calls SignInAsync and returns successful response if user is not already signed in", async () => {
            const testCorrelationId = generateCorrelationId();
            const testAuthenticationResult = getTestAuthenticationResult(testCorrelationId);

            jest.spyOn(msalNodeRuntime, "SignInAsync").mockImplementation((windowHandle: Buffer, authParams: AuthParameters, correlationId: string, accountHint: string, callback: (result: AuthResult) => void) => {
                const result: AuthResult = {
                    idToken: JSON.stringify(testAuthenticationResult.idTokenClaims),
                    accessToken: testAuthenticationResult.accessToken,
                    rawIdToken: testAuthenticationResult.idToken,
                    grantedScopes: testAuthenticationResult.scopes.join(" "),
                    expiresOn: testAuthenticationResult.expiresOn.getTime(),
                    isPopAuthorization: false,
                    account: testMsalRuntimeAccount,
                    CheckError: () => {},
                    telemetryData: ""
                };
                expect(correlationId).toEqual(testCorrelationId);
                callback(result);

                return asyncHandle;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            const request: NativeRequest = {
                clientId: TEST_CLIENT_ID,
                scopes: testAuthenticationResult.scopes,
                correlationId: testCorrelationId,
                authority: testAuthenticationResult.authority,
                redirectUri: TEST_REDIRECTURI
            }
            const response = await nativeBrokerPlugin.acquireTokenInteractive(request);
            expect(response).toStrictEqual<AuthenticationResult>(testAuthenticationResult);
        });

        it("Calls AcquireTokenInteractivelyAsync and returns successful response if user is already signed in", async () => {
            const testCorrelationId = generateCorrelationId();
            const testAuthenticationResult = getTestAuthenticationResult(testCorrelationId);

            jest.spyOn(msalNodeRuntime, "ReadAccountByIdAsync").mockImplementation((accountId: string, correlationId: string, callback: (result: ReadAccountResult) => void) => {
                const result: ReadAccountResult = {
                    account: testMsalRuntimeAccount,
                    CheckError: () => {},
                    telemetryData: ""
                };
                callback(result);

                return asyncHandle;
            });

            jest.spyOn(msalNodeRuntime, "AcquireTokenInteractivelyAsync").mockImplementation((windowHandle: Buffer, authParams: AuthParameters, correlationId: string, account: Account, callback: (result: AuthResult) => void) => {
                const result: AuthResult = {
                    idToken: JSON.stringify(testAuthenticationResult.idTokenClaims),
                    accessToken: testAuthenticationResult.accessToken,
                    rawIdToken: testAuthenticationResult.idToken,
                    grantedScopes: testAuthenticationResult.scopes.join(" "),
                    expiresOn: testAuthenticationResult.expiresOn.getTime(),
                    isPopAuthorization: false,
                    account: testMsalRuntimeAccount,
                    CheckError: () => {},
                    telemetryData: ""
                };
                expect(correlationId).toEqual(testCorrelationId);
                expect(account).toStrictEqual(testMsalRuntimeAccount);
                callback(result);

                return asyncHandle;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            const request: NativeRequest = {
                clientId: TEST_CLIENT_ID,
                scopes: testAuthenticationResult.scopes,
                correlationId: testCorrelationId,
                authority: testAuthenticationResult.authority,
                redirectUri: TEST_REDIRECTURI,
                accountId: testMsalRuntimeAccount.accountId
            }
            const response = await nativeBrokerPlugin.acquireTokenInteractive(request);
            expect(response).toStrictEqual<AuthenticationResult>(testAuthenticationResult);
        });

        it("Calls AcquireTokenSilentlyAsync and returns successful response if prompt is set to none and user is signed-in", async () => {
            const testCorrelationId = generateCorrelationId();
            const testAuthenticationResult = getTestAuthenticationResult(testCorrelationId);
            
            jest.spyOn(msalNodeRuntime, "ReadAccountByIdAsync").mockImplementation((accountId: string, correlationId: string, callback: (result: ReadAccountResult) => void) => {
                const result: ReadAccountResult = {
                    account: testMsalRuntimeAccount,
                    CheckError: () => {},
                    telemetryData: ""
                };
                callback(result);

                return asyncHandle;
            });

            jest.spyOn(msalNodeRuntime, "AcquireTokenSilentlyAsync").mockImplementation((authParams: AuthParameters, correlationId: string, account: Account, callback: (result: AuthResult) => void) => {
                const result: AuthResult = {
                    idToken: JSON.stringify(testAuthenticationResult.idTokenClaims),
                    accessToken: testAuthenticationResult.accessToken,
                    rawIdToken: testAuthenticationResult.idToken,
                    grantedScopes: testAuthenticationResult.scopes.join(" "),
                    expiresOn: testAuthenticationResult.expiresOn.getTime(),
                    isPopAuthorization: false,
                    account: testMsalRuntimeAccount,
                    CheckError: () => {},
                    telemetryData: ""
                };
                expect(correlationId).toEqual(testCorrelationId);
                expect(account).toStrictEqual(testMsalRuntimeAccount);
                callback(result);

                return asyncHandle;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            const request: NativeRequest = {
                clientId: TEST_CLIENT_ID,
                scopes: testAuthenticationResult.scopes,
                correlationId: testCorrelationId,
                authority: testAuthenticationResult.authority,
                redirectUri: TEST_REDIRECTURI,
                prompt: PromptValue.NONE,
                accountId: testMsalRuntimeAccount.accountId
            }
            const response = await nativeBrokerPlugin.acquireTokenInteractive(request);
            expect(response).toStrictEqual<AuthenticationResult>(testAuthenticationResult);
        });

        it("Calls SignInSilentlyAsync and returns successful response if prompt is set to none and user is not signed-in", async () => {
            const testCorrelationId = generateCorrelationId();
            const testAuthenticationResult = getTestAuthenticationResult(testCorrelationId);

            jest.spyOn(msalNodeRuntime, "SignInSilentlyAsync").mockImplementation((authParams: AuthParameters, correlationId: string, callback: (result: AuthResult) => void) => {
                const result: AuthResult = {
                    idToken: JSON.stringify(testAuthenticationResult.idTokenClaims),
                    accessToken: testAuthenticationResult.accessToken,
                    rawIdToken: testAuthenticationResult.idToken,
                    grantedScopes: testAuthenticationResult.scopes.join(" "),
                    expiresOn: testAuthenticationResult.expiresOn.getTime(),
                    isPopAuthorization: false,
                    account: testMsalRuntimeAccount,
                    CheckError: () => {},
                    telemetryData: ""
                };
                expect(correlationId).toEqual(testCorrelationId);
                callback(result);

                return asyncHandle;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            const request: NativeRequest = {
                clientId: TEST_CLIENT_ID,
                scopes: testAuthenticationResult.scopes,
                correlationId: testCorrelationId,
                authority: testAuthenticationResult.authority,
                redirectUri: TEST_REDIRECTURI,
                prompt: PromptValue.NONE
            }
            const response = await nativeBrokerPlugin.acquireTokenInteractive(request);
            expect(response).toStrictEqual<AuthenticationResult>(testAuthenticationResult);
        });

        it("Calls SignInInteractivelyAsync and returns successful response if prompt is set to select_account", async () => {
            const testCorrelationId = generateCorrelationId();
            const testAuthenticationResult = getTestAuthenticationResult(testCorrelationId);

            jest.spyOn(msalNodeRuntime, "SignInInteractivelyAsync").mockImplementation((windowHandle: Buffer, authParams: AuthParameters, correlationId: string, accountHint: string, callback: (result: AuthResult) => void) => {
                const result: AuthResult = {
                    idToken: JSON.stringify(testAuthenticationResult.idTokenClaims),
                    accessToken: testAuthenticationResult.accessToken,
                    rawIdToken: testAuthenticationResult.idToken,
                    grantedScopes: testAuthenticationResult.scopes.join(" "),
                    expiresOn: testAuthenticationResult.expiresOn.getTime(),
                    isPopAuthorization: false,
                    account: testMsalRuntimeAccount,
                    CheckError: () => {},
                    telemetryData: ""
                };
                expect(correlationId).toEqual(testCorrelationId);
                callback(result);

                return asyncHandle;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            const request: NativeRequest = {
                clientId: TEST_CLIENT_ID,
                scopes: testAuthenticationResult.scopes,
                correlationId: testCorrelationId,
                authority: testAuthenticationResult.authority,
                redirectUri: TEST_REDIRECTURI,
                prompt: PromptValue.SELECT_ACCOUNT
            }
            const response = await nativeBrokerPlugin.acquireTokenInteractive(request);
            expect(response).toStrictEqual<AuthenticationResult>(testAuthenticationResult);
        });

        it("Calls SignInInteractivelyAsync and returns successful response if prompt is set to login", async () => {
            const testCorrelationId = generateCorrelationId();
            const testAuthenticationResult = getTestAuthenticationResult(testCorrelationId);

            jest.spyOn(msalNodeRuntime, "SignInInteractivelyAsync").mockImplementation((windowHandle: Buffer, authParams: AuthParameters, correlationId: string, accountHint: string, callback: (result: AuthResult) => void) => {
                const result: AuthResult = {
                    idToken: JSON.stringify(testAuthenticationResult.idTokenClaims),
                    accessToken: testAuthenticationResult.accessToken,
                    rawIdToken: testAuthenticationResult.idToken,
                    grantedScopes: testAuthenticationResult.scopes.join(" "),
                    expiresOn: testAuthenticationResult.expiresOn.getTime(),
                    isPopAuthorization: false,
                    account: testMsalRuntimeAccount,
                    CheckError: () => {},
                    telemetryData: ""
                };
                expect(correlationId).toEqual(testCorrelationId);
                callback(result);

                return asyncHandle;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            const request: NativeRequest = {
                clientId: TEST_CLIENT_ID,
                scopes: testAuthenticationResult.scopes,
                correlationId: testCorrelationId,
                authority: testAuthenticationResult.authority,
                redirectUri: TEST_REDIRECTURI,
                prompt: PromptValue.LOGIN
            }
            const response = await nativeBrokerPlugin.acquireTokenInteractive(request);
            expect(response).toStrictEqual<AuthenticationResult>(testAuthenticationResult);
        });

        it("Calls SignInInteractivelyAsync and returns successful response if prompt is set to create", async () => {
            const testCorrelationId = generateCorrelationId();
            const testAuthenticationResult = getTestAuthenticationResult(testCorrelationId);

            jest.spyOn(msalNodeRuntime, "SignInInteractivelyAsync").mockImplementation((windowHandle: Buffer, authParams: AuthParameters, correlationId: string, accountHint: string, callback: (result: AuthResult) => void) => {
                const result: AuthResult = {
                    idToken: JSON.stringify(testAuthenticationResult.idTokenClaims),
                    accessToken: testAuthenticationResult.accessToken,
                    rawIdToken: testAuthenticationResult.idToken,
                    grantedScopes: testAuthenticationResult.scopes.join(" "),
                    expiresOn: testAuthenticationResult.expiresOn.getTime(),
                    isPopAuthorization: false,
                    account: testMsalRuntimeAccount,
                    CheckError: () => {},
                    telemetryData: ""
                };
                expect(correlationId).toEqual(testCorrelationId);
                callback(result);

                return asyncHandle;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            const request: NativeRequest = {
                clientId: TEST_CLIENT_ID,
                scopes: testAuthenticationResult.scopes,
                correlationId: testCorrelationId,
                authority: testAuthenticationResult.authority,
                redirectUri: TEST_REDIRECTURI,
                prompt: PromptValue.CREATE
            }
            const response = await nativeBrokerPlugin.acquireTokenInteractive(request);
            expect(response).toStrictEqual<AuthenticationResult>(testAuthenticationResult);
        });

        it("Throws error if SignInInteractivelyAsync returns error", async () => {
            const testCorrelationId = generateCorrelationId();

            jest.spyOn(msalNodeRuntime, "SignInInteractivelyAsync").mockImplementation((windowHandle: Buffer, authParams: AuthParameters, correlationId: string, accountHint: string, callback: (result: AuthResult) => void) => {
                const result: AuthResult = {
                    idToken: "",
                    accessToken: "",
                    rawIdToken: "",
                    grantedScopes: "",
                    expiresOn: 0,
                    isPopAuthorization: false,
                    account: null,
                    CheckError: () => { throw msalRuntimeExampleError; },
                    telemetryData: ""
                };
                expect(correlationId).toEqual(testCorrelationId);
                callback(result);

                return asyncHandle;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            const request: NativeRequest = {
                clientId: TEST_CLIENT_ID,
                scopes: [],
                correlationId: testCorrelationId,
                authority: "",
                redirectUri: TEST_REDIRECTURI,
                prompt: PromptValue.CREATE
            }
            await expect(nativeBrokerPlugin.acquireTokenInteractive(request)).rejects.toThrowError(testNativeAuthError);
        });

        it("Throws error if AcquireTokenInteractivelyAsync returns error", async () => {
            const testCorrelationId = generateCorrelationId();

            jest.spyOn(msalNodeRuntime, "ReadAccountByIdAsync").mockImplementation((accountId: string, correlationId: string, callback: (result: ReadAccountResult) => void) => {
                const result: ReadAccountResult = {
                    account: testMsalRuntimeAccount,
                    CheckError: () => {},
                    telemetryData: ""
                };
                callback(result);

                return asyncHandle;
            });

            jest.spyOn(msalNodeRuntime, "AcquireTokenInteractivelyAsync").mockImplementation((windowHandle: Buffer, authParams: AuthParameters, correlationId: string, account: Account, callback: (result: AuthResult) => void) => {
                const result: AuthResult = {
                    idToken: "",
                    accessToken: "",
                    rawIdToken: "",
                    grantedScopes: "",
                    expiresOn: 0,
                    isPopAuthorization: false,
                    account: null,
                    CheckError: () => { throw msalRuntimeExampleError; },
                    telemetryData: ""
                };
                expect(correlationId).toEqual(testCorrelationId);
                expect(account).toEqual(testMsalRuntimeAccount);
                callback(result);

                return asyncHandle;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            const request: NativeRequest = {
                clientId: TEST_CLIENT_ID,
                scopes: [],
                correlationId: testCorrelationId,
                authority: "",
                redirectUri: TEST_REDIRECTURI,
                accountId: testAccountInfo.nativeAccountId
            }
            await expect(nativeBrokerPlugin.acquireTokenInteractive(request)).rejects.toThrowError(testNativeAuthError);
        });

        it("Throws error if SignInAsync returns error", async () => {
            const testCorrelationId = generateCorrelationId();

            jest.spyOn(msalNodeRuntime, "SignInAsync").mockImplementation((windowHandle: Buffer, authParams: AuthParameters, correlationId: string, accountHint: string, callback: (result: AuthResult) => void) => {
                const result: AuthResult = {
                    idToken: "",
                    accessToken: "",
                    rawIdToken: "",
                    grantedScopes: "",
                    expiresOn: 0,
                    isPopAuthorization: false,
                    account: null,
                    CheckError: () => { throw msalRuntimeExampleError; },
                    telemetryData: ""
                };
                expect(correlationId).toEqual(testCorrelationId);
                callback(result);

                return asyncHandle;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            const request: NativeRequest = {
                clientId: TEST_CLIENT_ID,
                scopes: [],
                correlationId: testCorrelationId,
                authority: "",
                redirectUri: TEST_REDIRECTURI
            }
            await expect(nativeBrokerPlugin.acquireTokenInteractive(request)).rejects.toThrowError(testNativeAuthError);
        });

        it("Throws error if AcquireTokenSilentlyAsync returns error", async () => {
            const testCorrelationId = generateCorrelationId();

            jest.spyOn(msalNodeRuntime, "ReadAccountByIdAsync").mockImplementation((accountId: string, correlationId: string, callback: (result: ReadAccountResult) => void) => {
                const result: ReadAccountResult = {
                    account: testMsalRuntimeAccount,
                    CheckError: () => {},
                    telemetryData: ""
                };
                callback(result);

                return asyncHandle;
            });

            jest.spyOn(msalNodeRuntime, "AcquireTokenSilentlyAsync").mockImplementation((authParams: AuthParameters, correlationId: string, account: Account, callback: (result: AuthResult) => void) => {
                const result: AuthResult = {
                    idToken: "",
                    accessToken: "",
                    rawIdToken: "",
                    grantedScopes: "",
                    expiresOn: 0,
                    isPopAuthorization: false,
                    account: null,
                    CheckError: () => { throw msalRuntimeExampleError; },
                    telemetryData: ""
                };
                console.log("HERE")
                expect(correlationId).toEqual(testCorrelationId);
                callback(result);

                return asyncHandle;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            const request: NativeRequest = {
                clientId: TEST_CLIENT_ID,
                scopes: [],
                correlationId: testCorrelationId,
                authority: "",
                redirectUri: TEST_REDIRECTURI,
                prompt: PromptValue.NONE,
                accountId: testAccountInfo.nativeAccountId
            }
            await expect(nativeBrokerPlugin.acquireTokenInteractive(request)).rejects.toThrowError(testNativeAuthError);
        });

        it("Throws error if SignInSilentlyAsync returns error", async () => {
            const testCorrelationId = generateCorrelationId();

            jest.spyOn(msalNodeRuntime, "SignInSilentlyAsync").mockImplementation((authParams: AuthParameters, correlationId: string, callback: (result: AuthResult) => void) => {
                const result: AuthResult = {
                    idToken: "",
                    accessToken: "",
                    rawIdToken: "",
                    grantedScopes: "",
                    expiresOn: 0,
                    isPopAuthorization: false,
                    account: null,
                    CheckError: () => { throw msalRuntimeExampleError; },
                    telemetryData: ""
                };
                expect(correlationId).toEqual(testCorrelationId);
                callback(result);

                return asyncHandle;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            const request: NativeRequest = {
                clientId: TEST_CLIENT_ID,
                scopes: [],
                correlationId: testCorrelationId,
                authority: "",
                redirectUri: TEST_REDIRECTURI,
                prompt: PromptValue.NONE
            }
            await expect(nativeBrokerPlugin.acquireTokenInteractive(request)).rejects.toThrowError(testNativeAuthError);
        });
    });

    describe("signOut tests", () => {

    });
});

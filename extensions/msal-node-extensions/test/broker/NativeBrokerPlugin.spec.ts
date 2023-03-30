import { NativeBrokerPlugin } from "../../src/broker/NativeBrokerPlugin";
import { AsyncHandle, DiscoverAccountsResult, ErrorStatus, msalNodeRuntime, ReadAccountResult } from "@azure/msal-node-runtime";
import { AccountInfo } from "@azure/msal-common";
import { randomUUID } from "crypto";
import { NativeAuthError } from "../../src/error/NativeAuthError";
import { testMsalRuntimeAccount, testAccountInfo, msalRuntimeExampleError, TEST_CLIENT_ID } from "../util/TestContstants";

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

        it("Rejects with error if Msal-Node-Runtime ReadAccountByIdAsync API throws", async () => {
            const testCorrelationId = generateCorrelationId();
            jest.spyOn(msalNodeRuntime, "ReadAccountByIdAsync").mockImplementation(() => {
                throw msalRuntimeExampleError;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            await nativeBrokerPlugin.getAccountById(testMsalRuntimeAccount.accountId, testCorrelationId).catch((error) => {
                expect(error).toStrictEqual<NativeAuthError>(testNativeAuthError);
            });
        });

        it("Rejects with error if callback is invoked with error response", async () => {
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
            await nativeBrokerPlugin.getAccountById(testMsalRuntimeAccount.accountId, testCorrelationId).catch((error) => {
                expect(error).toStrictEqual<NativeAuthError>(testNativeAuthError);
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

        it("Rejects with error if Msal-Node-Runtime DiscoverAccountsAsync API throws", async () => {
            const testCorrelationId = generateCorrelationId();
            jest.spyOn(msalNodeRuntime, "DiscoverAccountsAsync").mockImplementation(() => {
                throw msalRuntimeExampleError;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            await nativeBrokerPlugin.getAllAccounts(TEST_CLIENT_ID, testCorrelationId).catch((error) => {
                expect(error).toStrictEqual<NativeAuthError>(testNativeAuthError);
            });
        });

        it("Rejects with error if callback is invoked with error response", async () => {
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
            await nativeBrokerPlugin.getAllAccounts(TEST_CLIENT_ID, testCorrelationId).catch((error) => {
                expect(error).toStrictEqual<NativeAuthError>(testNativeAuthError);
            });
        });
    });

    describe("acquireTokenSilent tests", () => {
        
    });

    describe("acquireTokenInteractive tests", () => {
    });

    describe("signOut tests", () => {

    });
});
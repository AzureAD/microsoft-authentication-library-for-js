import { NativeBrokerPlugin } from "../../src/broker/NativeBrokerPlugin";
import { Account, AsyncHandle, ErrorStatus, msalNodeRuntime, MsalRuntimeError, ReadAccountResult } from "@azure/msal-node-runtime";
import { AccountInfo } from "@azure/msal-common";
import { randomUUID } from "crypto";
import { NativeAuthError } from "../../src/error/NativeAuthError";

const testAccount: Account = {
    accountId: "MTIzLXRlc3QtdWlk.NDU2LXRlc3QtdXRpZA==",
    homeAccountId: "123-test-uid.456-test-utid",
    environment: "login.windows.net",
    realm: "456-test-utid",
    localAccountId: "123-test-uid",
    username: "JohnSmith@contoso.com",
    givenName: "John",
    familyName: "Smith",
    middleName: "M",
    displayName: "John Smith",
    additionalFieldsJson: "",
    homeEnvironment: "login.windows.net",
    clientInfo: "eyJ1aWQiOiIxMjMtdGVzdC11aWQiLCJ1dGlkIjoiNDU2LXRlc3QtdXRpZCJ9"
}

const testAccountInfo: AccountInfo = {
    homeAccountId: testAccount.homeAccountId,
    environment: testAccount.environment,
    tenantId: testAccount.realm,
    username: testAccount.username,
    localAccountId: testAccount.localAccountId,
    idTokenClaims: undefined,
    name: testAccount.displayName,
    nativeAccountId: testAccount.accountId
};

const testError: MsalRuntimeError = {
    errorCode: 0,
    errorStatus: ErrorStatus.Unexpected,
    errorContext: "Test Error",
    errorTag: 0
};

const testNativeAuthError = new NativeAuthError(ErrorStatus[testError.errorStatus], testError.errorContext, testError.errorCode, testError.errorTag);

const generateCorrelationId = () => {
    return randomUUID();
};

const asyncHandle: AsyncHandle = {
    CancelAsyncOperation: () => {}
}

describe("NativeBrokerPlugin", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("constructor", () => {
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

    describe("getAccountById", () => {
        it("Returns account", async () => {
            const testCorrelationId = generateCorrelationId();
            jest.spyOn(msalNodeRuntime, "ReadAccountByIdAsync").mockImplementation((accountId: string, correlationId: string, callback: (result: ReadAccountResult) => void) => {
                const result: ReadAccountResult = {
                    account: testAccount,
                    CheckError: () => {},
                    telemetryData: ""
                };
                expect(accountId).toEqual(testAccount.accountId);
                expect(correlationId).toEqual(testCorrelationId);
                callback(result);

                return asyncHandle;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            const account = await nativeBrokerPlugin.getAccountById(testAccount.accountId, testCorrelationId);
            expect(account).toStrictEqual<AccountInfo>(testAccountInfo);
        });

        it("Rejects with error if Msal-Node-Runtime ReadAccountByIdAsync API throws", async () => {
            const testCorrelationId = generateCorrelationId();
            jest.spyOn(msalNodeRuntime, "ReadAccountByIdAsync").mockImplementation(() => {
                throw testError;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            await nativeBrokerPlugin.getAccountById(testAccount.accountId, testCorrelationId).catch((error) => {
                expect(error).toStrictEqual<NativeAuthError>(testNativeAuthError);
            });
        });

        it("Rejects with error if callback is invoked with error response", async () => {
            const testCorrelationId = generateCorrelationId();
            jest.spyOn(msalNodeRuntime, "ReadAccountByIdAsync").mockImplementation((accountId: string, correlationId: string, callback: (result: ReadAccountResult) => void) => {
                const result: ReadAccountResult = {
                    account: testAccount,
                    CheckError: () => {
                        throw testError;
                    },
                    telemetryData: ""
                };
                expect(accountId).toEqual(testAccount.accountId);
                expect(correlationId).toEqual(testCorrelationId);
                callback(result);

                return asyncHandle;
            });

            const nativeBrokerPlugin = new NativeBrokerPlugin();
            await nativeBrokerPlugin.getAccountById(testAccount.accountId, testCorrelationId).catch((error) => {
                expect(error).toStrictEqual<NativeAuthError>(testNativeAuthError);
            });
        });

    });
});
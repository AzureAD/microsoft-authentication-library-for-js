import { NativeAuthError, NativeAuthErrorMessage, NativeStatusCode } from "../../src/error/NativeAuthError";
import { InteractionRequiredAuthError, InteractionRequiredAuthErrorMessage } from "@azure/msal-common";
import { BrowserAuthError, BrowserAuthErrorMessage } from "../../src/error/BrowserAuthError";

describe("NativeAuthError Unit Tests", () => {
    describe("NativeAuthError", () => {
        describe("isFatal tests", () => {
            it("should return true for isFatal when WAM status is PERSISTENT_ERROR", () => {
                const error = new NativeAuthError("testError", "testErrorDescription", {
                    error: 1,
                    protocol_error: "testProtocolError",
                    properties: {},
                    status: NativeStatusCode.PERSISTENT_ERROR
                });
                expect(error.isFatal()).toBe(true);
            });
    
            it("should return true for isFatal when WAM status is DISABLED", () => {
                const error = new NativeAuthError("testError", "testErrorDescription", {
                    error: 1,
                    protocol_error: "testProtocolError",
                    properties: {},
                    status: NativeStatusCode.DISABLED
                });
                expect(error.isFatal()).toBe(true);
            });
    
            it("should return true for isFatal when extension throws an error", () => {
                const error = new NativeAuthError(NativeAuthErrorMessage.extensionError.code, "extension threw error");
                expect(error.isFatal()).toBe(true);
            });
    
            it("should return false for isFatal", () => {
                const error = new NativeAuthError("testError", "testErrorDescription", {
                    error: 1,
                    protocol_error: "testProtocolError",
                    properties: {},
                    status: NativeStatusCode.TRANSIENT_ERROR
                });
                expect(error.isFatal()).toBe(false);
            });
        });

        describe("createError tests", () => {
            it("Returns a NativeAuthError", () => {
                const error = NativeAuthError.createError("testError", "testWamError");
                expect(error).toBeInstanceOf(NativeAuthError);
            });

            it("translates USER_INTERACTION_REQUIRED status into corresponding InteractionRequiredError", () => {
                const error = NativeAuthError.createError("interaction_required", "interaction is required", {
                    error: 1,
                    protocol_error: "testProtocolError",
                    properties: {},
                    status: NativeStatusCode.USER_INTERACTION_REQUIRED
                });
                expect(error).toBeInstanceOf(InteractionRequiredAuthError);
                expect(error.errorCode).toBe("interaction_required");
            });

            it("translates ACCOUNT_UNAVAILABLE status into corresponding InteractionRequiredError", () => {
                const error = NativeAuthError.createError("interaction_required", "interaction is required", {
                    error: 1,
                    protocol_error: "testProtocolError",
                    properties: {},
                    status: NativeStatusCode.ACCOUNT_UNAVAILABLE
                });
                expect(error).toBeInstanceOf(InteractionRequiredAuthError);
                expect(error.errorCode).toBe(InteractionRequiredAuthErrorMessage.native_account_unavailable.code);
            });

            it("translates USER_CANCEL status into corresponding BrowserAuthError", () => {
                const error = NativeAuthError.createError("user_cancel", "user cancelled", {
                    error: 1,
                    protocol_error: "testProtocolError",
                    properties: {},
                    status: NativeStatusCode.USER_CANCEL
                });
                expect(error).toBeInstanceOf(BrowserAuthError);
                expect(error.errorCode).toBe(BrowserAuthErrorMessage.userCancelledError.code);
            });

            it("translates NO_NETWORK status into corresponding BrowserAuthError", () => {
                const error = NativeAuthError.createError("no_network", "no network", {
                    error: 1,
                    protocol_error: "testProtocolError",
                    properties: {},
                    status: NativeStatusCode.NO_NETWORK
                });
                expect(error).toBeInstanceOf(BrowserAuthError);
                expect(error.errorCode).toBe(BrowserAuthErrorMessage.noNetworkConnectivity.code);
            });
        });
    });
});
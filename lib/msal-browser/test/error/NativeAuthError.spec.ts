import {
    NativeAuthError,
    NativeAuthErrorCodes,
    createNativeAuthError,
    isFatalNativeAuthError,
} from "../../src/error/NativeAuthError.js";
import {
    InteractionRequiredAuthError,
    InteractionRequiredAuthErrorCodes,
} from "@azure/msal-common";
import * as NativeStatusCode from "../../src/broker/nativeBroker/NativeStatusCodes.js";
import {
    BrowserAuthErrorCodes,
    BrowserAuthError,
} from "../../src/error/BrowserAuthError.js";

describe("NativeAuthError Unit Tests", () => {
    describe("NativeAuthError", () => {
        describe("isFatal tests", () => {
            it("should return false for isFatal when WAM status is PERSISTENT_ERROR", () => {
                const error = new NativeAuthError(
                    "testError",
                    "",
                    "testErrorDescription",
                    {
                        error: 1,
                        protocol_error: "testProtocolError",
                        properties: {},
                        status: NativeStatusCode.PERSISTENT_ERROR,
                    }
                );
                expect(isFatalNativeAuthError(error)).toBe(false);
            });

            it("should return true for isFatal when WAM status is DISABLED", () => {
                const error = new NativeAuthError(
                    "testError",
                    "",
                    "testErrorDescription",
                    {
                        error: 1,
                        protocol_error: "testProtocolError",
                        properties: {},
                        status: NativeStatusCode.DISABLED,
                    }
                );
                expect(isFatalNativeAuthError(error)).toBe(true);
            });

            it("should return true for isFatal when WAM status is INVALID_METHOD_ERROR", () => {
                const error = new NativeAuthError(
                    "OSError",
                    "",
                    "Error processing request.",
                    { error: -2147186943 }
                );
                expect(isFatalNativeAuthError(error)).toBe(true);
            });

            it("should return true for isFatal when extension throws an error", () => {
                const error = new NativeAuthError(
                    NativeAuthErrorCodes.contentError,
                    "",
                    "extension threw error"
                );
                expect(isFatalNativeAuthError(error)).toBe(true);
            });

            it("should return true for isFatal when extension throws an error", () => {
                const error = new NativeAuthError(
                    NativeAuthErrorCodes.pageException,
                    "",
                    "extension threw error"
                );
                expect(isFatalNativeAuthError(error)).toBe(true);
            });

            it("should return false for isFatal", () => {
                const error = new NativeAuthError(
                    "testError",
                    "",
                    "testErrorDescription",
                    {
                        error: 1,
                        protocol_error: "testProtocolError",
                        properties: {},
                        status: NativeStatusCode.TRANSIENT_ERROR,
                    }
                );
                expect(isFatalNativeAuthError(error)).toBe(false);
            });
        });

        describe("createError tests", () => {
            it("Returns a NativeAuthError", () => {
                const error = createNativeAuthError(
                    "testError",
                    "",
                    "testWamError"
                );
                expect(error).toBeInstanceOf(NativeAuthError);
            });

            it("translates USER_INTERACTION_REQUIRED status into corresponding InteractionRequiredError", () => {
                const error = createNativeAuthError(
                    "interaction_required",
                    "",
                    "interaction is required",
                    {
                        error: 1,
                        protocol_error: "testProtocolError",
                        properties: {},
                        status: NativeStatusCode.USER_INTERACTION_REQUIRED,
                    }
                );
                expect(error).toBeInstanceOf(InteractionRequiredAuthError);
                expect(error.errorCode).toBe("interaction_required");
            });

            it("translates ACCOUNT_UNAVAILABLE status into corresponding InteractionRequiredError", () => {
                const error = createNativeAuthError(
                    "interaction_required",
                    "",
                    "interaction is required",
                    {
                        error: 1,
                        protocol_error: "testProtocolError",
                        properties: {},
                        status: NativeStatusCode.ACCOUNT_UNAVAILABLE,
                    }
                );
                expect(error).toBeInstanceOf(InteractionRequiredAuthError);
                expect(error.errorCode).toBe(
                    InteractionRequiredAuthErrorCodes.nativeAccountUnavailable
                );
            });

            it("translates UI_NOT_ALLOWED status into corresponding InteractionRequiredError", () => {
                const error = createNativeAuthError(
                    "interaction_required",
                    "",
                    "interaction is required",
                    {
                        error: 1,
                        protocol_error: "testProtocolError",
                        properties: {},
                        status: NativeStatusCode.UI_NOT_ALLOWED,
                    }
                );
                expect(error).toBeInstanceOf(InteractionRequiredAuthError);
                expect(error.errorCode).toBe(
                    InteractionRequiredAuthErrorCodes.uiNotAllowed
                );
            });

            it("translates USER_CANCEL status into corresponding BrowserAuthError", () => {
                const error = createNativeAuthError(
                    "user_cancel",
                    "",
                    "user cancelled",
                    {
                        error: 1,
                        protocol_error: "testProtocolError",
                        properties: {},
                        status: NativeStatusCode.USER_CANCEL,
                    }
                );
                expect(error).toBeInstanceOf(BrowserAuthError);
                expect(error.errorCode).toBe(
                    BrowserAuthErrorCodes.userCancelled
                );
            });

            it("translates NO_NETWORK status into corresponding BrowserAuthError", () => {
                const error = createNativeAuthError(
                    "no_network",
                    "",
                    "no network",
                    {
                        error: 1,
                        protocol_error: "testProtocolError",
                        properties: {},
                        status: NativeStatusCode.NO_NETWORK,
                    }
                );
                expect(error).toBeInstanceOf(BrowserAuthError);
                expect(error.errorCode).toBe(
                    BrowserAuthErrorCodes.noNetworkConnectivity
                );
            });

            it("sets correlationId on translated NativeAuthError when provided", () => {
                const TEST_CORRELATION_ID = "test-correlation-id";
                const error = createNativeAuthError(
                    "testError",
                    TEST_CORRELATION_ID,
                    "testWamError",
                    undefined
                );
                expect(error).toBeInstanceOf(NativeAuthError);
                expect(error.correlationId).toBe(TEST_CORRELATION_ID);
            });

            it("sets correlationId on translated InteractionRequiredAuthError (USER_INTERACTION_REQUIRED) when provided", () => {
                const TEST_CORRELATION_ID = "test-correlation-id";
                const error = createNativeAuthError(
                    "interaction_required",
                    TEST_CORRELATION_ID,
                    "interaction is required",
                    {
                        error: 1,
                        protocol_error: "testProtocolError",
                        properties: {},
                        status: NativeStatusCode.USER_INTERACTION_REQUIRED,
                    }
                );
                expect(error).toBeInstanceOf(InteractionRequiredAuthError);
                expect(error.correlationId).toBe(TEST_CORRELATION_ID);
            });

            it("sets correlationId on translated InteractionRequiredAuthError (ACCOUNT_UNAVAILABLE) when provided", () => {
                const TEST_CORRELATION_ID = "test-correlation-id";
                const error = createNativeAuthError(
                    "interaction_required",
                    TEST_CORRELATION_ID,
                    "interaction is required",
                    {
                        error: 1,
                        protocol_error: "testProtocolError",
                        properties: {},
                        status: NativeStatusCode.ACCOUNT_UNAVAILABLE,
                    }
                );
                expect(error).toBeInstanceOf(InteractionRequiredAuthError);
                expect(error.correlationId).toBe(TEST_CORRELATION_ID);
            });

            it("sets correlationId on translated BrowserAuthError (USER_CANCEL) when provided", () => {
                const TEST_CORRELATION_ID = "test-correlation-id";
                const error = createNativeAuthError(
                    "user_cancel",
                    TEST_CORRELATION_ID,
                    "user cancelled",
                    {
                        error: 1,
                        protocol_error: "testProtocolError",
                        properties: {},
                        status: NativeStatusCode.USER_CANCEL,
                    }
                );
                expect(error).toBeInstanceOf(BrowserAuthError);
                expect(error.correlationId).toBe(TEST_CORRELATION_ID);
            });
        });
    });
});

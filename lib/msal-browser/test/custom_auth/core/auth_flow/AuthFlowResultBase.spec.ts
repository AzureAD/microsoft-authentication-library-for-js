/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthError,
    ServerError,
    InteractionRequiredAuthError,
} from "@azure/msal-common/browser";
import { AuthFlowResultBase } from "../../../../src/custom_auth/core/auth_flow/AuthFlowResultBase.js";
import { AuthFlowErrorBase } from "../../../../src/custom_auth/core/auth_flow/AuthFlowErrorBase.js";
import { AuthFlowStateBase } from "../../../../src/custom_auth/core/auth_flow/AuthFlowState.js";
import { CustomAuthError } from "../../../../src/custom_auth/core/error/CustomAuthError.js";
import { MsalCustomAuthError } from "../../../../src/custom_auth/core/error/MsalCustomAuthError.js";
import { UnexpectedError } from "../../../../src/custom_auth/core/error/UnexpectedError.js";

// Mock implementations for testing
class MockState extends AuthFlowStateBase {
    stateType = "mock_state";
}

class MockError extends AuthFlowErrorBase {
    constructor(errorData: CustomAuthError) {
        super(errorData);
    }
}

class MockAuthFlowResult extends AuthFlowResultBase<
    MockState,
    MockError,
    string
> {
    constructor(state: MockState, data?: string) {
        super(state, data);
    }

    static testCreateErrorData(error: unknown): CustomAuthError {
        return MockAuthFlowResult.createErrorData(error);
    }
}

describe("AuthFlowResultBase", () => {
    let mockState: MockState;

    beforeEach(() => {
        mockState = new MockState();
    });

    describe("constructor", () => {
        it("should create an instance with state and no data", () => {
            const result = new MockAuthFlowResult(mockState);

            expect(result.state).toBe(mockState);
            expect(result.data).toBeUndefined();
            expect(result.error).toBeUndefined();
        });

        it("should create an instance with state and data", () => {
            const testData = "test data";
            const result = new MockAuthFlowResult(mockState, testData);

            expect(result.state).toBe(mockState);
            expect(result.data).toBe(testData);
            expect(result.error).toBeUndefined();
        });

        it("should allow setting error after construction", () => {
            const result = new MockAuthFlowResult(mockState);
            const mockErrorData = new CustomAuthError(
                "test_error",
                "Test error description"
            );
            const mockError = new MockError(mockErrorData);

            result.error = mockError;

            expect(result.error).toBe(mockError);
        });
    });

    describe("createErrorData", () => {
        describe("when error is CustomAuthError", () => {
            it("should return the same CustomAuthError instance", () => {
                const customError = new CustomAuthError(
                    "custom_error",
                    "Custom error description",
                    "correlation-id",
                    [1001, 1002],
                    "sub_error"
                );

                const result =
                    MockAuthFlowResult.testCreateErrorData(customError);

                expect(result).toBe(customError);
                expect(result.error).toBe("custom_error");
                expect(result.errorDescription).toBe(
                    "Custom error description"
                );
                expect(result.correlationId).toBe("correlation-id");
                expect(result.errorCodes).toEqual([1001, 1002]);
                expect(result.subError).toBe("sub_error");
            });
        });

        describe("when error is AuthError", () => {
            it("should convert AuthError to MsalCustomAuthError", () => {
                const authError = new AuthError(
                    "auth_error_code",
                    "Auth error message",
                    "auth_sub_error"
                );
                authError.setCorrelationId("auth-correlation-id");

                const result =
                    MockAuthFlowResult.testCreateErrorData(authError);

                expect(result).toBeInstanceOf(MsalCustomAuthError);
                expect(result.error).toBe("auth_error_code");
                expect(result.errorDescription).toBe("Auth error message");
                expect(result.subError).toBe("auth_sub_error");
                expect(result.correlationId).toBe("auth-correlation-id");
                expect(result.errorCodes).toEqual([]);
            });

            it("should handle AuthError with string errorNo property", () => {
                const authError = new AuthError(
                    "auth_error_code",
                    "Auth error message"
                ) as any;
                authError.errorNo = "1234";

                const result =
                    MockAuthFlowResult.testCreateErrorData(authError);

                expect(result).toBeInstanceOf(MsalCustomAuthError);
                expect(result.errorCodes).toEqual([1234]);
            });

            it("should handle AuthError with numeric errorNo property", () => {
                const authError = new AuthError(
                    "auth_error_code",
                    "Auth error message"
                ) as any;
                authError.errorNo = 5678;

                const result =
                    MockAuthFlowResult.testCreateErrorData(authError);

                expect(result).toBeInstanceOf(MsalCustomAuthError);
                expect(result.errorCodes).toEqual([5678]);
            });

            it("should handle ServerError with string errorNo property", () => {
                const serverError = new ServerError(
                    "server_error_code",
                    "Server error message",
                    undefined,
                    "9999"
                );

                const result =
                    MockAuthFlowResult.testCreateErrorData(serverError);

                expect(result).toBeInstanceOf(MsalCustomAuthError);
                expect(result.errorCodes).toEqual([9999]);
                expect(result.error).toBe("server_error_code");
                expect(result.errorDescription).toBe("Server error message");
            });

            it("should handle ServerError with numeric errorNo as string", () => {
                const serverError = new ServerError(
                    "server_error_code",
                    "Server error message",
                    undefined,
                    "8888"
                );

                const result =
                    MockAuthFlowResult.testCreateErrorData(serverError);

                expect(result).toBeInstanceOf(MsalCustomAuthError);
                expect(result.errorCodes).toEqual([8888]);
            });

            it("should handle InteractionRequiredAuthError with string errorNo property", () => {
                const interactionError = new InteractionRequiredAuthError(
                    "interaction_required",
                    "Interaction required message",
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    "7777"
                );

                const result =
                    MockAuthFlowResult.testCreateErrorData(interactionError);

                expect(result).toBeInstanceOf(MsalCustomAuthError);
                expect(result.errorCodes).toEqual([7777]);
                expect(result.error).toBe("interaction_required");
                expect(result.errorDescription).toBe(
                    "Interaction required message"
                );
            });

            it("should handle InteractionRequiredAuthError with numeric errorNo as string", () => {
                const interactionError = new InteractionRequiredAuthError(
                    "interaction_required",
                    "Interaction required message",
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    "6666"
                );

                const result =
                    MockAuthFlowResult.testCreateErrorData(interactionError);

                expect(result).toBeInstanceOf(MsalCustomAuthError);
                expect(result.errorCodes).toEqual([6666]);
            });

            it("should handle AuthError with invalid string errorNo property", () => {
                const authError = new AuthError(
                    "auth_error_code",
                    "Auth error message"
                ) as any;
                authError.errorNo = "invalid_number";

                const result =
                    MockAuthFlowResult.testCreateErrorData(authError);

                expect(result).toBeInstanceOf(MsalCustomAuthError);
                expect(result.errorCodes).toEqual([]);
            });

            it("should handle ServerError with invalid string errorNo property", () => {
                const serverError = new ServerError(
                    "server_error_code",
                    "Server error message",
                    undefined,
                    "invalid_number"
                );

                const result =
                    MockAuthFlowResult.testCreateErrorData(serverError);

                expect(result).toBeInstanceOf(MsalCustomAuthError);
                expect(result.errorCodes).toEqual([]);
            });

            it("should handle InteractionRequiredAuthError with invalid string errorNo property", () => {
                const interactionError = new InteractionRequiredAuthError(
                    "interaction_required",
                    "Interaction required message",
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    "invalid_number"
                );

                const result =
                    MockAuthFlowResult.testCreateErrorData(interactionError);

                expect(result).toBeInstanceOf(MsalCustomAuthError);
                expect(result.errorCodes).toEqual([]);
            });

            it("should handle AuthError without errorNo property", () => {
                const authError = new AuthError(
                    "auth_error_code",
                    "Auth error message"
                );

                const result =
                    MockAuthFlowResult.testCreateErrorData(authError);

                expect(result).toBeInstanceOf(MsalCustomAuthError);
                expect(result.errorCodes).toEqual([]);
            });

            it("should handle ServerError without errorNo property", () => {
                const serverError = new ServerError(
                    "server_error_code",
                    "Server error message"
                );

                const result =
                    MockAuthFlowResult.testCreateErrorData(serverError);

                expect(result).toBeInstanceOf(MsalCustomAuthError);
                expect(result.errorCodes).toEqual([]);
            });

            it("should handle InteractionRequiredAuthError without errorNo property", () => {
                const interactionError = new InteractionRequiredAuthError(
                    "interaction_required",
                    "Interaction required message"
                );

                const result =
                    MockAuthFlowResult.testCreateErrorData(interactionError);

                expect(result).toBeInstanceOf(MsalCustomAuthError);
                expect(result.errorCodes).toEqual([]);
            });
        });

        describe("when error is a standard Error", () => {
            it("should convert Error to UnexpectedError", () => {
                const standardError = new Error("Standard error message");

                const result =
                    MockAuthFlowResult.testCreateErrorData(standardError);

                expect(result).toBeInstanceOf(UnexpectedError);
                expect(result.error).toBe("unexpected_error");
                expect(result.errorDescription).toBe("Standard error message");
            });
        });

        describe("when error is a string", () => {
            it("should convert string to UnexpectedError", () => {
                const errorString = "String error message";

                const result =
                    MockAuthFlowResult.testCreateErrorData(errorString);

                expect(result).toBeInstanceOf(UnexpectedError);
                expect(result.error).toBe("unexpected_error");
                expect(result.errorDescription).toBe("String error message");
            });
        });

        describe("when error is an object", () => {
            it("should convert object to UnexpectedError with JSON string", () => {
                const errorObject = {
                    code: "error_code",
                    message: "Error message",
                };

                const result =
                    MockAuthFlowResult.testCreateErrorData(errorObject);

                expect(result).toBeInstanceOf(UnexpectedError);
                expect(result.error).toBe("unexpected_error");
                expect(result.errorDescription).toBe(
                    JSON.stringify(errorObject)
                );
            });
        });

        describe("when error is null", () => {
            it("should convert null to UnexpectedError with default message", () => {
                const result = MockAuthFlowResult.testCreateErrorData(null);

                expect(result).toBeInstanceOf(UnexpectedError);
                expect(result.error).toBe("unexpected_error");
                expect(result.errorDescription).toBe(
                    "An unexpected error occurred."
                );
            });
        });

        describe("when error is undefined", () => {
            it("should convert undefined to UnexpectedError with default message", () => {
                const result =
                    MockAuthFlowResult.testCreateErrorData(undefined);

                expect(result).toBeInstanceOf(UnexpectedError);
                expect(result.error).toBe("unexpected_error");
                expect(result.errorDescription).toBe(
                    "An unexpected error occurred."
                );
            });
        });

        describe("when error is a number", () => {
            it("should convert number to UnexpectedError with default message", () => {
                const result = MockAuthFlowResult.testCreateErrorData(42);

                expect(result).toBeInstanceOf(UnexpectedError);
                expect(result.error).toBe("unexpected_error");
                expect(result.errorDescription).toBe(
                    "An unexpected error occurred."
                );
            });
        });
    });

    describe("inheritance and type safety", () => {
        it("should maintain correct type relationships", () => {
            const result = new MockAuthFlowResult(mockState, "test data");

            expect(result).toBeInstanceOf(AuthFlowResultBase);
            expect(result.state).toBeInstanceOf(AuthFlowStateBase);
        });

        it("should allow derived classes to access protected createErrorData method", () => {
            // This test ensures the protected method is accessible to derived classes
            const customError = new CustomAuthError("test_error");
            const result = MockAuthFlowResult.testCreateErrorData(customError);

            expect(result).toBe(customError);
        });
    });

    describe("generic type parameters", () => {
        it("should enforce correct state type", () => {
            const result = new MockAuthFlowResult(mockState);

            // TypeScript should enforce that result.state is of type MockState
            expect(result.state).toBeInstanceOf(MockState);
        });

        it("should enforce correct data type", () => {
            const testData = "string data";
            const result = new MockAuthFlowResult(mockState, testData);

            // TypeScript should enforce that result.data is of type string
            expect(typeof result.data).toBe("string");
            expect(result.data).toBe(testData);
        });

        it("should enforce correct error type", () => {
            const result = new MockAuthFlowResult(mockState);
            const mockErrorData = new CustomAuthError("test_error");
            const mockError = new MockError(mockErrorData);

            result.error = mockError;

            // TypeScript should enforce that result.error is of type MockError
            expect(result.error).toBeInstanceOf(MockError);
        });
    });
});

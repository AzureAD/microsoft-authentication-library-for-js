/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignupErrorHandler } from "../../src/sign_up/SignupErrorHandler.js";
import {
    SignupErrorType,
    InvalidGrantSuberror,
    SignUpErrorResponse,
} from "../../src/sign_up/types/SignUpErrorsTypes.js";

describe("SignupErrorHandler", () => {
    it("should create an instance with error details", () => {
        const errorDetails: SignUpErrorResponse = {
            error: SignupErrorType.USER_ALREADY_EXISTS,
            error_description: "User already exists",
            error_codes: [],
            timestamp: new Date().toISOString(),
            trace_id: "trace-id",
            correlation_id: "correlation-id",
        };
        const errorHandler = new SignupErrorHandler(errorDetails);
        expect(errorHandler.errorDetails).toEqual(errorDetails);
        expect(errorHandler.name).toBe("SignUpErrorResponse");
    });

    it("should check if the error is a specific type", () => {
        const errorDetails: SignUpErrorResponse = {
            error: SignupErrorType.INVALID_REQUEST,
            error_description: "Invalid request",
            error_codes: [],
            timestamp: new Date().toISOString(),
            trace_id: "trace-id",
            correlation_id: "correlation-id",
        };
        const errorHandler = new SignupErrorHandler(errorDetails);
        expect(errorHandler.isErrorType(SignupErrorType.INVALID_REQUEST)).toBe(
            true,
        );
        expect(
            errorHandler.isErrorType(SignupErrorType.USER_ALREADY_EXISTS),
        ).toBe(false);
    });

    it("should return a user-friendly error message", () => {
        const errorDetails: SignUpErrorResponse = {
            error: SignupErrorType.USER_ALREADY_EXISTS,
            error_description: "User already exists",
            error_codes: [],
            timestamp: new Date().toISOString(),
            trace_id: "trace-id",
            correlation_id: "correlation-id",
        };
        const errorHandler = new SignupErrorHandler(errorDetails);
        expect(errorHandler.getUserFriendlyMessage()).toBe(
            "An account with this email already exists. Please try logging in or use a different email.",
        );
    });

    it("should handle invalid grant errors", () => {
        const errorDetails: SignUpErrorResponse = {
            error: SignupErrorType.INVALID_GRANT,
            error_description: "Invalid grant",
            suberror: InvalidGrantSuberror.PASSWORD_TOO_SHORT,
            error_codes: [],
            timestamp: new Date().toISOString(),
            trace_id: "trace-id",
            correlation_id: "correlation-id",
        };
        const errorHandler = new SignupErrorHandler(errorDetails);
        expect(errorHandler.getUserFriendlyMessage()).toBe(
            "Password is too short. Please use a longer password.",
        );
    });

    // it("should create an instance from response", () => {
    //     const response = new Response(null, {
    //         status: 400,
    //         statusText: "Bad Request",
    //     });
    //     const errorHandler = SignupErrorHandler.fromResponse(response);
    //     expect(errorHandler.errorDetails.error).toBe("Bad Request");
    //     expect(errorHandler.errorDetails.error_description).toBe(
    //         "HTTP Error: 400 Bad Request",
    //     );
    // });

    // it("should throw an error if response is successful", () => {
    //     const response = new Response(null, { status: 200, statusText: "OK" });
    //     expect(() => SignupErrorHandler.fromResponse(response)).toThrow(
    //         "Cannot create error handler from a successful response",
    //     );
    // });
});

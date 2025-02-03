/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InvalidGrantSuberror, SignUpErrorResponse, SignupErrorType } from "./types/ApiErrorResponseTypes.js";

export class SignupErrorHandler extends Error {
    public errorDetails: SignUpErrorResponse;
    constructor(errorDetails: SignUpErrorResponse) {
        super(errorDetails.error_description);
        this.name = "SignUpErrorResponse";
        this.errorDetails = errorDetails;
    }
    /**
     * Check if the error is a specific type
     * @param errorType - The error type to check
     * @returns boolean indicating if the error matches the type
     */
    isErrorType(errorType: SignupErrorType): boolean {
        return this.errorDetails.error === errorType;
    }
    /**
     * Get a user-friendly error message
     * Error base on https://learn.microsoft.com/en-us/entra/identity-platform/reference-native-authentication-api?tabs=emailOtp#error-response
     * @returns Translated error message
     */
    getUserFriendlyMessage(): string {
        switch (this.errorDetails.error) {
            case SignupErrorType.USER_ALREADY_EXISTS:
                return "An account with this email already exists. Please try logging in or use a different email.";
            case SignupErrorType.INVALID_GRANT:
                return this.handleInvalidGrantError();
            case SignupErrorType.INVALID_REQUEST:
                return "There was an issue with the signup request. Please check your information and try again.";
            case SignupErrorType.INVALID_CLIENT:
                return "Authentication system configuration error. Please contact support.";
            default:
                return this.errorDetails.error_description;
        }
    }
    /**
     * Handle specific sign up sub errors as documented in the Native Auth API
     * https://learn.microsoft.com/en-us/entra/identity-platform/reference-native-authentication-api?tabs=emailOtp#error-response
     * @returns User-friendly password error message
     */
    private handleInvalidGrantError(): string {
        switch (this.errorDetails.suberror) {
            case InvalidGrantSuberror.PASSWORD_TOO_SHORT:
                return "Password is too short. Please use a longer password.";
            case InvalidGrantSuberror.PASSWORD_TOO_LONG:
                return "Password is too long. Please use a shorter password.";
            case InvalidGrantSuberror.PASSWORD_TOO_WEAK:
                return "Password is too weak. Please use a stronger password with a mix of characters.";
            case InvalidGrantSuberror.PASSWORD_RECENTLY_USED:
                return "Please choose a different password. This password has been used recently.";
            case InvalidGrantSuberror.PASSWORD_BANNED:
                return "The password you chose is not allowed. Please select a different password.";
            case InvalidGrantSuberror.PASSWORD_IS_INVALID:
                return "The password contains invalid characters. Please choose a different password.";
            default:
                return "There was an issue with the password. Please try again.";
        }
    }
    /**
     * Safely parse and handle signup error responses
     * @param response - The error response from the signup endpoint
     * @returns EntraSignupErrorHandler instance
     */
    static fromResponse(response: Response): SignupErrorHandler {
        if (response.ok) {
            throw new Error(
                "Cannot create error handler from a successful response",
            );
        }
        return new SignupErrorHandler({
            error: response.statusText as SignupErrorType,
            error_description: `HTTP Error: ${response.status} ${response.statusText}`,
            error_codes: [],
            timestamp: new Date().toISOString(),
            trace_id: crypto.randomUUID(),
            correlation_id: crypto.randomUUID(),
        });
    }
}

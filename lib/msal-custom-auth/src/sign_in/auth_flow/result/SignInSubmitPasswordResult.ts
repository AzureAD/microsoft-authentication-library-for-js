/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult } from "@azure/msal-browser";
import { SignInErrorType } from "../error_type/SignInError.js";

/**
 * Result of submitting a password during sign-in
 */
export class SignInSubmitPasswordResult {
    /**
     * Whether the operation was successful
     */
    readonly success: boolean;
    
    /**
     * Authentication result when sign-in is successful
     */
    readonly authenticationResult?: AuthenticationResult;
    
    /**
     * Error type when sign-in fails
     */
    readonly errorType?: SignInErrorType;
    
    /**
     * Error message providing details about the failure
     */
    readonly errorMessage?: string;
    
    /**
     * Correlation ID for request tracing
     */
    readonly correlationId?: string;

    /**
     * Creates an instance of SignInSubmitPasswordResult
     * @param success - Whether the operation was successful
     * @param authenticationResult - Authentication result when successful
     * @param errorType - Error type when operation fails
     * @param errorMessage - Error message when operation fails
     * @param correlationId - Correlation ID for request tracing
     */
    constructor(
        success: boolean,
        authenticationResult?: AuthenticationResult,
        errorType?: SignInErrorType,
        errorMessage?: string,
        correlationId?: string
    ) {
        this.success = success;
        this.authenticationResult = authenticationResult;
        this.errorType = errorType;
        this.errorMessage = errorMessage;
        this.correlationId = correlationId;
    }

    /**
     * Creates a successful result
     * @param authenticationResult - Authentication result
     * @returns A new successful SignInSubmitPasswordResult instance
     */
    static createSuccessResult(authenticationResult: AuthenticationResult): SignInSubmitPasswordResult {
        return new SignInSubmitPasswordResult(true, authenticationResult);
    }

    /**
     * Creates a result with error information
     * @param errorType - Type of error that occurred
     * @param errorMessage - Error message
     * @param correlationId - Correlation ID for request tracing
     * @returns A new SignInSubmitPasswordResult instance with error information
     */
    static createWithError(
        errorType: SignInErrorType,
        errorMessage: string,
        correlationId?: string
    ): SignInSubmitPasswordResult {
        return new SignInSubmitPasswordResult(
            false,
            undefined,
            errorType,
            errorMessage,
            correlationId
        );
    }
}
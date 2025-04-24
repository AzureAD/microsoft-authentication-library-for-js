/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignInErrorType } from "../error_type/SignInError.js";

/**
 * Result of requesting a new verification code during sign-in
 */
export class SignInResendCodeResult {
    /**
     * Whether the operation was successful
     */
    readonly success: boolean;
    
    /**
     * Length of the verification code that was sent
     */
    readonly codeLength?: number;
    
    /**
     * Error type when operation fails
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
     * Creates an instance of SignInResendCodeResult
     * @param success - Whether the operation was successful
     * @param codeLength - Length of the verification code when successful
     * @param errorType - Error type when operation fails
     * @param errorMessage - Error message when operation fails
     * @param correlationId - Correlation ID for request tracing
     */
    constructor(
        success: boolean,
        codeLength?: number,
        errorType?: SignInErrorType,
        errorMessage?: string,
        correlationId?: string
    ) {
        this.success = success;
        this.codeLength = codeLength;
        this.errorType = errorType;
        this.errorMessage = errorMessage;
        this.correlationId = correlationId;
    }

    /**
     * Creates a successful result
     * @param codeLength - Length of the verification code
     * @param correlationId - Correlation ID for request tracing
     * @returns A new successful SignInResendCodeResult instance
     */
    static createSuccessResult(codeLength: number, correlationId?: string): SignInResendCodeResult {
        return new SignInResendCodeResult(true, codeLength, undefined, undefined, correlationId);
    }

    /**
     * Creates a result with error information
     * @param errorType - Type of error that occurred
     * @param errorMessage - Error message
     * @param correlationId - Correlation ID for request tracing
     * @returns A new SignInResendCodeResult instance with error information
     */
    static createWithError(
        errorType: SignInErrorType,
        errorMessage: string,
        correlationId?: string
    ): SignInResendCodeResult {
        return new SignInResendCodeResult(
            false,
            undefined,
            errorType,
            errorMessage,
            correlationId
        );
    }
}
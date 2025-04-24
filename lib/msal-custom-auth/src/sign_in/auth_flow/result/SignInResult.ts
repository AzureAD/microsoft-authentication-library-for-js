/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult } from "@azure/msal-browser";
import { CustomAuthAccountData } from "../../../get_account/auth_flow/CustomAuthAccountData.js";
import { SignInCompletedState } from "../state/SignInCompletedState.js";
import { SignInCodeRequiredState } from "../state/SignInCodeRequiredState.js";
import { SignInFailedState } from "../state/SignInFailedState.js";
import { SignInPasswordRequiredState } from "../state/SignInPasswordRequiredState.js";
import { SignInErrorType } from "../error_type/index.js";

/**
 * Result of a sign-in operation
 */
export class SignInResult {
    /**
     * State of the sign-in process
     */
    readonly state: SignInPasswordRequiredState | SignInCodeRequiredState | SignInCompletedState | SignInFailedState;
    
    /**
     * Account data when sign-in is successful
     */
    readonly data?: CustomAuthAccountData;

    /**
     * Creates an instance of SignInResult
     * @param state - Current state of the sign-in process
     * @param data - Account data when sign-in is successful
     */
    constructor(state: SignInPasswordRequiredState | SignInCodeRequiredState | SignInCompletedState | SignInFailedState, data?: CustomAuthAccountData) {
        this.state = state;
        this.data = data;
    }

    /**
     * Creates a result for successful sign-in
     * @param authResult - Authentication result from successful sign-in
     * @param correlationId - Correlation ID for request tracing
     * @returns A new SignInResult instance with a completed state
     */
    static createSuccessResult(authResult: AuthenticationResult, correlationId?: string): SignInResult {
        // Note: This is a simplified implementation - in a real implementation, you would
        // need to create proper state parameters with all required fields
        const mockStateParams = {
            correlationId: correlationId || "unknown",
            continuationToken: "",
            username: authResult.account?.username || "",
            scopes: [],
            signInClient: null as any,
            logger: null as any,
            config: null as any,
            cacheClient: null as any
        };
        
        return new SignInResult(
            new SignInCompletedState(mockStateParams, authResult)
        );
    }

    /**
     * Creates a result when verification code is required
     * @param codeLength - Length of the verification code
     * @param correlationId - Correlation ID for request tracing
     * @returns A new SignInResult instance with a code required state
     */
    static createCodeRequiredResult(codeLength: number, correlationId?: string): SignInResult {
        // Note: This is a simplified implementation - in a real implementation, you would
        // need to create proper state parameters with all required fields
        const mockStateParams = {
            correlationId: correlationId || "unknown",
            continuationToken: "",
            username: "",
            scopes: [],
            signInClient: null as any,
            logger: null as any,
            config: null as any,
            cacheClient: null as any
        };
        
        return new SignInResult(
            new SignInCodeRequiredState(mockStateParams, codeLength)
        );
    }

    /**
     * Creates a SignInResult with error information
     * @param errorType - Type of error that occurred
     * @param errorMessage - Error message with details
     * @param correlationId - Correlation ID for request tracing
     * @returns A new SignInResult instance with a failed state
     */
    static createWithError(
        errorType: SignInErrorType,
        errorMessage: string,
        correlationId?: string
    ): SignInResult {
        // Note: This is a simplified implementation - in a real implementation, you would
        // need to create proper state parameters with all required fields
        const mockStateParams = {
            correlationId: correlationId || "unknown",
            continuationToken: "",
            username: "",
            scopes: [],
            signInClient: null as any,
            logger: null as any,
            config: null as any,
            cacheClient: null as any
        };
        
        return new SignInResult(
            new SignInFailedState(mockStateParams, errorType, errorMessage)
        );
    }
}
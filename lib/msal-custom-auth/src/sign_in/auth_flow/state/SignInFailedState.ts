/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignInErrorType } from "../error_type/SignInError.js";
import { SignInStateParameters } from "./SignInStateParameters.js";

/**
 * State representing that the sign-in flow has failed
 */
export class SignInFailedState {
    /**
     * Correlation ID for request tracing
     */
    readonly correlationId: string;
    
    /**
     * Username provided for sign-in attempt
     */
    readonly username: string;
    
    /**
     * Type of error that occurred during sign-in
     */
    readonly errorType: SignInErrorType;
    
    /**
     * Detailed error message
     */
    readonly errorMessage: string;
    
    private readonly logger;
    
    /**
     * Creates an instance of SignInFailedState
     * @param params - Parameters for the state
     * @param errorType - Type of error that occurred
     * @param errorMessage - Detailed error message
     */
    constructor(
        params: SignInStateParameters, 
        errorType: SignInErrorType, 
        errorMessage: string
    ) {
        this.correlationId = params.correlationId;
        this.username = params.username;
        this.errorType = errorType;
        this.errorMessage = errorMessage;
        this.logger = params.logger;
        
        // Log the error for telemetry and debugging
        this.logError();
    }
    
    /**
     * Log the error for telemetry and debugging
     */
    private logError(): void {
        this.logger.error(
            `Sign-in failed: ${this.errorMessage}`, 
            { errorType: this.errorType }, 
            this.correlationId
        );
    }
}
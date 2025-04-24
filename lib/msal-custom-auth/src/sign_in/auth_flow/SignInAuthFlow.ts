/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../../configuration/CustomAuthConfiguration.js";
import { CacheClient } from "../../../core/cache/CacheClient.js";
import { ICustomAuthApiClient } from "../../../core/network_client/custom_auth_api/ICustomAuthApiClient.js";
import { Logger } from "../../../core/utils/Logger.js";
import { SignInClient } from "../../interaction_client/SignInClient.js";
import { SignInResult } from "../result/SignInResult.js";
import { SignInErrorType } from "../error_type/index.js";
import {
    SignInCodeRequiredState,
    SignInCompletedState,
    SignInFailedState,
    SignInPasswordRequiredState,
    SignInState,
    SignInStateParameters
} from "../state/index.js";

/**
 * Interface for sign-in authentication flow parameters
 */
export interface SignInAuthFlowParams {
    /**
     * Username for sign-in
     */
    username: string;
    
    /**
     * Optional correlation ID for request tracing
     */
    correlationId?: string;
    
    /**
     * Scopes requested for the authentication token
     */
    scopes?: string[];
    
    /**
     * Custom auth API client
     */
    customAuthApiClient: ICustomAuthApiClient;
    
    /**
     * Application configuration
     */
    config: CustomAuthBrowserConfiguration;
    
    /**
     * Logger for instrumentation
     */
    logger: Logger;
    
    /**
     * Cache client for token storage
     */
    cacheClient: CacheClient;
}

/**
 * Manages sign-in authentication flow and state transitions
 */
export class SignInAuthFlow {
    /**
     * Current state of the sign-in flow
     */
    private state: SignInState;
    
    /**
     * Common state parameters
     */
    private readonly stateParams: SignInStateParameters;
    
    /**
     * Creates an instance of SignInAuthFlow
     * @param params - Parameters for the sign-in flow
     */
    constructor(params: SignInAuthFlowParams) {
        // Create sign-in API client
        const signInClient = new SignInClient(params.customAuthApiClient);
        
        // Generate correlation ID if not provided
        const correlationId = params.correlationId || this.generateCorrelationId();
        
        // Set up common state parameters
        this.stateParams = {
            correlationId,
            continuationToken: "",  // Initially empty, will be populated during flow
            username: params.username,
            scopes: params.scopes,
            signInClient,
            logger: params.logger,
            config: params.config,
            cacheClient: params.cacheClient
        };
        
        // Initialize to password required state
        this.state = new SignInPasswordRequiredState(this.stateParams);
        
        this.stateParams.logger.verbose(
            `Sign-in flow initialized for user: ${params.username}`,
            correlationId
        );
    }
    
    /**
     * Get the current state of the sign-in flow
     * @returns Current sign-in state
     */
    getState(): SignInState {
        return this.state;
    }
    
    /**
     * Start the sign-in flow with password authentication
     * @param password - User's password for authentication
     * @returns Promise resolving to the result of the sign-in operation
     */
    async signIn(password: string): Promise<SignInResult> {
        try {
            this.stateParams.logger.verbose(
                "Starting sign-in flow with password authentication", 
                this.stateParams.correlationId
            );
            
            if (!(this.state instanceof SignInPasswordRequiredState)) {
                this.stateParams.logger.error(
                    "Invalid state transition: Expected PasswordRequiredState",
                    this.stateParams.correlationId
                );
                
                // Reset to password required state
                this.state = new SignInPasswordRequiredState(this.stateParams);
            }
            
            // Submit password for authentication
            const passwordResult = await this.state.submitPassword(password);
            
            if (!passwordResult.success) {
                // Password authentication failed
                this.state = new SignInFailedState(
                    this.stateParams,
                    passwordResult.errorType || SignInErrorType.UNKNOWN_ERROR,
                    passwordResult.errorMessage || "Password authentication failed"
                );
                
                return SignInResult.createWithError(
                    this.state.errorType,
                    this.state.errorMessage,
                    this.stateParams.correlationId
                );
            }
            
            // Update continuation token from the response
            this.stateParams.continuationToken = passwordResult.continuationToken || "";
            
            if (passwordResult.authenticationResult) {
                // Authentication completed with password only
                this.state = new SignInCompletedState(
                    this.stateParams,
                    passwordResult.authenticationResult
                );
                
                return SignInResult.createSuccessResult(
                    this.state.authenticationResult,
                    this.stateParams.correlationId
                );
            } else if (passwordResult.codeLength) {
                // Additional verification required with code
                this.state = new SignInCodeRequiredState(
                    this.stateParams,
                    passwordResult.codeLength
                );
                
                return SignInResult.createCodeRequiredResult(
                    passwordResult.codeLength,
                    this.stateParams.correlationId
                );
            } else {
                // Unexpected state after password verification
                this.state = new SignInFailedState(
                    this.stateParams,
                    SignInErrorType.UNEXPECTED_RESPONSE,
                    "Unexpected response after password verification"
                );
                
                return SignInResult.createWithError(
                    this.state.errorType,
                    this.state.errorMessage,
                    this.stateParams.correlationId
                );
            }
        } catch (error) {
            // Handle unexpected errors
            this.stateParams.logger.error(
                "Unexpected error during sign-in flow",
                error,
                this.stateParams.correlationId
            );
            
            this.state = new SignInFailedState(
                this.stateParams,
                SignInErrorType.UNKNOWN_ERROR,
                error instanceof Error ? error.message : "Unknown error occurred during sign-in"
            );
            
            return SignInResult.createWithError(
                this.state.errorType,
                this.state.errorMessage,
                this.stateParams.correlationId
            );
        }
    }
    
    /**
     * Submit verification code for multi-factor authentication
     * @param code - Verification code received by the user
     * @returns Promise resolving to the result of the sign-in operation
     */
    async submitCode(code: string): Promise<SignInResult> {
        try {
            this.stateParams.logger.verbose(
                "Submitting verification code for sign-in",
                this.stateParams.correlationId
            );
            
            if (!(this.state instanceof SignInCodeRequiredState)) {
                this.stateParams.logger.error(
                    "Invalid state transition: Expected CodeRequiredState",
                    this.stateParams.correlationId
                );
                
                return SignInResult.createWithError(
                    SignInErrorType.INVALID_STATE,
                    "Invalid state: verification code not requested",
                    this.stateParams.correlationId
                );
            }
            
            // Submit verification code
            const codeResult = await this.state.submitCode(code);
            
            if (!codeResult.success) {
                // Code verification failed
                this.state = new SignInFailedState(
                    this.stateParams,
                    codeResult.errorType || SignInErrorType.UNKNOWN_ERROR,
                    codeResult.errorMessage || "Code verification failed"
                );
                
                return SignInResult.createWithError(
                    this.state.errorType,
                    this.state.errorMessage,
                    this.stateParams.correlationId
                );
            }
            
            if (codeResult.authenticationResult) {
                // Authentication completed successfully with code verification
                this.state = new SignInCompletedState(
                    this.stateParams,
                    codeResult.authenticationResult
                );
                
                return SignInResult.createSuccessResult(
                    this.state.authenticationResult,
                    this.stateParams.correlationId
                );
            } else {
                // Unexpected state after code verification
                this.state = new SignInFailedState(
                    this.stateParams,
                    SignInErrorType.UNEXPECTED_RESPONSE,
                    "Unexpected response after code verification"
                );
                
                return SignInResult.createWithError(
                    this.state.errorType,
                    this.state.errorMessage,
                    this.stateParams.correlationId
                );
            }
        } catch (error) {
            // Handle unexpected errors
            this.stateParams.logger.error(
                "Unexpected error during code verification",
                error,
                this.stateParams.correlationId
            );
            
            this.state = new SignInFailedState(
                this.stateParams,
                SignInErrorType.UNKNOWN_ERROR,
                error instanceof Error ? error.message : "Unknown error occurred during code verification"
            );
            
            return SignInResult.createWithError(
                this.state.errorType,
                this.state.errorMessage,
                this.stateParams.correlationId
            );
        }
    }
    
    /**
     * Request a new verification code to be sent
     * @returns Promise resolving to whether the resend was successful
     */
    async resendCode(): Promise<boolean> {
        try {
            this.stateParams.logger.verbose(
                "Requesting new verification code",
                this.stateParams.correlationId
            );
            
            if (!(this.state instanceof SignInCodeRequiredState)) {
                this.stateParams.logger.error(
                    "Invalid state for code resend: Expected CodeRequiredState",
                    this.stateParams.correlationId
                );
                
                return false;
            }
            
            // Request a new verification code
            const resendResult = await this.state.resendCode();
            
            return resendResult.success;
        } catch (error) {
            this.stateParams.logger.error(
                "Error requesting new verification code",
                error,
                this.stateParams.correlationId
            );
            
            return false;
        }
    }
    
    /**
     * Generate a correlation ID for request tracing
     * @returns Generated correlation ID
     */
    private generateCorrelationId(): string {
        const now = new Date().getTime();
        return `signin-${now}-${Math.floor(Math.random() * 1000000)}`;
    }
}
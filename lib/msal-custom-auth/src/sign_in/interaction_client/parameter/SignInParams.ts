/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Base parameters for sign-in operations
 */
export interface SignInBaseParams {
    /**
     * Client ID of the application
     */
    clientId: string;
    
    /**
     * Correlation ID for request tracing
     */
    correlationId: string;
    
    /**
     * Types of challenges supported for authentication
     */
    challengeType: string[];
    
    /**
     * Username for authentication
     */
    username: string;
}

/**
 * Parameters for starting the sign-in flow
 */
export interface SignInStartParams extends SignInBaseParams {
    /**
     * Optional password for authentication if available
     */
    password?: string;
}

/**
 * Parameters for submitting a password during sign-in
 */
export interface SignInSubmitPasswordParams extends SignInBaseParams {
    /**
     * Continuation token from previous operation
     */
    continuationToken: string;
    
    /**
     * Password for authentication
     */
    password: string;
    
    /**
     * Scopes to request for the auth token
     */
    scopes: string[];
}

/**
 * Parameters for submitting a verification code during sign-in
 */
export interface SignInSubmitCodeParams extends SignInBaseParams {
    /**
     * Continuation token from previous operation
     */
    continuationToken: string;
    
    /**
     * Verification code received by user
     */
    code: string;
    
    /**
     * Scopes to request for the auth token
     */
    scopes: string[];
}

/**
 * Parameters for requesting a new verification code during sign-in
 */
export interface SignInResendCodeParams extends SignInBaseParams {
    /**
     * Continuation token from previous operation
     */
    continuationToken: string;
}
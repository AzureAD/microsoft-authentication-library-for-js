/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult } from "@azure/msal-browser";
import { SignInStateParameters } from "./SignInStateParameters.js";

/**
 * State representing that sign-in has been successfully completed
 */
export class SignInCompletedState {
    /**
     * Correlation ID for request tracing
     */
    readonly correlationId: string;
    
    /**
     * Username for the signed-in user
     */
    readonly username: string;
    
    /**
     * Authentication result containing tokens and account information
     */
    readonly authenticationResult: AuthenticationResult;
    
    private readonly logger;
    private readonly cacheClient;

    /**
     * Creates an instance of SignInCompletedState
     * @param params - Parameters for the state
     * @param authenticationResult - Authentication result from successful sign-in
     */
    constructor(params: SignInStateParameters, authenticationResult: AuthenticationResult) {
        this.correlationId = params.correlationId;
        this.username = params.username;
        this.authenticationResult = authenticationResult;
        this.logger = params.logger;
        this.cacheClient = params.cacheClient;
        
        // Store the authentication result in cache
        this.storeAuthResult();
    }
    
    /**
     * Stores the authentication result in the cache
     */
    private storeAuthResult(): void {
        try {
            this.logger.verbose("Storing authentication result in cache", this.correlationId);
            this.cacheClient.storeAuthenticationResult(this.authenticationResult);
        } catch (error) {
            this.logger.error("Failed to store authentication result in cache", error, this.correlationId);
            // Do not throw, as the sign-in was still successful
        }
    }
}
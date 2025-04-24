/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignInStateParameters } from "./SignInStateParameters.js";
import { SignInSubmitPasswordResult } from "../result/SignInSubmitPasswordResult.js";
import { SignInErrorType } from "../error_type/SignInError.js";

/**
 * State representing that a password is required to complete sign-in
 */
export class SignInPasswordRequiredState {
    /**
     * Correlation ID for request tracing
     */
    readonly correlationId: string;
    
    /**
     * Continuation token for multi-step auth flow
     */
    readonly continuationToken: string;
    
    /**
     * Username for sign-in
     */
    readonly username: string;
    
    /**
     * Scopes requested for the authentication token
     */
    readonly scopes: string[];
    
    private readonly signInClient;
    private readonly logger;
    private readonly config;
    private readonly cacheClient;

    /**
     * Creates an instance of SignInPasswordRequiredState
     * @param params - Parameters for the state
     */
    constructor(params: SignInStateParameters) {
        this.correlationId = params.correlationId;
        this.continuationToken = params.continuationToken;
        this.username = params.username;
        this.scopes = params.scopes || [];
        this.signInClient = params.signInClient;
        this.logger = params.logger;
        this.config = params.config;
        this.cacheClient = params.cacheClient;
    }

    /**
     * Submits the password to continue the sign-in process
     * @param password - User's password for authentication
     * @returns Promise resolving to the result of submitting the password
     */
    async submitPassword(password: string): Promise<SignInSubmitPasswordResult> {
        try {
            this.logger.verbose("Submitting password for sign-in", this.correlationId);

            if (!password) {
                this.logger.error("Password cannot be empty", this.correlationId);
                return SignInSubmitPasswordResult.createWithError(
                    SignInErrorType.INVALID_CREDENTIALS,
                    "Password cannot be empty",
                    this.correlationId
                );
            }

            return await this.signInClient.submitPassword({
                clientId: this.config.auth.clientId,
                correlationId: this.correlationId,
                challengeType: this.config.customAuth.challengeTypes || [],
                scopes: this.scopes,
                continuationToken: this.continuationToken,
                password: password,
                username: this.username
            });
        } catch (error) {
            this.logger.error("Error submitting password for sign-in", error, this.correlationId);
            return SignInSubmitPasswordResult.createWithError(
                SignInErrorType.UNKNOWN_ERROR,
                error instanceof Error ? error.message : "Unknown error occurred during sign-in",
                this.correlationId
            );
        }
    }
}
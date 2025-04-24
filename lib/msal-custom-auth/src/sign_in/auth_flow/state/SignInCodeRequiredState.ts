/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignInStateParameters } from "./SignInStateParameters.js";
import { SignInSubmitCodeResult } from "../result/SignInSubmitCodeResult.js";
import { SignInResendCodeResult } from "../result/SignInResendCodeResult.js";
import { SignInErrorType } from "../error_type/SignInError.js";

/**
 * State representing that a verification code is required to complete sign-in
 */
export class SignInCodeRequiredState {
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
    
    /**
     * Length of the verification code
     */
    readonly codeLength: number;
    
    private readonly signInClient;
    private readonly logger;
    private readonly config;
    private readonly cacheClient;

    /**
     * Creates an instance of SignInCodeRequiredState
     * @param params - Parameters for the state
     * @param codeLength - Length of the verification code
     */
    constructor(params: SignInStateParameters, codeLength: number) {
        this.correlationId = params.correlationId;
        this.continuationToken = params.continuationToken;
        this.username = params.username;
        this.scopes = params.scopes || [];
        this.codeLength = codeLength;
        this.signInClient = params.signInClient;
        this.logger = params.logger;
        this.config = params.config;
        this.cacheClient = params.cacheClient;
    }

    /**
     * Submits the verification code to continue the sign-in process
     * @param code - Verification code received by the user
     * @returns Promise resolving to the result of submitting the code
     */
    async submitCode(code: string): Promise<SignInSubmitCodeResult> {
        try {
            this.logger.verbose("Submitting verification code for sign-in", this.correlationId);

            if (!code) {
                this.logger.error("Verification code cannot be empty", this.correlationId);
                return SignInSubmitCodeResult.createWithError(
                    SignInErrorType.INVALID_CREDENTIALS,
                    "Verification code cannot be empty",
                    this.correlationId
                );
            }

            return await this.signInClient.submitCode({
                clientId: this.config.auth.clientId,
                correlationId: this.correlationId,
                challengeType: this.config.customAuth.challengeTypes || [],
                scopes: this.scopes,
                continuationToken: this.continuationToken,
                code: code,
                username: this.username
            });
        } catch (error) {
            this.logger.error("Error submitting verification code", error, this.correlationId);
            return SignInSubmitCodeResult.createWithError(
                SignInErrorType.UNKNOWN_ERROR,
                error instanceof Error ? error.message : "Unknown error occurred during sign-in",
                this.correlationId
            );
        }
    }

    /**
     * Requests a new verification code to be sent
     * @returns Promise resolving to the result of requesting a new code
     */
    async resendCode(): Promise<SignInResendCodeResult> {
        try {
            this.logger.verbose("Requesting new verification code for sign-in", this.correlationId);

            const result = await this.signInClient.resendCode({
                clientId: this.config.auth.clientId,
                correlationId: this.correlationId,
                challengeType: this.config.customAuth.challengeTypes || [],
                continuationToken: this.continuationToken,
                username: this.username
            });

            if (result.success) {
                return SignInResendCodeResult.createSuccessResult(
                    this.codeLength, 
                    this.correlationId
                );
            } else {
                return SignInResendCodeResult.createWithError(
                    result.errorType || SignInErrorType.UNKNOWN_ERROR,
                    result.errorMessage || "Failed to resend verification code",
                    this.correlationId
                );
            }
        } catch (error) {
            this.logger.error("Error requesting new verification code", error, this.correlationId);
            return SignInResendCodeResult.createWithError(
                SignInErrorType.UNKNOWN_ERROR,
                error instanceof Error ? error.message : "Unknown error occurred during code resend",
                this.correlationId
            );
        }
    }
}
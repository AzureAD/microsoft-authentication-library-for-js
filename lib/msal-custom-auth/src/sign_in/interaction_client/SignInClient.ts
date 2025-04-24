/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult } from "@azure/msal-browser";
import { ICustomAuthApiClient } from "../../../core/network_client/custom_auth_api/ICustomAuthApiClient.js";
import { 
    SignInSubmitPasswordResult, 
    SignInSubmitCodeResult, 
    SignInResendCodeResult 
} from "../auth_flow/result/index.js";
import { SignInErrorType } from "../auth_flow/error_type/index.js";

/**
 * Interface for sign-in password parameters
 */
export interface SignInPasswordParameters {
    clientId: string;
    correlationId: string;
    challengeType: string[];
    continuationToken: string;
    password: string;
    username: string;
    scopes?: string[];
}

/**
 * Interface for sign-in code parameters
 */
export interface SignInCodeParameters {
    clientId: string;
    correlationId: string;
    challengeType: string[];
    continuationToken: string;
    code: string;
    username: string;
    scopes?: string[];
}

/**
 * Interface for sign-in code resend parameters
 */
export interface SignInResendCodeParameters {
    clientId: string;
    correlationId: string;
    challengeType: string[];
    continuationToken: string;
    username: string;
}

/**
 * Client for interacting with custom authentication API during sign-in
 */
export class SignInClient {
    private apiClient: ICustomAuthApiClient;

    /**
     * Creates an instance of SignInClient
     * @param apiClient - Client to make API requests
     */
    constructor(apiClient: ICustomAuthApiClient) {
        this.apiClient = apiClient;
    }

    /**
     * Submit password for sign-in
     * @param params - Parameters for password submission
     * @returns Promise resolving to the result of submitting the password
     */
    async submitPassword(params: SignInPasswordParameters): Promise<SignInSubmitPasswordResult> {
        try {
            const response = await this.apiClient.submitPassword(
                params.clientId,
                params.username,
                params.password,
                params.continuationToken,
                params.challengeType,
                params.scopes,
                params.correlationId
            );

            if (response.success) {
                if (response.authenticationResult) {
                    // Authentication completed successfully with password
                    return SignInSubmitPasswordResult.createSuccessAuthResult(
                        response.authenticationResult,
                        params.correlationId
                    );
                } else if (response.continuationToken && response.codeLength) {
                    // Additional verification required (code)
                    return SignInSubmitPasswordResult.createSuccessCodeRequired(
                        response.continuationToken,
                        response.codeLength,
                        params.correlationId
                    );
                } else {
                    // Unexpected API response
                    return SignInSubmitPasswordResult.createWithError(
                        SignInErrorType.UNEXPECTED_RESPONSE,
                        "Unexpected API response format",
                        params.correlationId
                    );
                }
            } else {
                // API reported error
                return SignInSubmitPasswordResult.createWithError(
                    response.errorType || SignInErrorType.INVALID_CREDENTIALS,
                    response.errorMessage || "Failed to authenticate with password",
                    params.correlationId
                );
            }
        } catch (error) {
            // Network or unexpected error
            return SignInSubmitPasswordResult.createWithError(
                SignInErrorType.NETWORK_ERROR,
                error instanceof Error ? error.message : "Network error during sign-in",
                params.correlationId
            );
        }
    }

    /**
     * Submit verification code for sign-in
     * @param params - Parameters for code submission
     * @returns Promise resolving to the result of submitting the code
     */
    async submitCode(params: SignInCodeParameters): Promise<SignInSubmitCodeResult> {
        try {
            const response = await this.apiClient.submitVerificationCode(
                params.clientId,
                params.username,
                params.code,
                params.continuationToken,
                params.challengeType,
                params.scopes,
                params.correlationId
            );

            if (response.success && response.authenticationResult) {
                // Authentication completed successfully with code
                return SignInSubmitCodeResult.createSuccessResult(
                    response.authenticationResult,
                    params.correlationId
                );
            } else {
                // API reported error or unexpected response
                return SignInSubmitCodeResult.createWithError(
                    response.errorType || SignInErrorType.INVALID_CODE,
                    response.errorMessage || "Failed to authenticate with verification code",
                    params.correlationId
                );
            }
        } catch (error) {
            // Network or unexpected error
            return SignInSubmitCodeResult.createWithError(
                SignInErrorType.NETWORK_ERROR,
                error instanceof Error ? error.message : "Network error during code verification",
                params.correlationId
            );
        }
    }

    /**
     * Request a new verification code for sign-in
     * @param params - Parameters for code resend request
     * @returns Promise resolving to the result of requesting a new code
     */
    async resendCode(params: SignInResendCodeParameters): Promise<SignInResendCodeResult> {
        try {
            const response = await this.apiClient.resendVerificationCode(
                params.clientId,
                params.username,
                params.continuationToken,
                params.challengeType,
                params.correlationId
            );

            if (response.success && response.codeLength) {
                // New code sent successfully
                return SignInResendCodeResult.createSuccessResult(
                    response.codeLength,
                    params.correlationId
                );
            } else {
                // API reported error or unexpected response
                return SignInResendCodeResult.createWithError(
                    response.errorType || SignInErrorType.RESEND_FAILED,
                    response.errorMessage || "Failed to resend verification code",
                    params.correlationId
                );
            }
        } catch (error) {
            // Network or unexpected error
            return SignInResendCodeResult.createWithError(
                SignInErrorType.NETWORK_ERROR,
                error instanceof Error ? error.message : "Network error during code resend",
                params.correlationId
            );
        }
    }
}
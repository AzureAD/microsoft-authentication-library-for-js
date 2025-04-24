/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult } from "@azure/msal-browser";

/**
 * Base class for sign-in action results
 */
export abstract class SignInActionResult {
    /**
     * Correlation ID for request tracing
     */
    readonly correlationId: string;
    
    /**
     * Continuation token for multi-step authentication flows
     */
    readonly continuationToken: string;

    /**
     * Creates an instance of SignInActionResult
     * @param correlationId - Correlation ID for request tracing
     * @param continuationToken - Continuation token for multi-step flows
     */
    constructor(correlationId: string, continuationToken: string) {
        this.correlationId = correlationId;
        this.continuationToken = continuationToken;
    }
}

/**
 * Result indicating verification code is required for sign-in
 */
export class SignInCodeSendResult extends SignInActionResult {
    /**
     * Length of the verification code sent to the user
     */
    readonly codeLength: number;

    /**
     * Creates an instance of SignInCodeSendResult
     * @param correlationId - Correlation ID for request tracing
     * @param continuationToken - Continuation token for multi-step flows
     * @param codeLength - Length of the verification code
     */
    constructor(correlationId: string, continuationToken: string, codeLength: number) {
        super(correlationId, continuationToken);
        this.codeLength = codeLength;
    }
}

/**
 * Result indicating password is required for sign-in
 */
export class SignInPasswordRequiredResult extends SignInActionResult {
    /**
     * Creates an instance of SignInPasswordRequiredResult
     * @param correlationId - Correlation ID for request tracing
     * @param continuationToken - Continuation token for multi-step flows
     */
    constructor(correlationId: string, continuationToken: string) {
        super(correlationId, continuationToken);
    }
}

/**
 * Result for a successful sign-in with authentication tokens
 */
export class SignInCompletedResult {
    /**
     * Authentication result containing tokens and account information
     */
    readonly authenticationResult: AuthenticationResult;

    /**
     * Creates an instance of SignInCompletedResult
     * @param authenticationResult - Authentication result with tokens and account data
     */
    constructor(authenticationResult: AuthenticationResult) {
        this.authenticationResult = authenticationResult;
    }
}
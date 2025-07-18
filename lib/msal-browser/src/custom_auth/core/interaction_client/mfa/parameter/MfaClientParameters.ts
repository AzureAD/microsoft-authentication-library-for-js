/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Base interface for MFA client parameters.
 */
export interface MfaClientParametersBase {
    correlationId: string;
    continuationToken: string;
}

/**
 * Parameters for requesting MFA challenge.
 */
export interface MfaRequestChallengeParams extends MfaClientParametersBase {
    /**
     * The challenge types to request (e.g., ["oob"]).
     */
    challengeType: string[];

    /**
     * Optional specific authentication method ID to challenge.
     * If not provided, the default method will be used.
     */
    authMethodId?: string;
}

/**
 * Parameters for submitting MFA challenge response.
 */
export interface MfaSubmitChallengeParams extends MfaClientParametersBase {
    /**
     * The challenge code (e.g., OTP code) from the user.
     */
    code: string;

    /**
     * Scopes for the token request.
     */
    scopes: string[];
}

/**
 * Parameters for getting available authentication methods.
 * Currently extends base parameters but can be extended for future requirements.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MfaGetAuthMethodsParams extends MfaClientParametersBase {}

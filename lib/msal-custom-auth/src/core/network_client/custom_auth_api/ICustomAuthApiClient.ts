/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    SignInChallengeRequest,
    SignInContinuationTokenRequest,
    SignInInitiateRequest,
    SignInOobTokenRequest,
    SignInPasswordTokenRequest,
} from "./request/SignInRequest.js";
import {
    SignUpChallengeRequest,
    SignUpStartRequest,
    SignUpSubmitCodeRequest,
    SignUpSubmitPasswordRequest,
    SignUpSubmitUserAttributesRequest,
} from "./request/SignUpRequest.js";
import {
    SignInChallengeResponse,
    SignInInitiateResponse,
    SignInTokenResponse,
    SignUpChallengeResponse,
    SignUpContinueResponse,
    SignUpStartResponse,
} from "./response/ApiResponse.js";

export interface ICustomAuthApiClient {
    /**
     * Perform the sign-in initiate request to endpoint '/initiate'.
     * @param request The initiate request.
     * @returns The initiate response.
     */
    performSignInInitiateRequest(
        request: SignInInitiateRequest,
    ): Promise<SignInInitiateResponse>;

    /**
     * Perform the sign-in challenge request to endpoint '/challenge'.
     * @param request The challenge request.
     * @returns The challenge response.
     */
    performSignInChallengeRequest(
        request: SignInChallengeRequest,
    ): Promise<SignInChallengeResponse>;

    /**
     * Perform the sign-in token request to endpoint '/token' for submitting code.
     * @param request The token request for submitting code.
     * @returns The token response.
     */
    performSignInOobTokenRequest(
        request: SignInOobTokenRequest,
    ): Promise<SignInTokenResponse>;

    /**
     * Perform the sign-in token request to endpoint '/token' for submitting password.
     * @param request The token request for submitting password.
     * @returns The token response.
     */
    performSignInPasswordTokenRequest(
        request: SignInPasswordTokenRequest,
    ): Promise<SignInTokenResponse>;

    /**
     * Perform the sign-in token request to endpoint '/token' with continuation token.
     * @param request The token request with continuation token.
     * @returns The token response.
     */
    performSignInContinuationTokenRequest(
        request: SignInContinuationTokenRequest,
    ): Promise<SignInTokenResponse>;

    /**
     * Perform the sign-up start request to endpoint 'signup/v1.0/start'.
     * @param request The start request.
     * @returns The start response.
     */
    performSignUpStartRequest(
        request: SignUpStartRequest,
    ): Promise<SignUpStartResponse>;

    /**
     * Perform the sign-up challenge request to endpoint 'signup/v1.0/challenge'.
     * @param request The challenge request.
     * @returns The challenge response.
     */
    performSignUpChallengeRequest(
        request: SignUpChallengeRequest,
    ): Promise<SignUpChallengeResponse>;

    /**
     * Perform the sign-up continue request to endpoint 'signup/v1.0/continue' for submitting code.
     * @param request The continue request for submitting code.
     * @returns The continue response.
     */
    performSignUpSubmitCodeRequest(
        request: SignUpSubmitCodeRequest,
    ): Promise<SignUpContinueResponse>;

    /**
     * Perform the sign-up continue request to endpoint 'signup/v1.0/continue' for submitting password.
     * @param request The continue request for submitting password.
     * @returns The continue response.
     */
    performSignUpSubmitPasswordRequest(
        request: SignUpSubmitPasswordRequest,
    ): Promise<SignUpContinueResponse>;

    /**
     * Perform the sign-up continue request to endpoint 'signup/v1.0/continue' for submitting user attributes.
     * @param request The continue request for submitting user attributes.
     * @returns The continue response.
     */
    performSignUpSubmitUserAttributesRequest(
        request: SignUpSubmitUserAttributesRequest,
    ): Promise<SignUpContinueResponse>;
}

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
    SignInCodeSendResponse,
    SignInContinuationTokenResponse,
    SignInTokenResponse,
} from "./response/SignInResponse.js";

export interface INativeAuthApiClient {
    performSignInInitiateRequest(
        request: SignInInitiateRequest
    ): Promise<SignInContinuationTokenResponse>;

    performSignInChallengeRequest(
        request: SignInChallengeRequest
    ): Promise<SignInCodeSendResponse | SignInContinuationTokenResponse>;

    performSignInOobTokenRequest(
        request: SignInOobTokenRequest
    ): Promise<SignInTokenResponse>;

    performSignInPasswordTokenRequest(
        request: SignInPasswordTokenRequest
    ): Promise<SignInTokenResponse>;

    performSignInContinuationTokenTokenRequest(
        request: SignInContinuationTokenRequest
    ): Promise<SignInTokenResponse>;
}

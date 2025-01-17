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
    SignInChallengeResponse,
    SignInInitiateResponse,
    SignInTokenResponse,
} from "./response/SignInResponse.js";

export interface ICustomAuthApiClient {
    performSignInInitiateRequest(
        request: SignInInitiateRequest,
    ): Promise<SignInInitiateResponse>;

    performSignInChallengeRequest(
        request: SignInChallengeRequest,
    ): Promise<SignInChallengeResponse>;

    performSignInOobTokenRequest(
        request: SignInOobTokenRequest,
    ): Promise<SignInTokenResponse>;

    performSignInPasswordTokenRequest(
        request: SignInPasswordTokenRequest,
    ): Promise<SignInTokenResponse>;

    performSignInContinuationTokenRequest(
        request: SignInContinuationTokenRequest,
    ): Promise<SignInTokenResponse>;
}

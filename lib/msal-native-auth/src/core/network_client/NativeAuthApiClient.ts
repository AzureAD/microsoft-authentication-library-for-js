/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { FetchClient } from "@azure/msal-browser";
import { InvalidArgumentError } from "../error/InvalidArgumentError.js";
import { INativeAuthApiClient } from "./INativeAuthApiClient.js";
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
import { ResponseHandler } from "./ResponseHandler.js";

export class NativeAuthApiClient implements INativeAuthApiClient {
    private readonly responseHandler: ResponseHandler;

    constructor(private readonly httpClient: FetchClient) {
        if (!httpClient) {
            throw new InvalidArgumentError("httpClient");
        }

        this.responseHandler = new ResponseHandler();
    }

    async performSignInInitiateRequest(
        request: SignInInitiateRequest
    ): Promise<SignInContinuationTokenResponse> {
        /*
         * 1. generate the network request options and request url
         * 2. call httpClient.sendPostRequestAsync to get response
         * 3. if the response is successful, then deserialze the response body to ContinuationTokenResponse.
         * 4. if the response is failed, generate an error based on the error response and throw it.
         */

        throw new Error(`Method not implemented with parameter ${request}`);
    }

    async performSignInChallengeRequest(
        request: SignInChallengeRequest
    ): Promise<SignInCodeSendResponse | SignInContinuationTokenResponse> {
        throw new Error(`Method not implemented with parameter ${request}`);
    }

    async performSignInOobTokenRequest(
        request: SignInOobTokenRequest
    ): Promise<SignInTokenResponse> {
        throw new Error(`Method not implemented with parameter ${request}`);
    }

    async performSignInPasswordTokenRequest(
        request: SignInPasswordTokenRequest
    ): Promise<SignInTokenResponse> {
        throw new Error(`Method not implemented with parameter ${request}`);
    }

    async performSignInContinuationTokenTokenRequest(
        request: SignInContinuationTokenRequest
    ): Promise<SignInTokenResponse> {
        throw new Error(`Method not implemented with parameter ${request}`);
    }
}

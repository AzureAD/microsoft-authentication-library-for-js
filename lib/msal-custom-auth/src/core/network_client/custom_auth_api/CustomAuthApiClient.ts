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
    SignUpChallengeResponse,
    SignUpContinueResponse,
    SignUpStartResponse,
} from "./response/ApiResponse.js";
import { CustomAuthApiResponseHandler } from "./CustomAuthApiResponseHandler.js";
import { IHttpClient } from "../http_client/IHttpClient.js";
import {
    HttpMethod,
    HttpRequestMessage,
    HttpResponseMessage,
} from "../http_client/HttpMessage.js";
import { ICustomAuthApiClient } from "./ICustomAuthApiClient.js";
import { CustomAuthApiEndpoint } from "./CustomAuthApiEndpoint.js";
import { CustomAuthApiRequestBase } from "./request/CustomAuthApiRequestBase.js";
import { CustomAuthApiResponseBase } from "./response/CustomAuthApiResponseBase.js";
import {
    CustomAuthApiError,
    CustomAuthApiErrorCode,
} from "../../error/CustomAuthApiError.js";
import { ArgumentValidator } from "../../utils/ArgumentValidator.js";
import {
    SignUpStartRequest,
    SignUpChallengeRequest,
    SignUpSubmitCodeRequest,
    SignUpSubmitPasswordRequest,
    SignUpSubmitUserAttributesRequest,
} from "./request/SignUpRequest.js";

/**
 * Custom Auth Client which can be used to make requests to the Custom Auth service.
 */
export class CustomAuthApiClient implements ICustomAuthApiClient {
    constructor(private readonly httpClient: IHttpClient) {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "httpClient",
            httpClient,
        );
    }

    async performSignInInitiateRequest(
        request: SignInInitiateRequest,
    ): Promise<SignInInitiateResponse> {
        const body = new URLSearchParams({
            client_id: request.parameters.clientId,
            challenge_type: request.parameters.challengeType,
            username: request.parameters.username,
        });

        return this.performPostRequest(
            CustomAuthApiEndpoint.SIGN_IN_INITIATE_ENDPOINT,
            body,
            request,
            CustomAuthApiResponseHandler.handleSignInInitiateResponse,
        );
    }

    async performSignInChallengeRequest(
        request: SignInChallengeRequest,
    ): Promise<SignInChallengeResponse> {
        const body = new URLSearchParams({
            client_id: request.parameters.clientId,
            challenge_type: request.parameters.challengeType,
            continuation_token: request.parameters.continuationToken,
        });

        return this.performPostRequest(
            CustomAuthApiEndpoint.SIGN_IN_CHALLENGE_ENDPOINT,
            body,
            request,
            CustomAuthApiResponseHandler.handleSignInChallengeResponse,
        );
    }

    async performSignInOobTokenRequest(
        request: SignInOobTokenRequest,
    ): Promise<SignInTokenResponse> {
        const body = new URLSearchParams({
            client_id: request.parameters.clientId,
            continuation_token: request.parameters.continuationToken,
            grant_type: request.parameters.grantType,
            scope: (request.parameters.scopes ?? []).join(" "),
            oob: request.parameters.oob,
        });

        return this.performPostRequest(
            CustomAuthApiEndpoint.SIGN_IN_TOKEN_ENDPOINT,
            body,
            request,
            CustomAuthApiResponseHandler.handleSignInTokenResponse,
        );
    }

    async performSignInPasswordTokenRequest(
        request: SignInPasswordTokenRequest,
    ): Promise<SignInTokenResponse> {
        const body = new URLSearchParams({
            client_id: request.parameters.clientId,
            continuation_token: request.parameters.continuationToken,
            grant_type: request.parameters.grantType,
            scope: (request.parameters.scopes ?? []).join(" "),
            password: request.parameters.password,
        });

        return this.performPostRequest(
            CustomAuthApiEndpoint.SIGN_IN_TOKEN_ENDPOINT,
            body,
            request,
            CustomAuthApiResponseHandler.handleSignInTokenResponse,
        );
    }

    async performSignInContinuationTokenRequest(
        request: SignInContinuationTokenRequest,
    ): Promise<SignInTokenResponse> {
        const body = new URLSearchParams({
            client_id: request.parameters.clientId,
            continuation_token: request.parameters.continuationToken,
            grant_type: request.parameters.grantType,
            scope: (request.parameters.scopes ?? []).join(" "),
            username: request.parameters.username,
        });

        return this.performPostRequest(
            CustomAuthApiEndpoint.SIGN_IN_TOKEN_ENDPOINT,
            body,
            request,
            CustomAuthApiResponseHandler.handleSignInTokenResponse,
        );
    }

    async performPostRequest<TResult extends CustomAuthApiResponseBase>(
        requestEndpoint: string,
        requestBody: URLSearchParams,
        requestParams: CustomAuthApiRequestBase,
        responseHandler: (
            response: HttpResponseMessage,
            correlationId: string,
        ) => TResult,
    ): Promise<TResult> {
        const requestMessage = new HttpRequestMessage(
            HttpMethod.POST,
            requestEndpoint,
            requestParams.headers,
            requestParams.correlationId,
            requestBody.toString(),
        );

        let response: HttpResponseMessage;

        try {
            response = await this.httpClient.sendAsync(requestMessage);
        } catch (e) {
            throw new CustomAuthApiError(
                CustomAuthApiErrorCode.HTTP_REQUEST_FAILED,
                `Failed to perform '${requestEndpoint}' request: ${e}`,
                requestParams.correlationId,
            );
        }

        return responseHandler(response, requestParams.correlationId);
    }

    performSignUpStartRequest(
        request: SignUpStartRequest,
    ): Promise<SignUpStartResponse> {
        throw new Error(
            `Method not implemented with parameter request '${request}'.`,
        );
    }

    performSignUpChallengeRequest(
        request: SignUpChallengeRequest,
    ): Promise<SignUpChallengeResponse> {
        throw new Error(
            `Method not implemented with parameter request '${request}'.`,
        );
    }

    performSignUpSubmitCodeRequest(
        request: SignUpSubmitCodeRequest,
    ): Promise<SignUpContinueResponse> {
        throw new Error(
            `Method not implemented with parameter request '${request}'.`,
        );
    }

    performSignUpSubmitPasswordRequest(
        request: SignUpSubmitPasswordRequest,
    ): Promise<SignUpContinueResponse> {
        throw new Error(
            `Method not implemented with parameter request '${request}'.`,
        );
    }

    performSignUpSubmitUserAttributesRequest(
        request: SignUpSubmitUserAttributesRequest,
    ): Promise<SignUpContinueResponse> {
        throw new Error(
            `Method not implemented with parameter request '${request}'.`,
        );
    }
}

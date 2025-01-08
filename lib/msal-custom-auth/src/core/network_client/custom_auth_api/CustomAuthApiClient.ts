/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-browser";
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
import { CustomAuthApiResponseHandler } from "./CustomAuthApiResponseHandler.js";
import { IHttpClient } from "../http-client/IHttpClient.js";
import {
    HttpMethod,
    HttpRequestMessage,
    HttpResponseMessage,
} from "../http-client/HttpMessage.js";
import { ICustomAuthApiClient } from "./ICustomAuthApiClient.js";
import { CustomAuthApiEndpoint } from "./CustomAuthApiEndpoint.js";
import { CustomAuthApiRequestBase } from "./request/CustomAuthApiRequestBase.js";
import { CustomAuthApiResponseBase } from "./response/CustomAuthApiResponseBase.js";
import {
    CustomAuthApiError,
    CustomAuthApiErrorCode,
} from "../../error/CustomAuthApiError.js";
import { ArgumentValidator } from "../../utils/ArgumentValidator.js";

/**
 * Custom Auth Client which can be used to make requests to the Custom Auth service.
 */
export class CustomAuthApiClient implements ICustomAuthApiClient {
    constructor(
        private readonly httpClient: IHttpClient,
        private readonly logger: Logger
    ) {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "httpClient",
            httpClient
        );
    }

    async performSignInInitiateRequest(
        request: SignInInitiateRequest
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
            CustomAuthApiResponseHandler.handleSignInInitiateResponse
        );
    }

    async performSignInChallengeRequest(
        request: SignInChallengeRequest
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
            CustomAuthApiResponseHandler.handleSignInChallengeResponse
        );
    }

    async performSignInOobTokenRequest(
        request: SignInOobTokenRequest
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
            CustomAuthApiResponseHandler.handleSignInTokenResponse
        );
    }

    async performSignInPasswordTokenRequest(
        request: SignInPasswordTokenRequest
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
            CustomAuthApiResponseHandler.handleSignInTokenResponse
        );
    }

    async performSignInContinuationTokenTokenRequest(
        request: SignInContinuationTokenRequest
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
            CustomAuthApiResponseHandler.handleSignInTokenResponse
        );
    }

    async performPostRequest<TResult extends CustomAuthApiResponseBase>(
        requestEndpoint: string,
        requestBody: URLSearchParams,
        requestParams: CustomAuthApiRequestBase,
        responseHandler: (
            response: HttpResponseMessage,
            correlationId: string
        ) => TResult
    ): Promise<TResult> {
        const requestMessage = new HttpRequestMessage(
            HttpMethod.POST,
            requestEndpoint,
            requestParams.headers,
            requestParams.correlationId,
            requestBody.toString()
        );

        try {
            const response = await this.httpClient.sendAsync(requestMessage);

            return responseHandler(response, requestParams.correlationId);
        } catch (e) {
            throw new CustomAuthApiError(
                CustomAuthApiErrorCode.HTTP_REQUEST_FAILED,
                `Failed to perform '${requestEndpoint}' request: ${e}`,
                requestParams.correlationId
            );
        }
    }
}

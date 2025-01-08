/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ChallengeType, HttpHeaderKeys } from "../../../CustomAuthConstants.js";
import {
    RedirectError,
    CustomAuthApiError,
    CustomAuthApiErrorCode,
} from "../../error/CustomAuthApiError.js";
import { HttpResponseMessage } from "../http-client/HttpMessage.js";
import { ApiErrorResponse } from "./response/ApiErrorResponse.js";
import { CustomAuthApiResponseBase } from "./response/CustomAuthApiResponseBase.js";
import {
    SignInChallengeResponse,
    SignInInitiateResponse,
    SignInTokenResponse,
} from "./response/SignInResponse.js";

export class CustomAuthApiResponseHandler {
    static handleSignInInitiateResponse(
        response: HttpResponseMessage,
        correlationId: string
    ): SignInInitiateResponse {
        const responseBodyContent =
            this.readResponseBody<SignInInitiateResponse>(
                response,
                correlationId
            );

        this.ensureContinuationTokenIsValid(responseBodyContent);

        return responseBodyContent;
    }

    static handleSignInChallengeResponse(
        response: HttpResponseMessage,
        correlationId: string
    ): SignInChallengeResponse {
        const responseBodyContent =
            this.readResponseBody<SignInChallengeResponse>(
                response,
                correlationId
            );

        this.ensureContinuationTokenIsValid(responseBodyContent);
        this.ensureChallengeTypeIsValid(
            responseBodyContent.challenge_type,
            responseBodyContent.correlation_id
        );

        return responseBodyContent;
    }

    static handleSignInTokenResponse(
        response: HttpResponseMessage,
        correlationId: string
    ): SignInChallengeResponse {
        const responseBodyContent = this.readResponseBody<SignInTokenResponse>(
            response,
            correlationId
        );

        this.ensureTokenResponseIsValid(responseBodyContent);

        return responseBodyContent;
    }

    private static readResponseBody<
        TResponseBody extends CustomAuthApiResponseBase
    >(response: HttpResponseMessage, correlationId: string): TResponseBody {
        if (!response) {
            throw new CustomAuthApiError(
                "empty_response",
                "Response is empty",
                correlationId
            );
        }

        const responseCorrelationId = this.readResponseCorrelationId(
            response,
            correlationId
        );

        if (response.isSuccessful()) {
            let responseBody: TResponseBody;

            try {
                responseBody = JSON.parse(response.body) as TResponseBody;
            } catch (error) {
                throw new CustomAuthApiError(
                    CustomAuthApiErrorCode.INVALID_RESPONSE_BODY,
                    `Response body is empty or invalid: ${error}`,
                    responseCorrelationId
                );
            }

            responseBody.correlation_id = responseCorrelationId;

            return responseBody;
        }

        const responseError = JSON.parse(response.body) as ApiErrorResponse;

        if (!responseError) {
            throw new CustomAuthApiError(
                CustomAuthApiErrorCode.INVALID_RESPONSE_BODY,
                "Response error body is empty or invalid",
                responseCorrelationId
            );
        }

        responseError.correlation_id = !responseError.correlation_id
            ? responseCorrelationId
            : responseError.correlation_id;

        const attributes =
            !!responseError.required_attributes &&
            responseError.required_attributes.length > 0
                ? responseError.required_attributes
                : responseError.invalid_attributes ?? [];

        throw new CustomAuthApiError(
            responseError.error ?? "unknown_error",
            responseError.error_description ?? "",
            responseError.correlation_id,
            responseError.error_codes,
            responseError.suberror,
            attributes,
            responseError.continuation_token,
            responseError.trace_id
        );
    }

    private static readResponseCorrelationId(
        response: HttpResponseMessage,
        requestCorrelationId: string
    ): string {
        const correlationId = response.getHeader(
            HttpHeaderKeys.X_MS_REQUEST_ID
        );

        return !correlationId ? requestCorrelationId : correlationId;
    }

    private static ensureContinuationTokenIsValid(partialResponse: {
        continuation_token?: string;
        correlation_id?: string;
        challenge_type?: string;
    }): void {
        if (
            partialResponse.challenge_type?.toLowerCase() ===
            ChallengeType.REDIRECT
        ) {
            throw new RedirectError(partialResponse.correlation_id);
        }

        if (!partialResponse.continuation_token) {
            throw new CustomAuthApiError(
                CustomAuthApiErrorCode.CONTINUATION_TOKEN_MISSING,
                "Continuation token is missing in the response body",
                partialResponse.correlation_id
            );
        }
    }

    private static ensureChallengeTypeIsValid(
        challengeType?: string,
        correlationId?: string
    ): void {
        if (
            challengeType?.toLowerCase() !== ChallengeType.OOB &&
            challengeType?.toLowerCase() !== ChallengeType.PASSWORD
        ) {
            throw new CustomAuthApiError(
                CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE,
                `Challenge type ${challengeType} is not supported`,
                correlationId
            );
        }
    }

    private static ensureTokenResponseIsValid(
        tokenResponse: SignInTokenResponse
    ): void {
        let errorCode = "";
        let errorDescription = "";

        if (!tokenResponse.access_token) {
            errorCode = CustomAuthApiErrorCode.ACCESS_TOKEN_MISSING;
            errorDescription = "Access token is missing in the response body";
        } else if (!tokenResponse.id_token) {
            errorCode = CustomAuthApiErrorCode.ID_TOKEN_MISSING;
            errorDescription = "Id token is missing in the response body";
        } else if (!tokenResponse.refresh_token) {
            errorCode = CustomAuthApiErrorCode.REFRESH_TOKEN_MISSING;
            errorDescription = "Refresh token is missing in the response body";
        } else if (!tokenResponse.expires_in || tokenResponse.expires_in <= 0) {
            errorCode = CustomAuthApiErrorCode.INVALID_EXPIRES_IN;
            errorDescription = "Expires in is invalid in the response body";
        } else if (tokenResponse.token_type !== "Bearer") {
            errorCode = CustomAuthApiErrorCode.INVALID_TOKEN_TYPE;
            errorDescription = `Token type '${tokenResponse.token_type}' is invalid in the response body`;
        }

        throw new CustomAuthApiError(
            errorCode,
            errorDescription,
            tokenResponse.correlation_id
        );
    }
}

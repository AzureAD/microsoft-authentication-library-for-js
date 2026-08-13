/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AADServerParamKeys,
    Logger,
    ServerTelemetryManager,
} from "@azure/msal-common/browser";
import {
    DefaultPackageInfo,
    HttpHeaderKeys,
} from "../../../../CustomAuthConstants.js";
import { IHttpClient, HttpMethod } from "../../http_client/IHttpClient.js";
import { buildUrl, parseUrl } from "../../../utils/UrlUtils.js";
import { filterCustomHeaders } from "../../../utils/CustomHeaderUtils.js";
import { CustomAuthRequestInterceptor } from "../../../../configuration/CustomAuthRequestInterceptor.js";
import { V2ResponseHandler } from "./V2ResponseHandler.js";
import { CustomAuthV2ApiError } from "./error/CustomAuthV2ApiError.js";
import { V2ServerError } from "./error/V2ErrorResponses.js";
import { resolveHref } from "./V2HrefResolver.js";
import { V2SerializedResponse } from "./response/V2SerializedResponse.js";
import {
    AuthorizeChallengeEntryResponse,
    AuthorizeChallengeContinueResponse,
    V2TokenResponse,
} from "./response/V2Responses.js";
import {
    FORM_CONTENT_TYPE,
    JSON_CONTENT_TYPE,
    AUTHORIZATION_CODE_GRANT,
    HTTP_REQUEST_FAILED,
    REDIRECT_TO_WEB,
    AUTH_CODE_MISSING,
    INVALID_TOKEN_RESPONSE,
    CONTINUATION_TOKEN_MISSING,
    AUTHORIZE_CHALLENGE,
    TOKEN,
} from "./V2ApiClientConstants.js";
import {
    V2RequestContext,
    V2OAuthFormRequest,
    V2HalRequestBase,
    AuthorizeChallengeEntryRequest,
    AuthorizeChallengeContinueRequest,
    V2TokenRequest,
} from "./request/V2Requests.js";
import { AuthorizeChallengeEntryResult } from "./result/V2BaseResults.js";

/*
 * Shared V2 network client. Owns the plumbing and the three OAuth endpoints common to every V2
 * flow (authorize-challenge start/continue and token); the concrete HAL steps live in the
 * `CustomAuthV2ApiClient` subclass (per-flow `*Start` methods plus generic href-based steps) so
 * signup/sign-in can reuse this base later. It does not extend
 * the V1 BaseApiClient - the header logic is duplicated here to keep V1 untouched - because V2 uses
 * two body encodings and navigates server-provided `_links` hrefs instead of enumerated paths.
 */
export abstract class V2BaseApiClient {
    private readonly baseRequestUrl: URL;

    protected readonly handler: V2ResponseHandler;

    constructor(
        baseUrl: string,
        protected readonly clientId: string,
        private readonly httpClient: IHttpClient,
        private readonly customAuthApiQueryParams?: Record<string, string>,
        private readonly requestInterceptor?: CustomAuthRequestInterceptor,
        protected readonly logger?: Logger
    ) {
        this.baseRequestUrl = parseUrl(
            !baseUrl.endsWith("/") ? `${baseUrl}/` : baseUrl
        );
        this.handler = new V2ResponseHandler(logger);
    }

    /*
     * Step 1 (entry): POST authorize-challenge with only `client_id`. The response is a non-200
     * carrying a flat OAuth `error` string that is NOT a failure on the expected start-of-flow
     * response - success is signalled by a continuation token, so the flat error is only surfaced
     * (as the real rejection code) when the token is absent.
     */
    protected async authorizeChallengeStart(
        context: V2RequestContext
    ): Promise<AuthorizeChallengeEntryResult> {
        const request: AuthorizeChallengeEntryRequest = {
            client_id: this.clientId,
        };

        const parsedResponse =
            await this.postOAuthForm<AuthorizeChallengeEntryResponse>(
                AUTHORIZE_CHALLENGE,
                request,
                context
            );

        const { continuationToken, correlationId, error, body } =
            parsedResponse;

        /*
         * No token means a genuine server error: surface the normalized server error directly. The
         * fallback code/message only applies to a malformed response that carries neither a token
         * nor an error.
         */
        if (!continuationToken) {
            const apiError = error
                ? this.toApiError(error, correlationId)
                : new CustomAuthV2ApiError(
                      CONTINUATION_TOKEN_MISSING,
                      "Continuation token is missing in the response",
                      { correlationId }
                  );

            this.logger?.error(
                `V2 authorize-challenge entry failed: '${apiError.code}'`,
                correlationId
            );

            throw apiError;
        }

        return {
            continuationToken,
            resetPasswordHref: body.reset_password,
            signInHref: body.sign_in,
            signUpHref: body.sign_up,
        };
    }

    /*
     * Step 7 (resume): POST the authorize-challenge endpoint with the continuation token to redeem
     * the authorization code. Unlike the entry step, a flat OAuth error here IS a failure, so
     * throwOnApiError runs and throws before the missing-code guard.
     */
    protected async authorizeChallengeContinue(
        continuationToken: string,
        context: V2RequestContext
    ): Promise<string> {
        const request: AuthorizeChallengeContinueRequest = {
            continuation_token: continuationToken,
        };

        const parsedResponse =
            await this.postOAuthForm<AuthorizeChallengeContinueResponse>(
                AUTHORIZE_CHALLENGE,
                request,
                context
            );

        this.throwOnApiError(parsedResponse);

        const code = parsedResponse.body.code;

        if (!code) {
            this.logger?.error(
                "V2 authorize-challenge continue response is missing the authorization code",
                parsedResponse.correlationId
            );

            throw new CustomAuthV2ApiError(
                AUTH_CODE_MISSING,
                "Authorization code is missing in the response body",
                { correlationId: parsedResponse.correlationId }
            );
        }

        return code;
    }

    /*
     * Step 8 (token): POST the token endpoint to redeem the authorization `code` for tokens. Uses
     * the `authorization_code` grant. The response is a plain OAuth token body (not HAL); a flat
     * OAuth error is a failure and is thrown.
     */
    protected async token(
        code: string,
        scopes: string[],
        context: V2RequestContext,
        claims?: string
    ): Promise<V2TokenResponse> {
        const request: V2TokenRequest = {
            client_id: this.clientId,
            grant_type: AUTHORIZATION_CODE_GRANT,
            code,
        };

        if (scopes.length > 0) {
            request.scope = scopes.join(" ");
        }

        if (claims) {
            request.claims = claims;
        }

        const parsedResponse = await this.postOAuthForm<V2TokenResponse>(
            TOKEN,
            request,
            context
        );

        this.throwOnApiError(parsedResponse);
        this.ensureTokenResponseIsValid(
            parsedResponse.body,
            parsedResponse.correlationId
        );

        return parsedResponse.body;
    }

    /*
     * POST a form-encoded OAuth request to a fixed endpoint under the base URL. `client_id` is NOT
     * added here - only the entry and token requests carry it, so each caller includes it in `data`
     * where required (the resume request sends only `continuation_token`). Web-fallback is enforced
     * here because it can arrive on any OAuth response; the caller decides whether a flat OAuth
     * error is a failure (it is for resume/token, not for entry).
     */
    private async postOAuthForm<T>(
        endpoint: string,
        data: V2OAuthFormRequest | AuthorizeChallengeContinueRequest,
        context: V2RequestContext
    ): Promise<V2SerializedResponse<T>> {
        const formData = new URLSearchParams(
            Object.entries(data) as [string, string][]
        );
        const url = buildUrl(
            this.baseRequestUrl.href,
            endpoint,
            this.customAuthApiQueryParams
        );

        const response = await this.sendRequest(
            url,
            HttpMethod.POST,
            formData,
            FORM_CONTENT_TYPE,
            context
        );

        const parsedResponse = await this.handler.serialize<T>(
            response,
            context.correlationId
        );

        this.throwOnWebFallback(parsedResponse);

        return parsedResponse;
    }

    /*
     * Send a raw-JSON HAL request (POST or PUT) to a server-provided `_links` href. The href may be
     * absolute or host-relative, so it is resolved against the base authority first. The HAL `/api`
     * endpoints do NOT carry `client_id`. Web-fallback and nested `/api` errors are enforced here
     * so a failing HAL response never reaches the flow-specific navigation logic.
     */
    protected async sendHalRequest<T>(
        href: string,
        method: (typeof HttpMethod)[keyof typeof HttpMethod],
        body: V2HalRequestBase,
        context: V2RequestContext
    ): Promise<V2SerializedResponse<T>> {
        if (!body.continuationToken) {
            this.logger?.error(
                "V2 HAL request is missing the continuation token that threads the flow forward",
                context.correlationId
            );

            throw new CustomAuthV2ApiError(
                CONTINUATION_TOKEN_MISSING,
                "The HAL request body did not include a continuation token, so the server-driven reset flow cannot advance",
                { correlationId: context.correlationId }
            );
        }

        const url = resolveHref(this.baseRequestUrl, href);

        const response = await this.sendRequest(
            url,
            method,
            JSON.stringify(body),
            JSON_CONTENT_TYPE,
            context
        );

        const parsedResponse = await this.handler.serialize<T>(
            response,
            context.correlationId
        );

        this.throwOnWebFallback(parsedResponse);
        this.throwOnApiError(parsedResponse);

        return parsedResponse;
    }

    // Attach headers, dispatch via the http client (any verb), and wrap transport failures.
    private async sendRequest(
        url: URL,
        method: (typeof HttpMethod)[keyof typeof HttpMethod],
        body: URLSearchParams | string,
        contentType: string,
        context: V2RequestContext
    ): Promise<Response> {
        const headers = {
            ...this.getCommonHeaders(
                context.correlationId,
                context.telemetryManager,
                contentType
            ),
            ...(await this.getAdditionalHeaders(url, context.correlationId)),
        };

        try {
            return await this.httpClient.sendAsync(url, {
                method,
                body,
                headers,
            });
        } catch (e) {
            throw new CustomAuthV2ApiError(
                HTTP_REQUEST_FAILED,
                `Failed to send request to '${url}': '${e}'`,
                { correlationId: context.correlationId }
            );
        }
    }

    // Throws the normalized server error carried by the response, if any.
    protected throwOnApiError(parsedResponse: V2SerializedResponse<unknown>): void {
        if (parsedResponse.error) {
            const apiError = this.toApiError(
                parsedResponse.error,
                parsedResponse.correlationId
            );

            this.logger?.error(
                `V2 API returned an error: '${apiError.code}'`,
                parsedResponse.correlationId
            );

            throw apiError;
        }
    }

    // Builds a CustomAuthV2ApiError from the normalized server error.
    private toApiError(
        serverError: V2ServerError,
        correlationId: string
    ): CustomAuthV2ApiError {
        return new CustomAuthV2ApiError(serverError.code, serverError.message, {
            innerErrorCode: serverError.innerErrorCode,
            errorCodes: serverError.errorCodes,
            correlationId: serverError.correlationId ?? correlationId,
            traceId: serverError.traceId,
            timestamp: serverError.timestamp,
        });
    }

    // The server asked the app to finish the flow in a browser; surface it as an error to the flow.
    private throwOnWebFallback(
        parsedResponse: V2SerializedResponse<unknown>
    ): void {
        if (parsedResponse.isWebFallbackRequired) {
            throw new CustomAuthV2ApiError(
                REDIRECT_TO_WEB,
                "The server requires the flow to continue in a web browser",
                { correlationId: parsedResponse.correlationId }
            );
        }
    }

    // Minimal token-response sanity check.
    private ensureTokenResponseIsValid(
        tokenResponse: V2TokenResponse,
        correlationId: string
    ): void {
        if (!tokenResponse.access_token) {
            throw new CustomAuthV2ApiError(
                INVALID_TOKEN_RESPONSE,
                "Access token is missing in the response body",
                { correlationId }
            );
        }
    }

    // Duplicated V2 header set (kept separate from V1 BaseApiClient so V1 stays untouched).
    private getCommonHeaders(
        correlationId: string,
        telemetryManager: ServerTelemetryManager,
        contentType: string
    ): Record<string, string> {
        return {
            [HttpHeaderKeys.CONTENT_TYPE]: contentType,
            [AADServerParamKeys.X_CLIENT_SKU]: DefaultPackageInfo.SKU,
            [AADServerParamKeys.X_CLIENT_VER]: DefaultPackageInfo.VERSION,
            [AADServerParamKeys.X_CLIENT_OS]: DefaultPackageInfo.OS,
            [AADServerParamKeys.X_CLIENT_CPU]: DefaultPackageInfo.CPU,
            [AADServerParamKeys.X_CLIENT_CURR_TELEM]:
                telemetryManager.generateCurrentRequestHeaderValue(),
            [AADServerParamKeys.X_CLIENT_LAST_TELEM]:
                telemetryManager.generateLastRequestHeaderValue(),
            [AADServerParamKeys.CLIENT_REQUEST_ID]: correlationId,
        };
    }

    // Optional app-supplied headers from the request interceptor (best-effort; never fails a send).
    private async getAdditionalHeaders(
        url: URL,
        correlationId: string
    ): Promise<Record<string, string>> {
        if (!this.requestInterceptor) {
            return {};
        }

        try {
            const result = await Promise.resolve(
                this.requestInterceptor.addAdditionalHeaderFields(url)
            );

            return filterCustomHeaders(result, this.logger, correlationId);
        } catch (e) {
            this.logger?.warningPii(
                `CustomAuthRequestInterceptor.addAdditionalHeaderFields threw an error; continuing without additional headers: '${e}'`,
                correlationId
            );

            return {};
        }
    }
}


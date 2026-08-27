/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AADServerParamKeys,
    Constants,
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
import { ResponseHandlerV2 } from "./ResponseHandlerV2.js";
import { CustomAuthApiError } from "../../../error/CustomAuthApiError.js";
import { ServerErrorV2 } from "./response/ErrorResponsesV2.js";
import { resolveHrefV2 } from "./HrefResolverV2.js";
import {
    AuthorizeChallengeEntryResponseV2,
    AuthorizeChallengeContinueResponseV2,
    ParsedResponseV2,
    TokenResponseV2,
} from "./response/ResponsesV2.js";
import { JSON_CONTENT_TYPE } from "./ApiClientConstantsV2.js";
import { AUTHORIZE_CHALLENGE, SIGNIN_TOKEN } from "../CustomAuthApiEndpoint.js";
import {
    AUTH_CODE_MISSING,
    CONTINUATION_TOKEN_MISSING,
    HTTP_REQUEST_FAILED,
    INVALID_TOKEN_RESPONSE,
    REDIRECT_TO_WEB,
} from "./ErrorCodesV2.js";
import {
    RequestContextV2,
    OAuthFormRequestV2,
    ActionRequestBaseV2,
    AuthorizeChallengeEntryRequestV2,
    AuthorizeChallengeContinueRequestV2,
    TokenRequestV2,
    CompleteWithTokensRequestV2,
} from "./request/RequestsV2.js";
import { AuthorizeChallengeEntryResultV2 } from "./result/BaseResultsV2.js";

/*
 * Shared Native Auth V2 network client for OAuth and HAL requests.
 * Handles serialization, headers, error normalization, and server-provided links.
 */
export abstract class BaseApiClientV2 {
    private readonly baseRequestUrl: URL;

    protected readonly handler: ResponseHandlerV2;

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
        this.handler = new ResponseHandlerV2(logger);
    }

    /*
     * Starts authorization and returns the initial continuation token and flow links.
     */
    async authorizeChallengeStart(
        context: RequestContextV2
    ): Promise<AuthorizeChallengeEntryResultV2> {
        const request: AuthorizeChallengeEntryRequestV2 = {
            client_id: this.clientId,
        };

        const parsedResponse =
            await this.postOAuthForm<AuthorizeChallengeEntryResponseV2>(
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
                : new CustomAuthApiError(
                      CONTINUATION_TOKEN_MISSING,
                      "Continuation token is missing in the response",
                      correlationId
                  );

            this.logger?.error(
                `V2 authorize-challenge entry failed: '${apiError.error}'`,
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
     * Redeems a continuation token for an authorization code and then tokens.
     */
    async completeWithTokens(
        request: CompleteWithTokensRequestV2,
        context: RequestContextV2
    ): Promise<TokenResponseV2> {
        const code = await this.authorizeChallengeContinue(
            request.continuationToken,
            context
        );

        return this.token(code, request.scopes, context);
    }

    /*
     * Redeems a continuation token for an authorization code.
     */
    protected async authorizeChallengeContinue(
        continuationToken: string,
        context: RequestContextV2
    ): Promise<string> {
        const request: AuthorizeChallengeContinueRequestV2 = {
            continuation_token: continuationToken,
        };

        const parsedResponse =
            await this.postOAuthForm<AuthorizeChallengeContinueResponseV2>(
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

            throw new CustomAuthApiError(
                AUTH_CODE_MISSING,
                "Authorization code is missing in the response body",
                parsedResponse.correlationId
            );
        }

        return code;
    }

    /*
     * Exchanges an authorization code for tokens.
     */
    protected async token(
        code: string,
        scopes: string[],
        context: RequestContextV2
    ): Promise<TokenResponseV2> {
        const request: TokenRequestV2 = {
            client_id: this.clientId,
            grant_type: Constants.GrantType.AUTHORIZATION_CODE_GRANT,
            code,
            // Required so the server returns the client_info blob MSAL uses to build the home account id.
            client_info: "1",
        };

        if (scopes.length > 0) {
            request.scope = scopes.join(" ");
        }

        const parsedResponse = await this.postOAuthForm<TokenResponseV2>(
            SIGNIN_TOKEN,
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
     * Sends a JSON action request to a server-provided link.
     */
    protected async sendActionRequest<T>(
        href: string,
        method: (typeof HttpMethod)[keyof typeof HttpMethod],
        body: ActionRequestBaseV2,
        context: RequestContextV2
    ): Promise<ParsedResponseV2<T>> {
        if (!body.continuationToken) {
            this.logger?.error(
                "V2 HAL request is missing the continuation token that threads the flow forward",
                context.correlationId
            );

            throw new CustomAuthApiError(
                CONTINUATION_TOKEN_MISSING,
                "The HAL request body did not include a continuation token, so the server-driven reset flow cannot advance",
                context.correlationId
            );
        }

        const url = resolveHrefV2(this.baseRequestUrl, href);

        const response = await this.sendRequest(
            url,
            method,
            JSON.stringify(body),
            JSON_CONTENT_TYPE,
            context
        );

        const parsedResponse = await this.handler.parseResponse<T>(
            response,
            context.correlationId
        );

        this.throwOnWebFallback(parsedResponse);
        this.throwOnApiError(parsedResponse);

        return parsedResponse;
    }

    protected throwOnApiError(parsedResponse: ParsedResponseV2<unknown>): void {
        if (parsedResponse.error) {
            const apiError = this.toApiError(
                parsedResponse.error,
                parsedResponse.correlationId
            );

            this.logger?.error(
                `V2 API returned an error: '${apiError.error}'`,
                parsedResponse.correlationId
            );

            throw apiError;
        }
    }

    private async postOAuthForm<T>(
        endpoint: string,
        data: OAuthFormRequestV2 | AuthorizeChallengeContinueRequestV2,
        context: RequestContextV2
    ): Promise<ParsedResponseV2<T>> {
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
            Constants.URL_FORM_CONTENT_TYPE,
            context
        );

        const parsedResponse = await this.handler.parseResponse<T>(
            response,
            context.correlationId
        );

        this.throwOnWebFallback(parsedResponse);

        return parsedResponse;
    }

    private async sendRequest(
        url: URL,
        method: (typeof HttpMethod)[keyof typeof HttpMethod],
        body: URLSearchParams | string,
        contentType: string,
        context: RequestContextV2
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
            throw new CustomAuthApiError(
                HTTP_REQUEST_FAILED,
                `Failed to send request to '${url}': '${e}'`,
                context.correlationId
            );
        }
    }

    private toApiError(
        serverError: ServerErrorV2,
        correlationId: string
    ): CustomAuthApiError {
        return new CustomAuthApiError(
            serverError.code,
            serverError.message ?? "",
            serverError.correlationId ?? correlationId,
            serverError.errorCodes,
            serverError.innerErrorCode,
            undefined,
            undefined,
            serverError.traceId,
            serverError.timestamp
        );
    }

    private throwOnWebFallback(
        parsedResponse: ParsedResponseV2<unknown>
    ): void {
        if (parsedResponse.isWebFallbackRequired) {
            throw new CustomAuthApiError(
                REDIRECT_TO_WEB,
                "The server requires the flow to continue in a web browser",
                parsedResponse.correlationId
            );
        }
    }

    private ensureTokenResponseIsValid(
        tokenResponse: TokenResponseV2,
        correlationId: string
    ): void {
        if (!tokenResponse.access_token) {
            throw new CustomAuthApiError(
                INVALID_TOKEN_RESPONSE,
                "Access token is missing in the response body",
                correlationId
            );
        }
    }

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

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-common/browser";
import { HttpHeaderKeys } from "../../../../CustomAuthConstants.js";
import { CustomAuthError } from "../../../error/CustomAuthError.js";
import { normalizeServerErrorV2 } from "./response/ErrorNormalizerV2.js";
import { EmbeddedMethodV2, ParsedResponseV2 } from "./response/ResponsesV2.js";
import { ResponseStateV2 } from "./ApiClientConstantsV2.js";
import {
    CONTINUATION_TOKEN_MISSING,
    INVALID_HAL_RESPONSE,
    INVALID_RESPONSE_BODY,
    NO_AUTHENTICATION_METHODS,
    REDIRECT_TO_WEB,
} from "./ErrorCodesV2.js";

/*
 * Turns a raw HTTP response from a V2 endpoint into a typed, checked envelope, and validates HAL
 * relations. Raw-preserving: the body keeps its HAL `_links`/`_embedded` shape so the api-client
 * navigates typed hrefs directly. Parsing never throws on a non-200 status - every V2 response
 * (including the entry response) carries a meaningful body, so only a non-object body is a hard
 * failure; the wire error is normalized onto the envelope (`error`). Required response values use
 * shared guards after callers read their strongly typed response properties directly.
 */
export class ResponseHandlerV2 {
    constructor(private readonly logger?: Logger) {}

    async parseResponse<T>(
        response: Response,
        requestCorrelationId: string
    ): Promise<ParsedResponseV2<T>> {
        const correlationId =
            response.headers.get(HttpHeaderKeys.X_MS_REQUEST_ID) ??
            requestCorrelationId;

        const json = await this.parseBody(response, correlationId);

        const state = typeof json.state === "string" ? json.state : undefined;

        const continuationToken =
            (typeof json.continuationToken === "string"
                ? json.continuationToken
                : undefined) ??
            (typeof json.continuation_token === "string"
                ? json.continuation_token
                : undefined);

        const flatError =
            typeof json.error === "string" ? json.error : undefined;

        const isWebFallbackRequired =
            flatError === REDIRECT_TO_WEB ||
            state === ResponseStateV2.WEB_FALLBACK_REQUIRED;

        const error = normalizeServerErrorV2(json);

        // Surface the header correlation id on the body (HalResponseBaseV2.correlationId).
        json.correlationId = correlationId;

        return {
            statusCode: response.status,
            correlationId,
            continuationToken,
            isWebFallbackRequired,
            error,
            body: json as T,
        };
    }

    // Required href; throws when it is absent.
    requireHref(
        href: string | undefined,
        relation: string,
        correlationId: string,
        missingHrefError?: { code: string; message: string }
    ): string {
        if (!href) {
            const errorCode = missingHrefError?.code ?? INVALID_HAL_RESPONSE;
            const errorMessage =
                missingHrefError?.message ??
                `Invalid HAL response: missing '${relation}' link`;

            this.logger?.error(errorMessage, correlationId);

            throw new CustomAuthError(errorCode, errorMessage, correlationId);
        }

        return href;
    }

    // Required continuation token to advance the flow; throws when absent.
    requireContinuationToken(
        continuationToken: string | undefined,
        correlationId: string
    ): string {
        if (!continuationToken) {
            this.logger?.error(
                "V2 HAL response is missing the required continuation token",
                correlationId
            );

            throw new CustomAuthError(
                CONTINUATION_TOKEN_MISSING,
                "Continuation token is missing in the response",
                correlationId
            );
        }

        return continuationToken;
    }

    // Required embedded auth methods; throws when `_embedded.methods` is absent or empty.
    requireMethods(
        methods: EmbeddedMethodV2[] | undefined,
        correlationId: string
    ): EmbeddedMethodV2[] {
        if (!methods?.length) {
            this.logger?.error(
                "V2 HAL response is missing the required embedded authentication methods",
                correlationId
            );

            throw new CustomAuthError(
                NO_AUTHENTICATION_METHODS,
                "Invalid HAL response: no embedded authentication methods",
                correlationId
            );
        }

        return methods;
    }

    private async parseBody(
        response: Response,
        correlationId: string
    ): Promise<Record<string, unknown>> {
        let json: unknown;

        try {
            json = await response.json();
        } catch (e) {
            this.logger?.error(
                "V2 response serialization failed: body is not valid JSON",
                correlationId
            );

            throw new CustomAuthError(
                INVALID_RESPONSE_BODY,
                `V2 response body is not valid JSON: '${e}'`,
                correlationId
            );
        }

        // response.json() accepts primitives/arrays; every V2 body must be a JSON object.
        if (typeof json !== "object" || json === null || Array.isArray(json)) {
            this.logger?.error(
                "V2 response serialization failed: body is not a JSON object",
                correlationId
            );

            throw new CustomAuthError(
                INVALID_RESPONSE_BODY,
                "V2 response body is not a JSON object",
                correlationId
            );
        }

        return json as Record<string, unknown>;
    }
}

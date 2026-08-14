/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-common/browser";
import { HttpHeaderKeys } from "../../../../CustomAuthConstants.js";
import { CustomAuthV2ApiError } from "./error/CustomAuthV2ApiError.js";
import { normalizeError } from "./error/V2ErrorNormalizer.js";
import { V2SerializedResponse } from "./response/V2SerializedResponse.js";
import { HalLinks, HalResource } from "./response/HalResource.js";
import { V2EmbeddedMethod } from "./response/V2Responses.js";
import {
    REDIRECT_TO_WEB,
    INVALID_RESPONSE_BODY,
    CONTINUATION_TOKEN_MISSING,
    INVALID_HAL_RESPONSE,
    NO_AUTHENTICATION_METHODS,
    V2ResponseState,
} from "./V2ApiClientConstants.js";

/*
 * Turns a raw HTTP response from a V2 endpoint into a typed, checked envelope, and validates HAL
 * relations. Raw-preserving: the body keeps its HAL `_links`/`_embedded` shape so the api-client
 * navigates typed hrefs directly. `serialize` never throws on a non-200 status - every V2 response
 * (including the entry response) carries a meaningful body, so only a non-object body is a hard
 * failure; the wire error is normalized onto the envelope (`error`). HAL relation access
 * (`getRelationHref`/`getMethods` plus the throwing `require*` guards) is exposed as methods so
 * every caller reads them uniformly through the handler instance.
 */
export class V2ResponseHandler {
    constructor(private readonly logger?: Logger) {}

    async serialize<T>(
        response: Response,
        requestCorrelationId: string
    ): Promise<V2SerializedResponse<T>> {
        const correlationId =
            response.headers.get(HttpHeaderKeys.X_MS_REQUEST_ID) ??
            requestCorrelationId;

        const json = await this.parseBody(response, correlationId);

        const state =
            typeof json.state === "string" ? json.state : undefined;

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
            state === V2ResponseState.WEB_FALLBACK_REQUIRED;

        const error = normalizeError(json);

        // Surface the header correlation id on the body (V2HalResponseBase.correlationId).
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

    // Required next-step href; throws when the relation or its href is absent.
    requireRelationHref(
        links: HalLinks | undefined,
        relation: string,
        correlationId: string
    ): string {
        const href = this.getRelationHref(links, relation);

        if (!href) {
            this.logger?.error(
                `V2 HAL response is missing the required '${relation}' link`,
                correlationId
            );

            throw new CustomAuthV2ApiError(
                INVALID_HAL_RESPONSE,
                `Invalid HAL response: missing '${relation}' link`,
                { correlationId }
            );
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

            throw new CustomAuthV2ApiError(
                CONTINUATION_TOKEN_MISSING,
                "Continuation token is missing in the response",
                { correlationId }
            );
        }

        return continuationToken;
    }

    // First href for a relation, resolving a single link or an array (takes the first).
    getRelationHref(
        links: HalLinks | undefined,
        relation: string
    ): string | undefined {
        const link = links?.[relation];

        if (!link) {
            return undefined;
        }

        const first = Array.isArray(link) ? link[0] : link;

        return first?.href;
    }

    // The embedded auth methods (entry/challenge step); [] when absent. Handles single or array.
    getMethods(response: HalResource): V2EmbeddedMethod[] {
        const methods = response._embedded?.methods;

        if (!methods) {
            return [];
        }

        return (
            Array.isArray(methods) ? methods : [methods]
        ) as V2EmbeddedMethod[];
    }

    // Required embedded auth methods; throws when `_embedded.methods` is absent or empty.
    requireMethods(
        response: HalResource,
        correlationId: string
    ): V2EmbeddedMethod[] {
        const methods = this.getMethods(response);

        if (methods.length === 0) {
            this.logger?.error(
                "V2 HAL response is missing the required embedded authentication methods",
                correlationId
            );

            throw new CustomAuthV2ApiError(
                NO_AUTHENTICATION_METHODS,
                "Invalid HAL response: no embedded authentication methods",
                { correlationId }
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

            throw new CustomAuthV2ApiError(
                INVALID_RESPONSE_BODY,
                `V2 response body is not valid JSON: '${e}'`,
                { correlationId }
            );
        }

        // response.json() accepts primitives/arrays; every V2 body must be a JSON object.
        if (typeof json !== "object" || json === null || Array.isArray(json)) {
            this.logger?.error(
                "V2 response serialization failed: body is not a JSON object",
                correlationId
            );

            throw new CustomAuthV2ApiError(
                INVALID_RESPONSE_BODY,
                "V2 response body is not a JSON object",
                { correlationId }
            );
        }

        return json as Record<string, unknown>;
    }
}

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { HalResource } from "./HalResource.js";

/*
 * Known `state` values on a HAL response. Kept open (field typed as string) because
 * the server may introduce new values; the serializer branches on these constants.
 */
export const V2ResponseState = {
    INTERACTION_REQUIRED: "interactionRequired",
    CONTINUE: "continue",
    WEB_FALLBACK_REQUIRED: "webFallbackRequired",
} as const;

// Known `action` values that drive the next interactive step.
export const V2ResponseAction = {
    CHALLENGE: "challenge",
    VERIFY: "verify",
    UPDATE: "update",
    POLL: "poll",
} as const;

/*
 * Envelope shared by every JSON HAL response (steps 2-6). `correlationId` is not on the
 * HAL body — it is injected by the api-client from the response header (mirrors iOS, which
 * reads it via retrieveCorrelationIdFromHeaders); the rest are server body fields.
 */
export interface V2HalResponseBase extends HalResource {
    continuationToken?: string;
    state?: string;
    action?: string;
    scenario?: string;
    correlationId?: string;
}

// OAuth endpoints (steps 1/7/8) — flat error shape.
export interface V2OAuthErrorResponse {
    error?: string;
    error_description?: string;
    error_codes?: number[];
    timestamp?: string;
    trace_id?: string;
    correlation_id?: string;
    continuation_token?: string;
}

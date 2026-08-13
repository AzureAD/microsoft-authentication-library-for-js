/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { V2ServerError } from "../error/V2ErrorResponses.js";

/*
 * Envelope produced by the response handler: HTTP-level metadata computed once per response,
 * alongside the raw typed body. Consumers read the typed `body` (with its `_links` intact, per the
 * raw-preserving model) and use the envelope for cross-cutting concerns (continuation token,
 * web-fallback flag, normalized server error).
 */
export interface V2SerializedResponse<T> {
    statusCode: number;
    correlationId: string;
    continuationToken?: string;
    isWebFallbackRequired: boolean;
    error?: V2ServerError;
    body: T;
}

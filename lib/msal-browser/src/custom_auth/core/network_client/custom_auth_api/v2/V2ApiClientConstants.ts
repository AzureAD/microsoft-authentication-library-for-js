/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * Content types used by V2 requests. OAuth requests are form-encoded, while flow-start and HAL
 * `/api` requests use JSON.
 */
export const FORM_CONTENT_TYPE = "application/x-www-form-urlencoded";
export const JSON_CONTENT_TYPE = "application/json";

// Redemption grant used at the token endpoint (redeeming the authorization code).
export const AUTHORIZATION_CODE_GRANT = "authorization_code";

/*
 * HAL `_links` relation keys the flows follow to advance a server-driven V2 flow. These are the
 * object keys under `_links` (or an embedded method's `_links`), not the link `name` metadata.
 */
export const CHALLENGE_RELATION = "challenge";
export const RESEND_RELATION = "resend";
export const VERIFY_RELATION = "verify";
export const UPDATE_RELATION = "update";
export const POLL_RELATION = "poll";
export const CONTINUE_RELATION = "continue";

/*
 * Known `state` values on a HAL response. Kept open (the body field is typed as string) because
 * the server may introduce new values; the serializer/flow branch on these constants.
 */
export const V2ResponseState = {
    INTERACTION_REQUIRED: "interactionRequired",
    CONTINUE: "continue",
    WEB_FALLBACK_REQUIRED: "webFallbackRequired",
} as const;

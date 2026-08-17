/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * Content types for the two V2 body encodings. The three OAuth endpoints (authorize-challenge
 * start/continue and token) are form-encoded; the entry `start` and every HAL `/api` step are
 * raw JSON.
 */
export const FORM_CONTENT_TYPE = "application/x-www-form-urlencoded";
export const JSON_CONTENT_TYPE = "application/json";

// Redemption grant used at the token endpoint (redeeming the authorization code).
export const AUTHORIZATION_CODE_GRANT = "authorization_code";

/*
 * The only two fixed V2 endpoints. Step 1 (entry) and step 7 (resume) POST to
 * AUTHORIZE_CHALLENGE; step 8 redeems the auth code at TOKEN. Every other step
 * follows a server-provided `_links` href, so no `/api/...` paths are enumerated.
 */
export const AUTHORIZE_CHALLENGE = "/oauth2/v2.0/authorize-challenge";
export const TOKEN = "/oauth2/v2.0/token";

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

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
 * Synthetic error codes raised by the V2 client itself (never returned by the server). Centralized
 * here so the api-client and the response handlers agree on the exact string values.
 */
export const HTTP_REQUEST_FAILED = "http_request_failed";
export const REDIRECT_TO_WEB = "redirect_to_web";
export const AUTH_CODE_MISSING = "authorization_code_missing";
export const INVALID_TOKEN_RESPONSE = "invalid_token_response";
export const INVALID_RESPONSE_BODY = "invalid_response_body";
export const CONTINUATION_TOKEN_MISSING = "continuation_token_missing";
export const INVALID_HAL_RESPONSE = "invalid_hal_response";
export const RESET_PASSWORD_UNSUPPORTED = "reset_password_unsupported";
export const CONTINUATION_LINK_MISSING = "continuation_link_missing";
export const RESET_PASSWORD_TIMEOUT = "reset_password_timeout";
export const UNSUPPORTED_FLOW_STEP = "unsupported_flow_step";
export const NO_AUTHENTICATION_METHODS = "no_authentication_methods";

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

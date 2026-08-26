/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// Content type used by V2 JSON `/api` requests.
export const JSON_CONTENT_TYPE = "application/json";

// Server action returned after successful credential verification.
export const UPDATE_RELATION = "update";
export const CHALLENGE_RELATION = "challenge";
export const VERIFY_RELATION = "verify";

/*
 * Known `state` values on a HAL response. Kept open (the body field is typed as string) because
 * the server may introduce new values; response parsing and flow logic branch on these constants.
 */
export const ResponseStateV2 = {
    INTERACTION_REQUIRED: "interactionRequired",
    CONTINUE: "continue",
    WEB_FALLBACK_REQUIRED: "webFallbackRequired",
} as const;

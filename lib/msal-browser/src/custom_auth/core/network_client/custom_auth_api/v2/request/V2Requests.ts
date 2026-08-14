/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerTelemetryManager } from "@azure/msal-common/browser";

/*
 * Cross-cutting fields every V2 request carries alongside its wire body; they are NOT
 * serialized into the body. `correlationId` correlates request/response and
 * `telemetryManager` carries server telemetry. `client_id` is NOT here: it is a body field
 * on the OAuth form endpoints only (declared via `V2OAuthFormRequest`); the HAL /api
 * endpoints send JSON bodies without `client_id`.
 */
export type V2ApiRequestBase = {
    correlationId: string;
    telemetryManager: ServerTelemetryManager;
};

/*
 * Per-request context threaded through every network-layer call: `correlationId` correlates the
 * request/response pair and `telemetryManager` supplies the server-telemetry headers. Aliased to
 * the shared `V2ApiRequestBase` wire base - these fields only drive headers/correlation and are
 * never serialized into the request body.
 */
export type V2RequestContext = V2ApiRequestBase;

/*
 * Base for the V2 OAuth form-encoded (`application/x-www-form-urlencoded`) requests that carry
 * `client_id` in the body: authorize-challenge entry and token. Unlike the HAL `/api` JSON
 * endpoints, these require `client_id` declared explicitly because the V2 api-client does not
 * reuse the V1 injection layer.
 */
export interface V2OAuthFormRequest {
    client_id: string;
}

/*
 * Base for the raw-JSON HAL `/api` request bodies (steps 2-6). Every server-driven HAL step
 * carries the `continuationToken` that threads the flow forward; the per-step fields (`username`,
 * `otp`, `newPassword`) are added by the concrete request types. `sendHalRequest` accepts this
 * base so callers must pass a real HAL request DTO, without the shared base client depending on
 * any one flow's request types.
 */
export interface V2HalRequestBase {
    continuationToken: string;
}

/*
 * Entry (POST /oauth2/v2.0/authorize-challenge): the flow's front door. OAuth form-encoded
 * and carries only `client_id` (via V2OAuthFormRequest). The response
 * (`AuthorizeChallengeEntryResponse`) returns the seed `continuation_token` and the flat
 * `reset_password`/`sign_in`/`sign_up` hrefs; SSPR follows `reset_password` into step 2.
 */
export type AuthorizeChallengeEntryRequest = V2OAuthFormRequest;

/*
 * Resume (POST /oauth2/v2.0/authorize-challenge): redeem the continuation token for an
 * authorization code. OAuth form-encoded, but - unlike the entry and token requests - it sends
 * ONLY `continuation_token` and does NOT carry `client_id`.
 */
export interface AuthorizeChallengeContinueRequest {
    continuation_token: string;
}

/*
 * Step 8 token exchange (POST /oauth2/v2.0/token). Redeems the authorization `code` for
 * tokens. OAuth form-encoded, so it carries `client_id` (via V2OAuthFormRequest). `client_info`
 * is required so the server returns the `client_info` blob (base64 `{uid, utid}`) that MSAL needs
 * to build the account's home id; `claims` is an optional app-provided OAuth claims-request JSON
 * string.
 */
export interface V2TokenRequest extends V2OAuthFormRequest {
    grant_type: string;
    code: string;
    client_info: string;
    scope?: string;
    claims?: string;
}

// Step 2 start reset-password.
export interface ResetPasswordStartV2Request extends V2HalRequestBase {
    username: string;
}

// Step 3 request challenge (send OTP) / resend.
export type ChallengeV2Request = V2HalRequestBase;

// Step 4 verify: submit a single credential to `/methods/{type}/{id}/verify`.
/*
 * The credential is a distinct top-level key per method type (never overloaded onto one field):
 * email OTP sends `otp`. This is modelled as a discriminated union so the compiler enforces
 * that exactly one credential is present. Password-based verify is a future extension point:
 * add a `VerifyPasswordV2Request` member (`password: string`) and include it in the union
 * without touching the OTP member.
 */
type VerifyV2RequestBase = V2HalRequestBase;

interface VerifyOtpV2Request extends VerifyV2RequestBase {
    otp: string;
}

export type VerifyV2Request = VerifyOtpV2Request;

/*
 * Step 5 submit new password (PUT `/methods/password/{id}`). SSPR (recovery) only — this
 * update-then-poll cycle is part of the password-reset flow, not sign-in. `newPassword`
 * matches the server's HAL body key.
 */
export interface UpdatePasswordV2Request extends V2HalRequestBase {
    newPassword: string;
}

/*
 * Step 6 poll for completion (`/methods/password/{id}/pollUpdate`). SSPR (recovery) only.
 * Repeated until the reset finishes.
 */
export type PollV2Request = V2HalRequestBase;

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ApiRequestBase } from "../../types/ApiTypesBase.js";

/*
 * Per-request context threaded through every V2 network-layer call. These shared fields drive
 * headers and correlation only; they are never serialized into the V2 request body.
 */
export type V2RequestContext = ApiRequestBase;

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
 * Base for the raw-JSON HAL `/api` request bodies. Every server-driven request carries the
 * `continuationToken` that threads the flow forward; operation-specific fields (`username`, `otp`,
 * `newPassword`) are added by the concrete request types. `sendHalRequest` accepts this
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
 * `reset_password`/`sign_in`/`sign_up` hrefs.
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
 * Token exchange (POST /oauth2/v2.0/token). Redeems the authorization `code` for
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

// Start reset-password.
export interface ResetPasswordStartV2Request extends V2HalRequestBase {
    username: string;
}

// Request or resend a challenge.
export type ChallengeV2Request = V2HalRequestBase;

// Submit a single credential to `/methods/{type}/{id}/verify`.
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
 * Submit a new password (PUT `/methods/password/{id}`). SSPR (recovery) only — this
 * update-then-poll cycle is part of the password-reset flow, not sign-in. `newPassword`
 * matches the server's HAL body key.
 */
export interface UpdatePasswordV2Request extends V2HalRequestBase {
    newPassword: string;
}

/*
 * Poll for completion (`/methods/password/{id}/pollUpdate`). SSPR (recovery) only.
 * Repeated until the reset finishes.
 */
export type PollV2Request = V2HalRequestBase;

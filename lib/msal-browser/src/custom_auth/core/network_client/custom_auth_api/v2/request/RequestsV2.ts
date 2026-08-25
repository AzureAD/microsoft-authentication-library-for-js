/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ApiRequestBase } from "../../types/ApiTypesBase.js";

/*
 * Per-request context threaded through every V2 network-layer call. These shared fields drive
 * headers and correlation only; they are never serialized into the V2 request body.
 */
export type RequestContextV2 = ApiRequestBase;

/*
 * Base for the V2 OAuth form-encoded (`application/x-www-form-urlencoded`) requests that carry
 * `client_id` in the body: authorize-challenge entry and token. Unlike the HAL `/api` JSON
 * endpoints, these require `client_id` declared explicitly because the V2 api-client does not
 * reuse the V1 injection layer.
 */
export interface OAuthFormRequestV2 {
    client_id: string;
}

/*
 * Entry (POST /oauth2/v2.0/authorize-challenge): the flow's front door. OAuth form-encoded
 * and carries only `client_id` (via OAuthFormRequestV2). The response
 * (`AuthorizeChallengeEntryResponseV2`) returns the seed `continuation_token` and the flat
 * `reset_password`/`sign_in`/`sign_up` hrefs.
 */
export interface AuthorizeChallengeEntryRequestV2 extends OAuthFormRequestV2 {
    scope?: string;
}

/*
 * Resume (POST /oauth2/v2.0/authorize-challenge): redeem the continuation token for an
 * authorization code. OAuth form-encoded, but - unlike the entry and token requests - it sends
 * ONLY `continuation_token` and does NOT carry `client_id`.
 */
export interface AuthorizeChallengeContinueRequestV2 {
    continuation_token: string;
}

/*
 * Token exchange (POST /oauth2/v2.0/token). Redeems the authorization `code` for
 * tokens. OAuth form-encoded, so it carries `client_id` (via OAuthFormRequestV2). `client_info`
 * is required so the server returns the `client_info` blob (base64 `{uid, utid}`) that MSAL needs
 * to build the account's home id.
 */
export interface TokenRequestV2 extends OAuthFormRequestV2 {
    grant_type: string;
    code: string;
    client_info: string;
    scope?: string;
}

/*
 * Compound token-completion operation. The continuation is first redeemed for
 * an authorization code, which is then exchanged using the requested scopes.
 */
export interface CompleteWithTokensRequestV2 {
    continuationToken: string;
    scopes: string[];
}

/*
 * Base for raw-JSON action request bodies. Every server-driven request carries the
 * `continuationToken` that threads the flow forward; operation-specific fields (`username`, `otp`,
 * `newPassword`) are added by the concrete request types. `sendActionRequest` accepts this
 * base so callers must pass a real action request DTO, without the shared base client depending on
 * any one flow's request types.
 */
export interface ActionRequestBaseV2 {
    continuationToken: string;
}

interface StartRequestV2 extends ActionRequestBaseV2 {
    username: string;
}
export type PasswordResetStartRequestV2 = StartRequestV2;

export type SignInStartRequestV2 = StartRequestV2;

export type SignUpStartRequestV2 = ActionRequestBaseV2;

// Request or resend a challenge.
export type ChallengeRequestV2 = ActionRequestBaseV2;

// Submit a single credential to `/methods/{type}/{id}/verify`.
/*
 * The credential is a distinct top-level key per method type (never overloaded onto one field):
 * email OTP sends `otp`. This is modelled as a discriminated union so the compiler enforces
 * that exactly one credential is present. Password-based verify is a future extension point:
 * add a `VerifyPasswordRequestV2` member (`password: string`) and include it in the union
 * without touching the OTP member.
 */
type VerifyRequestBaseV2 = ActionRequestBaseV2;

interface VerifyOtpRequestV2 extends VerifyRequestBaseV2 {
    otp: string;
}

interface VerifyPasswordRequestV2 extends VerifyRequestBaseV2 {
    password: string;
}

export type VerifyRequestV2 = VerifyOtpRequestV2 | VerifyPasswordRequestV2;

/*
 * Submit a new password (PUT `/methods/password/{id}`). SSPR (recovery) only — this
 * update-then-poll cycle is part of the password-reset flow, not sign-in. `newPassword`
 * matches the server's HAL body key.
 */
export interface UpdatePasswordRequestV2 extends ActionRequestBaseV2 {
    newPassword: string;
}

/*
 * Poll for completion (`/methods/password/{id}/pollUpdate`). SSPR (recovery) only.
 * Repeated until the reset finishes.
 */
export type PollRequestV2 = ActionRequestBaseV2;

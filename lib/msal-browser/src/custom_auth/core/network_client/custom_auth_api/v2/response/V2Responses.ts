/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { V2OAuthErrorResponse } from "../error/V2ErrorResponses.js";
import {
    HalLink,
    HalLinks,
    HalEmbedded,
    HalResource,
} from "./HalResource.js";

/*
 * Envelope shared by every JSON HAL response (steps 2-6). `correlationId` is not on the HAL body -
 * it is injected by the api-client from the response header; the rest are server body fields.
 */
export interface V2HalResponseBase extends HalResource {
    continuationToken?: string;
    state?: string;
    action?: string;
    scenario?: string;
    correlationId?: string;
}

// The `challengeContext` object on the resetpassword-start response.
export interface V2ChallengeContext {
    authenticationFactor?: string;
}

/*
 * A method embedded under `_embedded.methods[]`. Extends HalResource (guaranteeing the
 * HAL shape) and narrows its `_links` to the relations we follow (challenge / verify)
 * while keeping the HAL index signature so unknown relations are preserved.
 */
export interface V2EmbeddedMethod extends HalResource {
    id?: string;
    type?: string;
    hint?: string;
    _links?: HalLinks & {
        challenge?: HalLink;
        verify?: HalLink;
    };
}

/*
 * Continue/resume (authorize-challenge): HTTP 200 returning the authorization `code`, which
 * is then redeemed at the token endpoint. Paired with `AuthorizeChallengeContinueRequest`.
 * The captured wire returns only `code`.
 */
export interface AuthorizeChallengeContinueResponse {
    code?: string;
}

/*
 * Entry (authorize-challenge) response: a non-200 whose success is signalled by the presence of
 * `continuation_token` and the flat `reset_password` href, NOT by the `error` field (a flat OAuth
 * string such as "InsufficientAuthorization"). The follow-up hrefs (`reset_password`, `sign_in`,
 * `sign_up`) are flat top-level strings rather than HAL `_links`, and SSPR follows `reset_password`.
 */
export interface AuthorizeChallengeEntryResponse extends V2OAuthErrorResponse {
    continuation_token?: string;
    reset_password?: string;
    sign_in?: string;
    sign_up?: string;
}

/*
 * Step 3 response (`/methods/{type}/{id}/challenge`). The challenge shape varies by method
 * type, so it is modelled as a discriminated union keyed on `type`:
 *
 *   - `ChallengeV2ResponseBase` holds the fields common to every challenge: the method `id`,
 *     its `type`, and the universal `verify` relation (submit the credential next).
 *   - `OtpChallengeV2Response` adds the OTP-family fields (`hint`, `codeLength` — which appears
 *     both top-level and under `payload` — and the `resend` relation). These are meaningful
 *     only for code-based methods (email/phone); a password challenge carries none of them.
 *
 * `action: verify` — next the user submits the credential. The actionable relations live at the
 * TOP-LEVEL `_links` (there is no `_embedded.methods` on this step). `self`/`curies` and
 * `_embedded.user[]` are present on the wire but never navigated, so they are left to the
 * generic HAL index signature.
 *
 * Password-based challenge is a future extension point: add a `PasswordChallengeV2Response`
 * member and widen the `ChallengeV2Response` alias, without touching the OTP member.
 */
interface ChallengeV2ResponseBase extends V2HalResponseBase {
    id?: string;
    type?: string;
    _links?: HalLinks & {
        verify?: HalLink;
    };
}

interface OtpChallengeV2Response extends ChallengeV2ResponseBase {
    hint?: string;
    codeLength?: number;
    payload?: { codeLength?: number };
    _links?: HalLinks & {
        verify?: HalLink;
        resend?: HalLink;
    };
}

export type ChallengeV2Response = OtpChallengeV2Response;

/*
 * Resetpassword start: `state: interactionRequired`, `action: challenge`. The only relation the
 * flow navigates is the per-method `challenge` href under `_embedded.methods[i]._links` (see
 * V2EmbeddedMethod), so only `_embedded.methods` is narrowed; top-level `_links` and
 * `_embedded.user[]` are informational and left to the generic HAL index signature.
 */
export interface ResetPasswordStartV2Response extends V2HalResponseBase {
    challengeContext?: V2ChallengeContext;
    _embedded?: HalEmbedded & {
        methods?: V2EmbeddedMethod[];
    };
}

/*
 * Step 4 response (email/{id}/verify — OTP accepted). The password method is returned at
 * top-level (not in `_embedded.methods`); `type === "password"` with its method `id` and an
 * empty `payload`. `action: update` — next the user submits the new password via the
 * top-level `update` relation (a PUT to `_links.update.href`, which embeds the method id).
 * `self`/`curies` are informational and `_embedded.user[]` is not navigated, so both are left
 * to the generic HAL index signature.
 */
export interface VerifyV2Response extends V2HalResponseBase {
    id?: string;
    type?: string;
    payload?: Record<string, unknown>;
    _links?: HalLinks & {
        update?: HalLink;
    };
}

/*
 * Step 5 response (PUT `/methods/password/{id}` — new password accepted). SSPR (recovery)
 * only. The password method is returned at top-level with an empty `payload`. `action: poll`
 * — the reset is being applied asynchronously; next the client polls the top-level `poll`
 * relation (its `href` targets `.../pollUpdate`) until the reset completes. `self`/`curies`
 * and `_embedded.user[]` are present on the wire but never navigated, so they are left to the
 * generic HAL index signature.
 */
export interface UpdatePasswordV2Response extends V2HalResponseBase {
    id?: string;
    type?: string;
    payload?: Record<string, unknown>;
    _links?: HalLinks & {
        poll?: HalLink;
    };
}

/*
 * Step 6 response (`/methods/password/{id}/pollUpdate`). SSPR (recovery) only. The client
 * repeats the poll until `state === "continue"`, at which point the reset has been applied and
 * the top-level `continue` relation appears — its `href` is the OAuth `authorize-challenge`
 * endpoint, bridging back to the token flow to complete the reset. `curies` and
 * `_embedded.user[]` are present on the wire but never navigated, so they are left to the
 * generic HAL index signature.
 */
export interface PollV2Response extends V2HalResponseBase {
    _links?: HalLinks & {
        continue?: HalLink;
    };
}

/*
 * Step 8 (token): flat OAuth token response. A default resource scope is appended
 * server-side even when only `openid offline_access` was requested. Fields are limited to
 * those observed on the wire: the standard OAuth token set. Error fields are intentionally
 * absent here — token errors use `V2OAuthErrorResponse`.
 */
export interface V2TokenResponse {
    token_type: string;
    expires_in: number;
    access_token: string;
    refresh_token?: string;
    scope: string;
    id_token?: string;
    client_info?: string;
    ext_expires_in?: number;
}

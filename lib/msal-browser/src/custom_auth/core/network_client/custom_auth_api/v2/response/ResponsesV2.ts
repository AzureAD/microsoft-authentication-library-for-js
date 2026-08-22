/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { OAuthErrorResponseV2, ServerErrorV2 } from "./ErrorResponsesV2.js";
import { HalLink, HalResource } from "./HalResource.js";

/*
 * Envelope shared by every JSON HAL response. `correlationId` is not on the HAL body -
 * it is injected by the api-client from the response header; the rest are server body fields.
 */
export interface HalResponseBaseV2 extends HalResource {
    challengeContext?: {
        authenticationFactor?: string;
    };
    continuationToken?: string;
    state?: string;
    action?: string;
    scenario?: string;
    correlationId?: string;
}

/*
 * A method embedded under `_embedded.methods[]`.
 */
export interface EmbeddedMethodV2 extends Omit<HalResource, "_links"> {
    id?: string;
    type?: string;
    hint?: string;
    _links?: {
        challenge?: HalLink;
    };
}

/*
 * Authorize-challenge continuation response containing the authorization code
 * that is redeemed at the token endpoint.
 */
export interface AuthorizeChallengeContinueResponseV2 {
    code?: string;
}

/*
 * Authorize-challenge entry response. Success is indicated by a continuation
 * token and flat flow hrefs rather than the HTTP status or HAL links.
 */
export interface AuthorizeChallengeEntryResponseV2
    extends OAuthErrorResponseV2 {
    continuation_token?: string;
    reset_password?: string;
    sign_in?: string;
    sign_up?: string;
}

/*
 * Challenge response for a selected authentication method. OTP responses add
 * delivery metadata and an optional resend relation to the common verify
 * relation. Additional method types can extend the response union in the
 * future.
 */
interface ChallengeResponseBaseV2 extends Omit<HalResponseBaseV2, "_links"> {
    id?: string;
    type?: string;
    _links?: {
        verify?: HalLink;
        resend?: HalLink;
    };
}

interface OtpChallengeResponseV2 extends ChallengeResponseBaseV2 {
    hint?: string;
    codeLength?: number;
    payload?: { codeLength?: number };
}

export type ChallengeResponseV2 = OtpChallengeResponseV2;

/*
 * Reset-password start response containing the available authentication
 * methods. Each method provides the challenge link used after selection.
 */
interface StartResponseV2 extends Omit<HalResponseBaseV2, "_embedded"> {
    _embedded?: {
        methods?: EmbeddedMethodV2[];
    };
}

export type PasswordResetStartResponseV2 = StartResponseV2;
export type SignInStartResponseV2 = StartResponseV2;

/*
 * Credential-verification response. For password reset, the `update` relation
 * identifies where the new password is submitted.
 */
export interface VerifyResponseV2 extends Omit<HalResponseBaseV2, "_links"> {
    id?: string;
    type?: string;
    payload?: Record<string, unknown>;
    _links?: {
        update?: HalLink;
    };
}

/*
 * Password-update response for the reset-password flow. The `poll` relation
 * identifies where the client checks for completion.
 */
export interface UpdatePasswordResponseV2
    extends Omit<HalResponseBaseV2, "_links"> {
    id?: string;
    type?: string;
    payload?: Record<string, unknown>;
    _links?: {
        poll?: HalLink;
    };
}

/*
 * Password-reset polling response. When the state becomes `continue`, the
 * `continue` relation returns the flow to authorize-challenge for token issuance.
 */
export interface PollResponseV2 extends Omit<HalResponseBaseV2, "_links"> {
    _links?: {
        continue?: HalLink;
        poll?: HalLink;
    };
}

/*
 * Flat OAuth token response containing the standard token fields observed on
 * the wire. Token errors use `OAuthErrorResponseV2`.
 */
export interface TokenResponseV2 {
    token_type: string;
    expires_in: number;
    access_token: string;
    refresh_token?: string;
    scope: string;
    id_token?: string;
    client_info?: string;
    ext_expires_in?: number;
}

/*
 * Parsed envelope produced by the response handler. It carries the typed body
 * together with normalized HTTP metadata and error information.
 */
export interface ParsedResponseV2<T> {
    statusCode: number;
    correlationId: string;
    continuationToken?: string;
    isWebFallbackRequired: boolean;
    error?: ServerErrorV2;
    body: T;
}

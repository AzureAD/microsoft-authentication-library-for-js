/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { V2OAuthErrorResponse } from "../error/V2ErrorResponses.js";
import { HalLink, HalLinks, HalEmbedded, HalResource } from "./HalResource.js";

/*
 * Envelope shared by every JSON HAL response. `correlationId` is not on the HAL body -
 * it is injected by the api-client from the response header; the rest are server body fields.
 */
export interface V2HalResponseBase extends HalResource {
    continuationToken?: string;
    state?: string;
    action?: string;
    scenario?: string;
    correlationId?: string;
}

/*
 * A method embedded under `_embedded.methods[]`. Its links are narrowed to the
 * relations used by the client while preserving unknown HAL relations.
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
 * Authorize-challenge continuation response containing the authorization code
 * that is redeemed at the token endpoint.
 */
export interface AuthorizeChallengeContinueResponse {
    code?: string;
}

/*
 * Authorize-challenge entry response. Success is indicated by a continuation
 * token and flat flow hrefs rather than the HTTP status or HAL links.
 */
export interface AuthorizeChallengeEntryResponse extends V2OAuthErrorResponse {
    continuation_token?: string;
    reset_password?: string;
    sign_in?: string;
    sign_up?: string;
}

/*
 * Challenge response for a selected authentication method. OTP responses add
 * delivery metadata and an optional resend link to the common verify relation.
 * Additional method types can extend the response union in the future.
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
 * Reset-password start response containing the available authentication
 * methods. Each method provides the challenge link used after selection.
 */
export interface ResetPasswordStartV2Response extends V2HalResponseBase {
    _embedded?: HalEmbedded & {
        methods?: V2EmbeddedMethod[];
    };
}

/*
 * Credential-verification response. For password reset, the `update` relation
 * identifies where the new password is submitted.
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
 * Password-update response for the reset-password flow. The `poll` relation
 * identifies where the client checks for completion.
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
 * Password-reset polling response. When the state becomes `continue`, the
 * `continue` relation returns the flow to authorize-challenge for token issuance.
 */
export interface PollV2Response extends V2HalResponseBase {
    _links?: HalLinks & {
        continue?: HalLink;
    };
}

/*
 * Flat OAuth token response containing the standard token fields observed on
 * the wire. Token errors use `V2OAuthErrorResponse`.
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

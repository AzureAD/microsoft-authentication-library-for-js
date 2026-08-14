/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { V2ChallengeContext } from "../response/V2Responses.js";

/*
 * Return contracts of the shared V2 base client (V2BaseApiClient), flow-agnostic and reused by
 * every V2 flow. Distinct from the per-flow result DTOs (e.g. ResetPasswordV2Results).
 */

// Result of the entry step: the seed continuation token plus the flat per-flow hrefs.
export interface AuthorizeChallengeEntryResult {
    continuationToken: string;
    resetPasswordHref?: string;
    signInHref?: string;
    signUpHref?: string;
}

/*
 * A selectable authentication method surfaced by a flow-start response, resolved from
 * `_embedded.methods[]`. `challengeHref` is the per-method `challenge` link to POST to send the
 * code to that method; `id`/`type`/`hint` are display/selection metadata.
 */
export interface V2StartMethod {
    id: string;
    type?: string;
    hint?: string;
    challengeHref: string;
}

/*
 * Result of a flow-start step (e.g. resetpassword-start / signup-start / signin-start): the token
 * to carry forward, the authentication methods the user can challenge, and the raw server
 * `scenario` wire value so the caller can stamp the flow scenario from the response. The step name
 * differs per flow but the shape is identical, so it lives on the shared base. The challenge is not
 * sent here - the caller selects a method and requests its challenge next.
 */
export interface V2StartResult {
    continuationToken: string;
    methods: V2StartMethod[];
    scenario?: string;
    challengeContext?: V2ChallengeContext;
}

/*
 * Result of a challenge step (an OTP was sent): where to submit it and how to resend, plus the OTP
 * display metadata. `channel` is the method that delivered the code (the V2 method `type`, e.g.
 * `email` - the analogue of V1's `challenge_channel`). Common to every code-based V2 flow, so it
 * lives on the shared base.
 */
export interface V2ChallengeResult {
    continuationToken: string;
    verifyHref: string;
    resendHref?: string;
    codeLength?: number;
    hint?: string;
    channel?: string;
}

/*
 * Result of a verify step (a credential was submitted), flow-agnostic so every code/credential
 * based V2 flow reuses it. The server drives what happens next, so this is a discriminated union
 * keyed on `nextAction` - the server's own next-step vocabulary (drawn from the HAL `action`
 * field, or `continue` synthesized from `state: continue` which carries no `action`):
 *   - `update`   (`action: update`, `state: interactionRequired`): a further interaction is
 *     required; SSPR submits the new password to `updateHref` next.
 *   - `continue` (`state: continue`, no `action`): nothing more interactive - redeem the
 *     continuation via authorize-challenge -> token. Produced by sign-in's verify (added when that
 *     flow lands); SSPR's verify never returns it.
 * Adding a future next action (e.g. `poll`) is a new union member, without changing verify's
 * signature.
 */
export type V2VerifyResult =
    | {
          nextAction: "update";
          continuationToken: string;
          updateHref: string;
      }
    | {
          nextAction: "continue";
          continuationToken: string;
      };


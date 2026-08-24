/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * Return contracts of the shared V2 base client (BaseApiClientV2), flow-agnostic and reused by
 * every V2 flow. Distinct from the per-flow result DTOs (e.g. ResetPasswordResultsV2).
 */

// Initial continuation token and available flow links.
export interface AuthorizeChallengeEntryResultV2 {
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
export interface StartMethodV2 {
    id: string;
    type?: string;
    hint?: string;
    challengeHref: string;
}

/*
 * Result of starting a flow. It contains the continuation token, available
 * authentication methods, and optional server scenario.
 */
export interface StartResultV2 {
    continuationToken: string;
    methods: StartMethodV2[];
    scenario?: string;
}

export type ResetPasswordStartApiResultV2 = StartResultV2;
export type SignInStartApiResultV2 = StartResultV2;

/*
 * Result of requesting a challenge. It contains the verification link and
 * optional display metadata for the selected authentication method.
 */
export interface ChallengeResultV2 {
    continuationToken: string;
    verifyHref: string;
    resendHref?: string;
    codeLength?: number;
    hint?: string;
    type?: string;
}

export const VerifyNextActionV2 = {
    UPDATE: "update",
    CONTINUE: "continue",
    CHALLENGE: "challenge",
} as const;

/*
 * Result of verifying a credential. The discriminated union identifies whether
 * another update is required or token redemption can continue.
 */
export type VerifyResultV2 =
    | {
          nextAction: typeof VerifyNextActionV2.UPDATE;
          continuationToken: string;
          updateHref: string;
      }
    | {
          nextAction: typeof VerifyNextActionV2.CONTINUE;
          continuationToken: string;
      }
    | {
          nextAction: typeof VerifyNextActionV2.CHALLENGE;
          continuationToken: string;
          methods: StartMethodV2[];
      };

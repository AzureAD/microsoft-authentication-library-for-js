/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * Return contracts of the shared V2 base client (V2BaseApiClient), flow-agnostic and reused by
 * every V2 flow. Distinct from the per-flow result DTOs (e.g. ResetPasswordV2Results).
 */

// Initial continuation token and available flow links.
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
 * Result of starting a flow. It contains the continuation token, available
 * authentication methods, and optional server scenario.
 */
export interface V2StartResult {
    continuationToken: string;
    methods: V2StartMethod[];
    scenario?: string;
}

/*
 * Result of requesting a one-time code. It contains verification links and
 * display metadata shared by code-based flows.
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
 * Result of verifying a credential. The discriminated union identifies whether
 * another update is required or token redemption can continue.
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

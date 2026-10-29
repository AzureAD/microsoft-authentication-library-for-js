/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * Return contracts of the shared V2 base client (BaseApiClientV2), flow-agnostic and reused by
 * every V2 flow. Distinct from the per-flow result DTOs (e.g. ResetPasswordResultsV2).
 */
import type { SignUpAttributeV2 } from "./SignUpResultsV2.js";
import {
    ACTIVATE_RELATION,
    CHALLENGE_RELATION,
    COLLECT_ATTRIBUTES_RELATION,
    ENROLL_RELATION,
    RISK_VERIFY_RELATION,
    UPDATE_RELATION,
    VERIFY_RELATION,
    ResponseStateV2,
} from "../ApiClientConstantsV2.js";

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

export interface EnrollmentMethodV2 {
    type: string;
    channels?: string[];
    enrollHref: string;
}

export interface EnrollmentRequiredResultV2 {
    nextAction: typeof ENROLL_RELATION;
    continuationToken: string;
    methods: EnrollmentMethodV2[];
}

export interface EnrollmentResultV2 {
    nextAction: typeof ACTIVATE_RELATION;
    continuationToken: string;
    hint?: string;
    codeLength: number;
    activateHref: string;
    resendHref?: string;
}

export interface ActivationResultV2 {
    nextAction: typeof ResponseStateV2.CONTINUE;
    continuationToken: string;
}

export const AuthenticationFactorV2 = {
    SINGLE_FACTOR: "singleFactor",
    MULTI_FACTOR: "multiFactor",
} as const;

export type AuthenticationFactorV2 =
    (typeof AuthenticationFactorV2)[keyof typeof AuthenticationFactorV2];

/*
 * Result of starting a flow. It contains the continuation token, available
 * authentication methods, authentication factor, and optional server scenario.
 */
export interface StartResultV2 {
    continuationToken: string;
    methods: StartMethodV2[];
    authenticationFactor: AuthenticationFactorV2;
    scenario?: string;
}

export type ResetPasswordStartApiResultV2 = StartResultV2;
export type SignInStartApiResultV2 = StartResultV2;

export interface ChallengeVerificationResultV2 {
    nextAction: typeof VERIFY_RELATION;
    continuationToken: string;
    verifyHref: string;
    resendHref?: string;
    codeLength?: number;
    hint?: string;
    type?: string;
}

export interface RiskVerificationRequiredResultV2 {
    nextAction: typeof RISK_VERIFY_RELATION;
    continuationToken: string;
    riskVerifyHref: string;
}

export type ChallengeResultV2 =
    | ChallengeVerificationResultV2
    | RiskVerificationRequiredResultV2;

/*
 * Result of verifying a credential. The discriminated union identifies whether
 * another update is required or token redemption can continue.
 */
export type VerifyResultV2 =
    | {
          nextAction: typeof UPDATE_RELATION;
          continuationToken: string;
          updateHref: string;
      }
    | {
          nextAction: typeof ResponseStateV2.CONTINUE;
          continuationToken: string;
      }
    | {
          nextAction: typeof CHALLENGE_RELATION;
          continuationToken: string;
          authenticationFactor: AuthenticationFactorV2;
          methods: StartMethodV2[];
      }
    | {
          nextAction: typeof COLLECT_ATTRIBUTES_RELATION;
          continuationToken: string;
          attributes: SignUpAttributeV2[];
          submitAttributesHref: string;
      }
    | EnrollmentRequiredResultV2;

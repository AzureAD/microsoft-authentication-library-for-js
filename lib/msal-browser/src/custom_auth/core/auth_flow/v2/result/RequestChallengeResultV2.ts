/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import type { RequestChallengeErrorV2 } from "../error/RequestChallengeErrorV2.js";
import type { ChallengeVerificationRequiredStateV2 } from "../state/ChallengeVerificationRequiredStateV2.js";
import type { FailedStateV2 } from "../state/FailedStateV2.js";

/**
 * The states a request-challenge action can resolve to. On success it resolves
 * to `ChallengeVerificationRequiredStateV2` once a one-time code has been sent.
 * Failures resolve to `FailedStateV2`.
 */
export type RequestChallengeResultStateV2 =
    | ChallengeVerificationRequiredStateV2
    | FailedStateV2;

/**
 * Result of requesting (or resending) a challenge. It wraps one of
 * {@link RequestChallengeResultStateV2} plus, on failure, a
 * {@link RequestChallengeErrorV2}. On success the flow moves to a
 * challenge-verification state where the delivered code can be submitted.
 */
export type RequestChallengeResultV2 = CustomAuthResultV2<
    RequestChallengeResultStateV2,
    RequestChallengeErrorV2
>;

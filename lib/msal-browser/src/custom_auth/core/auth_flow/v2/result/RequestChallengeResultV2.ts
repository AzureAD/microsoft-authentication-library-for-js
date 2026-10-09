/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import type { RequestChallengeErrorV2 } from "../error/RequestChallengeErrorV2.js";
import type { CodeRequiredStateV2 } from "../state/CodeRequiredStateV2.js";
import type { FailedStateV2 } from "../state/FailedStateV2.js";
import type { MFAVerificationRequiredStateV2 } from "../state/MFAVerificationRequiredStateV2.js";

/**
 * The states a request-challenge action can resolve to. Trusted server response
 * context determines whether primary or MFA verification is required.
 */
export type RequestChallengeResultStateV2 =
    | CodeRequiredStateV2
    | MFAVerificationRequiredStateV2
    | FailedStateV2;

/**
 * Result of requesting (or resending) a challenge. It wraps one of
 * {@link RequestChallengeResultStateV2} plus, on failure, a
 * {@link RequestChallengeErrorV2}.
 */
export type RequestChallengeResultV2 = CustomAuthResultV2<
    RequestChallengeResultStateV2,
    RequestChallengeErrorV2
>;

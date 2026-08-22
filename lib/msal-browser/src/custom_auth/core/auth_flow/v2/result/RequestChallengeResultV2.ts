/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import type { RequestChallengeErrorV2 } from "../error/RequestChallengeErrorV2.js";
import type { ChallengeVerificationRequiredStateV2 } from "../state/ChallengeVerificationRequiredStateV2.js";
import type { FailedStateV2 } from "../state/FailedStateV2.js";
import type { PasswordRequiredStateV2 } from "../../../../sign_in/auth_flow/v2/state/PasswordRequiredStateV2.js";

/**
 * The states a request-challenge action can resolve to. The selected method
 * determines whether the application must submit a one-time code or password.
 */
export type RequestChallengeResultStateV2 =
    | ChallengeVerificationRequiredStateV2
    | PasswordRequiredStateV2
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

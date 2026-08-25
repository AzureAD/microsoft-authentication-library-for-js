/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import type { VerifyChallengeErrorV2 } from "../error/VerifyChallengeErrorV2.js";
import type { NewPasswordRequiredStateV2 } from "../../../../reset_password/auth_flow/v2/state/NewPasswordRequiredStateV2.js";
import type { FailedStateV2 } from "../state/FailedStateV2.js";

/**
 * The states a verify-challenge action can resolve to. Verifying the one-time
 * code advances the flow to `NewPasswordRequiredStateV2` and does not complete
 * here, so no `CompletedStateV2` or account data is carried. Failures resolve to
 * `FailedStateV2`.
 */
export type VerifyChallengeResultStateV2 =
    | NewPasswordRequiredStateV2
    | FailedStateV2;

/**
 * Result of verifying a challenge. It wraps one of
 * {@link VerifyChallengeResultStateV2} plus, on failure, a
 * {@link VerifyChallengeErrorV2}. A successful verification advances the flow to
 * the new-password state rather than completing it.
 */
export type VerifyChallengeResultV2 = CustomAuthResultV2<
    VerifyChallengeResultStateV2,
    VerifyChallengeErrorV2
>;

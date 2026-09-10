/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import type { VerifyChallengeErrorV2 } from "../error/VerifyChallengeErrorV2.js";
import type { NewPasswordRequiredStateV2 } from "../../../../reset_password/auth_flow/v2/state/NewPasswordRequiredStateV2.js";
import type { FailedStateV2 } from "../state/FailedStateV2.js";
import type { CompletedStateV2 } from "../state/CompletedStateV2.js";
import type { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import type { AttributesRequiredStateV2 } from "../../../../sign_up/auth_flow/v2/state/AttributesRequiredStateV2.js";
import type { SignInContinuationStateV2 } from "../../../../sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";
import type { SignUpPasswordRequiredStateV2 } from "../../../../sign_up/auth_flow/v2/state/SignUpPasswordRequiredStateV2.js";

/**
 * The states a verify-challenge action can resolve to. Verifying the one-time
 * code advances password reset to `NewPasswordRequiredStateV2` or completes
 * MFA sign-in. Failures resolve to `FailedStateV2`.
 */
export type VerifyChallengeResultStateV2 =
    | NewPasswordRequiredStateV2
    | SignUpPasswordRequiredStateV2
    | AttributesRequiredStateV2
    | SignInContinuationStateV2
    | CompletedStateV2
    | FailedStateV2;

/**
 * Result of verifying a challenge. It wraps one of
 * {@link VerifyChallengeResultStateV2} plus, on failure, a
 * {@link VerifyChallengeErrorV2}.
 */
export type VerifyChallengeResultV2 = CustomAuthResultV2<
    VerifyChallengeResultStateV2,
    VerifyChallengeErrorV2,
    CustomAuthAccountData | undefined
>;

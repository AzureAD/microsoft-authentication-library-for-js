/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import type { CompletedStateV2 } from "../state/CompletedStateV2.js";
import type { FailedStateV2 } from "../state/FailedStateV2.js";
import type { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";

/**
 * The states an authentication-method verification submission can resolve to.
 * A successful submission completes the authentication flow.
 */
export type AuthMethodVerificationSubmitChallengeResultStateV2 =
    | CompletedStateV2
    | FailedStateV2;

/**
 * Result of submitting the authentication-method verification challenge. It
 * includes account data when verification and token completion succeed.
 */
export type AuthMethodVerificationSubmitChallengeResultV2 = CustomAuthResultV2<
    AuthMethodVerificationSubmitChallengeResultStateV2,
    CustomAuthAccountData
>;

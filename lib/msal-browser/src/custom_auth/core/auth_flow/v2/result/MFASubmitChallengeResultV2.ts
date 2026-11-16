/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import type { CompletedStateV2 } from "../state/CompletedStateV2.js";
import type { FailedStateV2 } from "../state/FailedStateV2.js";
import type { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import type { SignInContinuationStateV2 } from "../../../../sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";

/**
 * States returned after submitting an MFA challenge.
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export type MFASubmitChallengeResultStateV2 =
    | SignInContinuationStateV2
    | CompletedStateV2
    | FailedStateV2;

/**
 * Result of submitting an MFA challenge.
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export type MFASubmitChallengeResultV2 = CustomAuthResultV2<
    MFASubmitChallengeResultStateV2,
    CustomAuthAccountData | undefined
>;

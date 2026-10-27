/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import type { CompletedStateV2 } from "../state/CompletedStateV2.js";
import type { FailedStateV2 } from "../state/FailedStateV2.js";
import type { AuthMethodSelectionRequiredStateV2 } from "../state/AuthMethodSelectionRequiredStateV2.js";
import type { AuthMethodRegistrationRequiredStateV2 } from "../state/AuthMethodRegistrationRequiredStateV2.js";
import type { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import type { PasswordRequiredStateV2 } from "../state/PasswordRequiredStateV2.js";
import type { AttributesRequiredStateV2 } from "../../../../sign_up/auth_flow/v2/state/AttributesRequiredStateV2.js";
import type { SignInContinuationStateV2 } from "../../../../sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";

/**
 * States returned after submitting a sign-in or sign-up password. The active
 * scenario determines whether authentication completes or another step is needed.
 */
export type SubmitPasswordResultStateV2 =
    | CompletedStateV2
    | PasswordRequiredStateV2
    | AttributesRequiredStateV2
    | SignInContinuationStateV2
    | AuthMethodSelectionRequiredStateV2
    | AuthMethodRegistrationRequiredStateV2
    | FailedStateV2;

/**
 * Result of submitting a password in the active flow. Account data is available
 * when sign-in completes, while failures carry the unified flow error.
 */
export type SubmitPasswordResultV2 = CustomAuthResultV2<
    SubmitPasswordResultStateV2,
    CustomAuthAccountData | undefined
>;

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import type { FailedStateV2 } from "../../../../core/auth_flow/v2/state/FailedStateV2.js";
import type { AuthMethodRegistrationRequiredStateV2 } from "../../../../core/auth_flow/v2/state/AuthMethodRegistrationRequiredStateV2.js";
import type { SignInContinuationStateV2 } from "../../../../sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";

/**
 * The states a submit-new-password action can resolve to. Submitting the new
 * password can require method registration after the update completes.
 * Without enrollment, the flow returns a continuation for explicit sign-in.
 */
export type SubmitNewPasswordResultStateV2 =
    | SignInContinuationStateV2
    | AuthMethodRegistrationRequiredStateV2
    | FailedStateV2;

/**
 * Result of submitting a new password. It wraps one of
 * {@link SubmitNewPasswordResultStateV2} plus the unified V2 flow error on
 * failure. Enrollment, when requested, must be activated before sign-in can
 * complete; otherwise the returned continuation can be redeemed explicitly.
 */
export type SubmitNewPasswordResultV2 =
    CustomAuthResultV2<SubmitNewPasswordResultStateV2>;

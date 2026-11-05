/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import type { AuthMethodRegistrationRequiredStateV2 } from "../../../../core/auth_flow/v2/state/AuthMethodRegistrationRequiredStateV2.js";
import type { PasswordRequiredStateV2 } from "../../../../core/auth_flow/v2/state/PasswordRequiredStateV2.js";
import type { FailedStateV2 } from "../../../../core/auth_flow/v2/state/FailedStateV2.js";
import type { SignInContinuationStateV2 } from "../../../../sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";
import type { AttributesRequiredStateV2 } from "../state/AttributesRequiredStateV2.js";

/**
 * States returned after submitting sign-up attributes. The flow can request
 * more attributes or a password, require enrollment, or offer sign-in continuation.
 */
export type SubmitAttributesResultStateV2 =
    | AttributesRequiredStateV2
    | PasswordRequiredStateV2
    | SignInContinuationStateV2
    | AuthMethodRegistrationRequiredStateV2
    | FailedStateV2;

/**
 * Result of submitting sign-up attributes. It identifies the next step or a
 * failure without automatically signing the account in or returning account data.
 */
export type SubmitAttributesResultV2 = CustomAuthResultV2<
    SubmitAttributesResultStateV2,
    undefined
>;

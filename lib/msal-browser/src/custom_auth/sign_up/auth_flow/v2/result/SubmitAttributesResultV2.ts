/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import type { AuthMethodRegistrationRequiredStateV2 } from "../../../../core/auth_flow/v2/state/AuthMethodRegistrationRequiredStateV2.js";
import type { CodeRequiredStateV2 } from "../../../../core/auth_flow/v2/state/CodeRequiredStateV2.js";
import type { FailedStateV2 } from "../../../../core/auth_flow/v2/state/FailedStateV2.js";
import type { SignInContinuationStateV2 } from "../../../../sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";

/**
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export type SubmitAttributesResultStateV2 =
    | CodeRequiredStateV2
    | SignInContinuationStateV2
    | AuthMethodRegistrationRequiredStateV2
    | FailedStateV2;

/**
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export type SubmitAttributesResultV2 =
    CustomAuthResultV2<SubmitAttributesResultStateV2>;

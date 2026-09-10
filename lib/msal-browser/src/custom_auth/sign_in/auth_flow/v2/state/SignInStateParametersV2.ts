/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { CustomAuthActionRequiredStateParametersV2 } from "../../../../core/auth_flow/v2/state/CustomAuthStateParametersV2.js";
import type { SignInStateTransitionHandlerV2 } from "./SignInStateTransitionHandlerV2.js";

export interface SignInActionRequiredStateParametersV2
    extends CustomAuthActionRequiredStateParametersV2 {
    signInStateTransitionHandler: SignInStateTransitionHandlerV2;
}

export type SignInContinuationStateParametersV2 =
    CustomAuthActionRequiredStateParametersV2;

export type PasswordRequiredStateParametersV2 =
    SignInActionRequiredStateParametersV2;

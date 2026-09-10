/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import type { ChallengeVerificationRequiredStateV2 } from "../../../../core/auth_flow/v2/state/ChallengeVerificationRequiredStateV2.js";
import type { FailedStateV2 } from "../../../../core/auth_flow/v2/state/FailedStateV2.js";
import type { SignInContinuationStateV2 } from "../../../../sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";
import type { SubmitAttributesErrorV2 } from "../error_type/SubmitAttributesErrorV2.js";

export type SubmitAttributesResultStateV2 =
    | ChallengeVerificationRequiredStateV2
    | SignInContinuationStateV2
    | FailedStateV2;

export type SubmitAttributesResultV2 = CustomAuthResultV2<
    SubmitAttributesResultStateV2,
    SubmitAttributesErrorV2
>;

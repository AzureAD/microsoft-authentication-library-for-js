/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import type { ChallengeVerificationRequiredStateV2 } from "../../../../core/auth_flow/v2/state/ChallengeVerificationRequiredStateV2.js";
import type { FailedStateV2 } from "../../../../core/auth_flow/v2/state/FailedStateV2.js";
import type { SignUpStartErrorV2 } from "../error_type/SignUpStartErrorV2.js";
import type { AttributesRequiredStateV2 } from "../state/AttributesRequiredStateV2.js";
import type { SignUpPasswordRequiredStateV2 } from "../state/SignUpPasswordRequiredStateV2.js";

/**
 * States returned when native auth V2 sign-up starts.
 */
export type SignUpStartResultStateV2 =
    | ChallengeVerificationRequiredStateV2
    | SignUpPasswordRequiredStateV2
    | AttributesRequiredStateV2
    | FailedStateV2;

/**
 * Result of starting native auth V2 sign-up.
 */
export type SignUpStartResultV2 = CustomAuthResultV2<
    SignUpStartResultStateV2,
    SignUpStartErrorV2
>;

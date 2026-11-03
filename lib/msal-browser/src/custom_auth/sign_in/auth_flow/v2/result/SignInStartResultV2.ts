/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import type { FailedStateV2 } from "../../../../core/auth_flow/v2/state/FailedStateV2.js";
import type { PasswordRequiredStateV2 } from "../state/PasswordRequiredStateV2.js";
import type { AuthMethodSelectionRequiredStateV2 } from "../../../../core/auth_flow/v2/state/AuthMethodSelectionRequiredStateV2.js";
import type { CodeRequiredStateV2 } from "../../../../core/auth_flow/v2/state/CodeRequiredStateV2.js";

/**
 * States returned when native auth V2 sign-in starts. Supply the requested
 * credential or select an offered authentication method to continue.
 */
export type SignInStartResultStateV2 =
    | PasswordRequiredStateV2
    | CodeRequiredStateV2
    | AuthMethodSelectionRequiredStateV2
    | FailedStateV2;

/**
 * Result of starting native auth V2 sign-in. Account data is available only
 * after completing a subsequent authentication step.
 */
export type SignInStartResultV2 = CustomAuthResultV2<
    SignInStartResultStateV2,
    undefined
>;

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import type { CodeRequiredStateV2 } from "../../../../core/auth_flow/v2/state/CodeRequiredStateV2.js";
import type { FailedStateV2 } from "../../../../core/auth_flow/v2/state/FailedStateV2.js";

/**
 * States returned when native auth V2 sign-up starts. A successful start requires the user to verify the email code.
 */
export type SignUpStartResultStateV2 = CodeRequiredStateV2 | FailedStateV2;

/**
 * Result of starting native auth V2 sign-up. Inspect the state to submit the verification code or handle an error.
 */
export type SignUpStartResultV2 = CustomAuthResultV2<SignUpStartResultStateV2>;

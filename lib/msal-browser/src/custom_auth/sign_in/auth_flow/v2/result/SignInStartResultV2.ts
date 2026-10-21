/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import type { FailedStateV2 } from "../../../../core/auth_flow/v2/state/FailedStateV2.js";
import type { CompletedStateV2 } from "../../../../core/auth_flow/v2/state/CompletedStateV2.js";
import type { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import type { PasswordRequiredStateV2 } from "../state/PasswordRequiredStateV2.js";
import type { AuthMethodSelectionRequiredStateV2 } from "../../../../core/auth_flow/v2/state/AuthMethodSelectionRequiredStateV2.js";
import type { CodeRequiredStateV2 } from "../../../../core/auth_flow/v2/state/CodeRequiredStateV2.js";

/**
 * States returned when native auth V2 sign-in starts.
 */
export type SignInStartResultStateV2 =
    | PasswordRequiredStateV2
    | CodeRequiredStateV2
    | AuthMethodSelectionRequiredStateV2
    | CompletedStateV2
    | FailedStateV2;

/**
 * Result of starting native auth V2 sign-in.
 */
export type SignInStartResultV2 = CustomAuthResultV2<
    SignInStartResultStateV2,
    CustomAuthAccountData | undefined
>;

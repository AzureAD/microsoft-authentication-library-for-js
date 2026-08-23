/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import type { FailedStateV2 } from "../../../../core/auth_flow/v2/state/FailedStateV2.js";
import type { CompletedStateV2 } from "../../../../core/auth_flow/v2/state/CompletedStateV2.js";
import type { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import type { SignInStartErrorV2 } from "../error_type/SignInStartErrorV2.js";
import type { PasswordRequiredStateV2 } from "../state/PasswordRequiredStateV2.js";
import type { MFARequiredStateV2 } from "../../../../core/auth_flow/v2/state/MFARequiredStateV2.js";

/**
 * States returned when native auth V2 sign-in starts.
 */
export type SignInStartResultStateV2 =
    | PasswordRequiredStateV2
    | MFARequiredStateV2
    | CompletedStateV2
    | FailedStateV2;

/**
 * Result of starting native auth V2 sign-in.
 */
export type SignInStartResultV2 = CustomAuthResultV2<
    SignInStartResultStateV2,
    SignInStartErrorV2,
    CustomAuthAccountData | undefined
>;

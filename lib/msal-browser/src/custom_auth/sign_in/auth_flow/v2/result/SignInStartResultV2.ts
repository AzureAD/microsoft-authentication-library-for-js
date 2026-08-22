/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import type { FailedStateV2 } from "../../../../core/auth_flow/v2/state/FailedStateV2.js";
import type { AuthenticationMethodSelectionRequiredStateV2 } from "../../../../core/auth_flow/v2/state/AuthenticationMethodSelectionRequiredStateV2.js";
import type { SignInStartErrorV2 } from "../error_type/SignInStartErrorV2.js";

/**
 * States returned when native auth V2 sign-in starts.
 */
export type SignInStartResultStateV2 =
    | AuthenticationMethodSelectionRequiredStateV2
    | FailedStateV2;

/**
 * Result of starting native auth V2 sign-in.
 */
export type SignInStartResultV2 = CustomAuthResultV2<
    SignInStartResultStateV2,
    SignInStartErrorV2
>;

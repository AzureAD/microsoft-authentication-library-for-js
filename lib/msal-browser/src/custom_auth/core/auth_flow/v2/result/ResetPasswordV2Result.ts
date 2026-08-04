/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2Result } from "../../CustomAuthV2Result.js";
import type { CustomAuthV2Error } from "../error/CustomAuthV2Error.js";
import type { AuthenticationMethodSelectionRequiredState } from "../state/AuthenticationMethodSelectionRequiredState.js";
import type { FailedState } from "../state/FailedState.js";
import type { WebFallbackRequiredState } from "../state/WebFallbackRequiredState.js";

/**
 * The states a reset-password (V2) entry operation can resolve to.
 */
export type ResetPasswordV2ResultState =
    | AuthenticationMethodSelectionRequiredState
    | FailedState
    | WebFallbackRequiredState;

/**
 * Result of starting a native auth V2 reset-password operation.
 */
export type ResetPasswordV2Result = CustomAuthV2Result<
    ResetPasswordV2ResultState,
    CustomAuthV2Error
>;

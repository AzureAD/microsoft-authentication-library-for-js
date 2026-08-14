/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2Result } from "../../CustomAuthV2Result.js";
import type { ResetPasswordStartError } from "../error/ResetPasswordStartError.js";
import type { AuthenticationMethodSelectionRequiredState } from "../state/AuthenticationMethodSelectionRequiredState.js";
import type { FailedState } from "../state/FailedState.js";

/**
 * The states a reset-password (V2) entry operation can resolve to. On success
 * the server drives the flow to `AuthenticationMethodSelectionRequiredState`;
 * `FailedState` carries a terminal error.
 */
export type ResetPasswordStartV2ResultState =
    | AuthenticationMethodSelectionRequiredState
    | FailedState;

/**
 * Result of starting a native auth V2 reset-password operation. It is returned
 * by `resetPasswordV2` and wraps one of {@link ResetPasswordStartV2ResultState}
 * plus, on failure, a {@link ResetPasswordStartError}. Inspect its state to
 * decide the next step in the flow.
 */
export type ResetPasswordStartV2Result = CustomAuthV2Result<
    ResetPasswordStartV2ResultState,
    ResetPasswordStartError
>;

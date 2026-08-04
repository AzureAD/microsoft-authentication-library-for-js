/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2Result } from "../../CustomAuthV2Result.js";
import type { CustomAuthV2Error } from "../error/CustomAuthV2Error.js";
import type { CompletedState } from "../state/CompletedState.js";
import type { FailedState } from "../state/FailedState.js";

/**
 * The states a submit-new-password action can resolve to.
 */
export type SubmitNewPasswordResultState = CompletedState | FailedState;

/**
 * Result of submitting a new password.
 */
export type SubmitNewPasswordResult = CustomAuthV2Result<
    SubmitNewPasswordResultState,
    CustomAuthV2Error
>;

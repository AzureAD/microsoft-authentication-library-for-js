/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2Result } from "../../CustomAuthV2Result.js";
import type { SubmitNewPasswordError } from "../error/SubmitNewPasswordError.js";
import type { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import type { CompletedState } from "../state/CompletedState.js";
import type { FailedState } from "../state/FailedState.js";
import type { WebFallbackRequiredState } from "../state/WebFallbackRequiredState.js";

/**
 * The states a submit-new-password action can resolve to.
 */
export type SubmitNewPasswordResultState =
    | CompletedState
    | FailedState
    | WebFallbackRequiredState;

/**
 * Result of submitting a new password.
 */
export type SubmitNewPasswordResult = CustomAuthV2Result<
    SubmitNewPasswordResultState,
    SubmitNewPasswordError,
    CustomAuthAccountData
>;

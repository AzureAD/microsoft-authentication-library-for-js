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
 * The states a submit-new-password action can resolve to. Submitting the new
 * password redeems the flow and the SDK internally exchanges the verified
 * continuation for tokens, so the terminal `CompletedState` carries
 * `CustomAuthAccountData`. `CompletedState` and the account payload are declared
 * together because they always occur together.
 */
export type SubmitNewPasswordResultState =
    | CompletedState
    | FailedState
    | WebFallbackRequiredState;

/**
 * Result of submitting a new password. It wraps one of
 * {@link SubmitNewPasswordResultState} plus, on failure, a
 * {@link SubmitNewPasswordError}, and on success carries the signed-in account
 * data. This is the flow's completion point, so a successful result reaches
 * `CompletedState`.
 */
export type SubmitNewPasswordResult = CustomAuthV2Result<
    SubmitNewPasswordResultState,
    SubmitNewPasswordError,
    CustomAuthAccountData
>;

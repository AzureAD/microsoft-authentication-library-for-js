/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2Result } from "../../CustomAuthV2Result.js";
import type { SignInAfterResetPasswordError } from "../error/SignInAfterResetPasswordError.js";
import type { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import type { CompletedState } from "../state/CompletedState.js";
import type { FailedState } from "../state/FailedState.js";

/**
 * The states a sign-in-after-reset-password action can resolve to. Signing in
 * redeems the reset-flow continuation for tokens, so the terminal
 * `CompletedState` carries `CustomAuthAccountData`. `CompletedState` and the
 * account payload are declared together because they always occur together.
 */
export type SignInAfterResetPasswordResultState =
    | CompletedState
    | FailedState;

/**
 * Result of signing the user in after a password reset. It wraps one of
 * {@link SignInAfterResetPasswordResultState} plus, on failure, a
 * {@link SignInAfterResetPasswordError}, and on success carries the signed-in
 * account data. This is the flow's completion point, so a successful result
 * reaches `CompletedState`.
 */
export type SignInAfterResetPasswordResult = CustomAuthV2Result<
    SignInAfterResetPasswordResultState,
    SignInAfterResetPasswordError,
    CustomAuthAccountData
>;

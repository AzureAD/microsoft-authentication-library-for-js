/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2Result } from "../../CustomAuthV2Result.js";
import type { SubmitNewPasswordError } from "../error/SubmitNewPasswordError.js";
import type { SignInAfterResetPasswordState } from "../state/SignInAfterResetPasswordState.js";
import type { FailedState } from "../state/FailedState.js";
import type { WebFallbackRequiredState } from "../state/WebFallbackRequiredState.js";

/**
 * The states a submit-new-password action can resolve to. Submitting the new
 * password completes the reset; the flow does not sign the user in
 * automatically, so on success it surfaces `SignInAfterResetPasswordState`
 * (carrying the reset continuation) rather than the terminal `CompletedState`.
 * The app then calls its `signIn` to obtain tokens. `WebFallbackRequiredState`
 * is included because the server can signal a browser hand-off on any response.
 */
export type SubmitNewPasswordResultState =
    | SignInAfterResetPasswordState
    | FailedState
    | WebFallbackRequiredState;

/**
 * Result of submitting a new password. It wraps one of
 * {@link SubmitNewPasswordResultState} plus, on failure, a
 * {@link SubmitNewPasswordError}. Submitting completes the reset but does not
 * sign the user in, so a successful result reaches
 * `SignInAfterResetPasswordState` and carries no account data; the account is
 * surfaced by the subsequent sign-in.
 */
export type SubmitNewPasswordResult = CustomAuthV2Result<
    SubmitNewPasswordResultState,
    SubmitNewPasswordError
>;

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import type { SubmitNewPasswordErrorV2 } from "../error/SubmitNewPasswordErrorV2.js";
import type { SignInContinuationStateV2 } from "../state/SignInContinuationStateV2.js";
import type { FailedStateV2 } from "../state/FailedStateV2.js";

/**
 * The states a submit-new-password action can resolve to. Submitting the new
 * password completes the reset; the flow does not sign the user in
 * automatically, so on success it surfaces `SignInContinuationStateV2`
 * (carrying the reset continuation) rather than the terminal `CompletedStateV2`.
 * The app then calls its `signIn` to obtain tokens.
 */
export type SubmitNewPasswordResultStateV2 =
    | SignInContinuationStateV2
    | FailedStateV2;

/**
 * Result of submitting a new password. It wraps one of
 * {@link SubmitNewPasswordResultStateV2} plus, on failure, a
 * {@link SubmitNewPasswordErrorV2}. Submitting completes the reset but does not
 * sign the user in, so a successful result reaches
 * `SignInContinuationStateV2` and carries no account data; the account is
 * surfaced by the subsequent sign-in.
 */
export type SubmitNewPasswordResultV2 = CustomAuthResultV2<
    SubmitNewPasswordResultStateV2,
    SubmitNewPasswordErrorV2
>;

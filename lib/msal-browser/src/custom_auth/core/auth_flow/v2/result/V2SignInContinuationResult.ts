/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2Result } from "../CustomAuthV2Result.js";
import type { V2SignInContinuationError } from "../error/V2SignInContinuationError.js";
import type { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import type { CompletedState } from "../state/CompletedState.js";
import type { FailedState } from "../state/FailedState.js";

/**
 * The states a V2 continuation sign-in can resolve to. Signing in redeems the
 * flow continuation for tokens, so the terminal
 * `CompletedState` carries `CustomAuthAccountData`. `CompletedState` and the
 * account payload are declared together because they always occur together.
 */
export type V2SignInContinuationResultState = CompletedState | FailedState;

/**
 * Result of signing the user in from a V2 continuation. It wraps one of
 * {@link V2SignInContinuationResultState} plus, on failure, a
 * {@link V2SignInContinuationError}, and on success carries the signed-in
 * account data. This is the flow's completion point, so a successful result
 * reaches `CompletedState`.
 */
export type V2SignInContinuationResult = CustomAuthV2Result<
    V2SignInContinuationResultState,
    V2SignInContinuationError,
    CustomAuthAccountData
>;

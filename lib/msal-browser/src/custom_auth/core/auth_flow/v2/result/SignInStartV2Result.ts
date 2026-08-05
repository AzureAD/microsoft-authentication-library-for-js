/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2Result } from "../../CustomAuthV2Result.js";
import type { SignInStartError } from "../error/SignInStartError.js";
import type { FailedState } from "../state/FailedState.js";
import type { WebFallbackRequiredState } from "../state/WebFallbackRequiredState.js";

/**
 * The states a sign-in (V2) operation can resolve to.
 *
 * Minimal placeholder union for the not-yet-implemented signInV2 flow; the full
 * union (password/code-required credential states) is defined when sign-in V2
 * lands. In V2 a sign-in never completes at the start step (the server drives to
 * a credential step; completion happens when that credential is submitted), so
 * `CompletedState` is not part of this entry union. `WebFallbackRequiredState`
 * is included because the server can return the `redirect_to_web` /
 * `webFallbackRequired` signal on any response, including this start call.
 */
export type SignInStartV2ResultState = FailedState | WebFallbackRequiredState;

/**
 * Result of a native auth V2 sign-in operation.
 *
 * Account data is not carried here: sign-in V2 does not complete at the start
 * step, and the shared verify action performs a further authorize-challenge
 * before completion. The terminal completing result surfaces the account.
 */
export type SignInStartV2Result = CustomAuthV2Result<
    SignInStartV2ResultState,
    SignInStartError
>;

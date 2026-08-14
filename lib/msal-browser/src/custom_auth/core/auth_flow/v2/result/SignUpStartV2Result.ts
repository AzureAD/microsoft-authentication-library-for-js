/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2Result } from "../../CustomAuthV2Result.js";
import type { SignUpStartError } from "../error/SignUpStartError.js";
import type { FailedState } from "../state/FailedState.js";
import type { WebFallbackRequiredState } from "../state/WebFallbackRequiredState.js";

/**
 * The states a sign-up (V2) operation can resolve to.
 *
 * Minimal placeholder union for the not-yet-implemented signUpV2 flow; the full
 * union (code/attributes-required credential states) is defined when sign-up V2
 * lands. In V2 a sign-up never completes at the start step (the server drives to
 * a credential step), so `CompletedState` is not part of this entry union.
 * `WebFallbackRequiredState` is included because the server can return the
 * `redirect_to_web` / `webFallbackRequired` signal on any response, including
 * this start call.
 */
export type SignUpStartV2ResultState = FailedState | WebFallbackRequiredState;

/**
 * Result of a native auth V2 sign-up operation.
 */
export type SignUpStartV2Result = CustomAuthV2Result<
    SignUpStartV2ResultState,
    SignUpStartError
>;

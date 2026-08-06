/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2Result } from "../../CustomAuthV2Result.js";
import type { VerifyChallengeError } from "../error/VerifyChallengeError.js";
import type { NewPasswordRequiredState } from "../state/NewPasswordRequiredState.js";
import type { FailedState } from "../state/FailedState.js";
import type { WebFallbackRequiredState } from "../state/WebFallbackRequiredState.js";

/**
 * The states a verify-challenge action can resolve to. Verifying the one-time
 * code advances the flow to `NewPasswordRequiredState` and does not complete
 * here, so no `CompletedState` or account data is carried. Failures resolve to
 * `FailedState`, and a browser hand-off resolves to `WebFallbackRequiredState`.
 */
export type VerifyChallengeResultState =
    | NewPasswordRequiredState
    | FailedState
    | WebFallbackRequiredState;

/**
 * Result of verifying a challenge. It wraps one of
 * {@link VerifyChallengeResultState} plus, on failure, a
 * {@link VerifyChallengeError}. A successful verification advances the flow to
 * the new-password state rather than completing it.
 */
export type VerifyChallengeResult = CustomAuthV2Result<
    VerifyChallengeResultState,
    VerifyChallengeError
>;

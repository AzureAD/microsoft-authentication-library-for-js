/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2Result } from "../CustomAuthV2Result.js";
import type { RequestChallengeError } from "../error/RequestChallengeError.js";
import type { ChallengeVerificationRequiredState } from "../state/ChallengeVerificationRequiredState.js";
import type { FailedState } from "../state/FailedState.js";

/**
 * The states a request-challenge action can resolve to. On success it resolves
 * to `ChallengeVerificationRequiredState` once a one-time code has been sent.
 * Failures resolve to `FailedState`.
 */
export type RequestChallengeResultState =
    | ChallengeVerificationRequiredState
    | FailedState;

/**
 * Result of requesting (or resending) a challenge. It wraps one of
 * {@link RequestChallengeResultState} plus, on failure, a
 * {@link RequestChallengeError}. On success the flow moves to a
 * challenge-verification state where the delivered code can be submitted.
 */
export type RequestChallengeResult = CustomAuthV2Result<
    RequestChallengeResultState,
    RequestChallengeError
>;

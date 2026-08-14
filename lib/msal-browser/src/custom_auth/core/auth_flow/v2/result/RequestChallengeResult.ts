/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2Result } from "../../CustomAuthV2Result.js";
import type { RequestChallengeError } from "../error/RequestChallengeError.js";
import type { ChallengeVerificationRequiredState } from "../state/ChallengeVerificationRequiredState.js";
import type { PasswordRequiredState } from "../state/PasswordRequiredState.js";
import type { FailedState } from "../state/FailedState.js";
import type { WebFallbackRequiredState } from "../state/WebFallbackRequiredState.js";

/**
 * The states a request-challenge action can resolve to.
 */
export type RequestChallengeResultState =
    | ChallengeVerificationRequiredState
    | PasswordRequiredState
    | FailedState
    | WebFallbackRequiredState;

/**
 * Result of requesting (or resending) a challenge.
 */
export type RequestChallengeResult = CustomAuthV2Result<
    RequestChallengeResultState,
    RequestChallengeError
>;

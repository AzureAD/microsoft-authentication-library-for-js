/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2Result } from "../../CustomAuthV2Result.js";
import type { CustomAuthV2Error } from "../error/CustomAuthV2Error.js";
import type { CompletedState } from "../state/CompletedState.js";
import type { FailedState } from "../state/FailedState.js";
import type { AuthenticationMethodSelectionRequiredState } from "../state/AuthenticationMethodSelectionRequiredState.js";
import type { PasswordRequiredState } from "../state/PasswordRequiredState.js";
import type { NewPasswordRequiredState } from "../state/NewPasswordRequiredState.js";
import type { AttributesRequiredState } from "../state/AttributesRequiredState.js";
import type { AuthenticationMethodRegistrationRequiredState } from "../state/AuthenticationMethodRegistrationRequiredState.js";
import type { WebFallbackRequiredState } from "../state/WebFallbackRequiredState.js";

/**
 * The states a verify-challenge action can resolve to.
 */
export type VerifyChallengeResultState =
    | CompletedState
    | FailedState
    | AuthenticationMethodSelectionRequiredState
    | PasswordRequiredState
    | NewPasswordRequiredState
    | AttributesRequiredState
    | AuthenticationMethodRegistrationRequiredState
    | WebFallbackRequiredState;

/**
 * Result of verifying a challenge.
 */
export type VerifyChallengeResult = CustomAuthV2Result<
    VerifyChallengeResultState,
    CustomAuthV2Error
>;

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2Result } from "../../CustomAuthV2Result.js";
import type { VerifyChallengeError } from "../error/VerifyChallengeError.js";
import type { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
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
 *
 * `VerifyChallenge` is the shared credential-verification (submit-code) action.
 * In SSPR it resolves to `NewPasswordRequiredState` (never completes here). In
 * sign-in-with-code it is the completion point: the SDK internally redeems the
 * verified continuation via authorize-challenge → token, so this result carries
 * `CustomAuthAccountData` on the terminal `CompletedState`. `CompletedState` and
 * the account payload are declared together because they always occur together.
 */
export type VerifyChallengeResult = CustomAuthV2Result<
    VerifyChallengeResultState,
    VerifyChallengeError,
    CustomAuthAccountData
>;

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2Result } from "../../CustomAuthV2Result.js";
import type { CustomAuthV2Error } from "../error/CustomAuthV2Error.js";
import type { CompletedState } from "../state/CompletedState.js";
import type { FailedState } from "../state/FailedState.js";

/**
 * The states a sign-up (V2) operation can resolve to.
 *
 * Minimal placeholder union for the not-yet-implemented signUpV2 flow; the full
 * union is defined when sign-up V2 lands.
 */
export type SignUpV2ResultState = CompletedState | FailedState;

/**
 * Result of a native auth V2 sign-up operation.
 */
export type SignUpV2Result = CustomAuthV2Result<
    SignUpV2ResultState,
    CustomAuthV2Error
>;

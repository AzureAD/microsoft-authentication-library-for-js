/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2Result } from "../../CustomAuthV2Result.js";
import type { AuthFlowErrorV2Base } from "../error/AuthFlowErrorV2Base.js";
import type { FailedState } from "../state/FailedState.js";
import type { WebFallbackRequiredState } from "../state/WebFallbackRequiredState.js";

/**
 * The states a sign-up (V2) operation can resolve to. This is a minimal
 * placeholder union for the not-yet-implemented sign-up V2 flow; its
 * credential-required success states and `CompletedState` are added when that
 * flow lands. `WebFallbackRequiredState` is included because the server can
 * signal a browser hand-off on any response, including the start call.
 */
export type SignUpStartV2ResultState = FailedState | WebFallbackRequiredState;

/**
 * Result of a native auth V2 sign-up operation. It is a placeholder for the
 * not-yet-implemented sign-up flow; the full completing shape (account data on
 * completion) lands when sign-up V2 is built. For now it only carries the
 * placeholder states and the abstract V2 error type.
 */
export type SignUpStartV2Result = CustomAuthV2Result<
    SignUpStartV2ResultState,
    AuthFlowErrorV2Base
>;

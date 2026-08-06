/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2Result } from "../../CustomAuthV2Result.js";
import type { AuthFlowErrorV2Base } from "../error/AuthFlowErrorV2Base.js";
import type { FailedState } from "../state/FailedState.js";
import type { WebFallbackRequiredState } from "../state/WebFallbackRequiredState.js";

/**
 * The states a sign-in (V2) operation can resolve to. This is a minimal
 * placeholder union for the not-yet-implemented sign-in V2 flow; its
 * credential-required success states and `CompletedState` are added when that
 * flow lands. `WebFallbackRequiredState` is included because the server can
 * signal a browser hand-off on any response, including the start call.
 */
export type SignInStartV2ResultState = FailedState | WebFallbackRequiredState;

/**
 * Result of a native auth V2 sign-in operation. It is a placeholder for the
 * not-yet-implemented sign-in flow and carries no account data, since sign-in
 * does not complete at the start step. The terminal completing result surfaces
 * the account once the flow is built.
 */
export type SignInStartV2Result = CustomAuthV2Result<
    SignInStartV2ResultState,
    AuthFlowErrorV2Base
>;

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignInCodeRequiredState } from "./SignInCodeRequiredState.js";
import { SignInCompletedState } from "./SignInCompletedState.js";
import { SignInFailedState } from "./SignInFailedState.js";
import { SignInPasswordRequiredState } from "./SignInPasswordRequiredState.js";

/**
 * Union type representing all possible states of the sign-in flow
 */
export type SignInState = SignInPasswordRequiredState | SignInCodeRequiredState | SignInCompletedState | SignInFailedState;
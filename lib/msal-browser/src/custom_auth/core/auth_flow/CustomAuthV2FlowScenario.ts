/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * The native auth V2 flow that a result or error originates from. It lets a
 * shared result or error type report which entry flow (sign-in, sign-up, or
 * reset-password) produced it, so app code and diagnostics can branch on the
 * originating scenario. `Unknown` is used when the flow cannot be determined.
 */
export const CustomAuthV2FlowScenario = {
    SignIn: "signIn",
    SignUp: "signUp",
    ResetPassword: "resetPassword",
    Unknown: "unknown",
} as const;

export type CustomAuthV2FlowScenario =
    (typeof CustomAuthV2FlowScenario)[keyof typeof CustomAuthV2FlowScenario];


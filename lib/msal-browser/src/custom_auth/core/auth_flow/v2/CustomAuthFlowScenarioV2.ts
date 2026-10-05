/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * The native auth V2 flow that a result or error originates from (sign-in,
 * sign-up, or password reset). It lets a shared result or error type report
 * which entry flow produced it; `Unknown` is used when the flow cannot be
 * determined.
 */
export const CustomAuthFlowScenarioV2 = {
    SignIn: "signIn",
    SignUp: "signUp",
    PasswordReset: "passwordReset",
    Unknown: "unknown",
} as const;

export type CustomAuthFlowScenarioV2 =
    (typeof CustomAuthFlowScenarioV2)[keyof typeof CustomAuthFlowScenarioV2];

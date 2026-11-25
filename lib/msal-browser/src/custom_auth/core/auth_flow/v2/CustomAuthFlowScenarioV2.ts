/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * The native auth V2 flow that a result or error originates from.
 */
export const CustomAuthFlowScenarioV2 = {
    SignIn: "signIn",
    SignUp: "signUp",
    PasswordReset: "passwordReset",
    Unknown: "unknown",
} as const;

export type CustomAuthFlowScenarioV2 =
    (typeof CustomAuthFlowScenarioV2)[keyof typeof CustomAuthFlowScenarioV2];

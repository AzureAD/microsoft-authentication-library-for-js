/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * The native auth V2 flow that a result or error originates from (sign-in,
 * sign-up, or recovery). It lets a shared result or error type report which
 * entry flow produced it; `Unknown` is used when the flow cannot be determined.
 */
export const CustomAuthV2FlowScenario = {
    SignIn: "signIn",
    SignUp: "signUp",
    Recovery: "recovery",
    Unknown: "unknown",
} as const;

export type CustomAuthV2FlowScenario =
    (typeof CustomAuthV2FlowScenario)[keyof typeof CustomAuthV2FlowScenario];

const KNOWN_SCENARIOS = new Set<string>(
    Object.values(CustomAuthV2FlowScenario)
);

export function toCustomAuthV2FlowScenario(
    value: string | undefined
): CustomAuthV2FlowScenario {
    return value && KNOWN_SCENARIOS.has(value)
        ? (value as CustomAuthV2FlowScenario)
        : CustomAuthV2FlowScenario.Unknown;
}


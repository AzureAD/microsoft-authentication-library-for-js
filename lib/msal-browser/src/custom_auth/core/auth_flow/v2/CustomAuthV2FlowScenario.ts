/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * The native auth V2 flow that a result or error originates from (sign-in,
 * sign-up, or password reset). It lets a shared result or error type report
 * which entry flow produced it; `Unknown` is used when the flow cannot be
 * determined.
 *
 * These are the public-facing values. The server drives the password-reset
 * flow under the wire value `recovery`, which `toCustomAuthV2FlowScenario`
 * maps onto the public `PasswordReset` value.
 */
export const CustomAuthV2FlowScenario = {
    SignIn: "signIn",
    SignUp: "signUp",
    PasswordReset: "passwordReset",
    Unknown: "unknown",
} as const;

export type CustomAuthV2FlowScenario =
    (typeof CustomAuthV2FlowScenario)[keyof typeof CustomAuthV2FlowScenario];

const KNOWN_SCENARIOS = new Set<string>(
    Object.values(CustomAuthV2FlowScenario)
);

/*
 * Wire scenario values sent by the server that differ from their public
 * representation. The server reports password reset as `recovery`; the public
 * contract exposes it as `PasswordReset`.
 */
const WIRE_SCENARIO_ALIASES: Record<string, CustomAuthV2FlowScenario> = {
    recovery: CustomAuthV2FlowScenario.PasswordReset,
};

export function toCustomAuthV2FlowScenario(
    value: string | undefined
): CustomAuthV2FlowScenario {
    if (!value) {
        return CustomAuthV2FlowScenario.Unknown;
    }

    if (value in WIRE_SCENARIO_ALIASES) {
        return WIRE_SCENARIO_ALIASES[value];
    }

    return KNOWN_SCENARIOS.has(value)
        ? (value as CustomAuthV2FlowScenario)
        : CustomAuthV2FlowScenario.Unknown;
}


/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    CustomAuthV2FlowScenario,
    toCustomAuthV2FlowScenario,
} from "../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthV2FlowScenario.js";

describe("toCustomAuthV2FlowScenario", () => {
    it("maps the server wire value 'recovery' to the public PasswordReset scenario", () => {
        expect(toCustomAuthV2FlowScenario("recovery")).toBe(
            CustomAuthV2FlowScenario.PasswordReset
        );
    });

    it("passes through the known public scenario values unchanged", () => {
        expect(toCustomAuthV2FlowScenario("signIn")).toBe(
            CustomAuthV2FlowScenario.SignIn
        );
        expect(toCustomAuthV2FlowScenario("signUp")).toBe(
            CustomAuthV2FlowScenario.SignUp
        );
        expect(toCustomAuthV2FlowScenario("passwordReset")).toBe(
            CustomAuthV2FlowScenario.PasswordReset
        );
    });

    it("falls back to Unknown for unrecognized or missing values", () => {
        expect(toCustomAuthV2FlowScenario("somethingElse")).toBe(
            CustomAuthV2FlowScenario.Unknown
        );
        expect(toCustomAuthV2FlowScenario(undefined)).toBe(
            CustomAuthV2FlowScenario.Unknown
        );
        expect(toCustomAuthV2FlowScenario("")).toBe(
            CustomAuthV2FlowScenario.Unknown
        );
    });
});

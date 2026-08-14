/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { CustomAuthV2Result } from "../../../../../src/custom_auth/core/auth_flow/CustomAuthV2Result.js";
import { ResetPasswordStartV2Result } from "../../../../../src/custom_auth/core/auth_flow/v2/result/ResetPasswordStartV2Result.js";
import { ResetPasswordStartError } from "../../../../../src/custom_auth/core/auth_flow/v2/error/ResetPasswordStartError.js";
import { CustomAuthV2ApiError } from "../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/error/CustomAuthV2ApiError.js";
import { AuthenticationMethodSelectionRequiredState } from "../../../../../src/custom_auth/core/auth_flow/v2/state/AuthenticationMethodSelectionRequiredState.js";
import { FailedState } from "../../../../../src/custom_auth/core/auth_flow/v2/state/FailedState.js";
import { AuthenticationMethodV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/AuthenticationMethodV2.js";
import { CustomAuthV2FlowScenario } from "../../../../../src/custom_auth/core/auth_flow/CustomAuthV2FlowScenario.js";
import { getDefaultLogger } from "../../../test_resources/TestModules.js";

describe("CustomAuthV2Result", () => {
    const correlationId = "test-correlation-id";
    const mockConfig = {
        auth: { clientId: "test-client-id" },
        customAuth: { challengeTypes: ["password"] },
    } as unknown as jest.Mocked<CustomAuthBrowserConfiguration>;

    const method: AuthenticationMethodV2 = { id: "email", type: "email" };

    const buildSelectionState = (): AuthenticationMethodSelectionRequiredState =>
        new AuthenticationMethodSelectionRequiredState({
            correlationId,
            logger: getDefaultLogger(),
            config: mockConfig,
            methods: [method],
        });

    describe("isState narrowing", () => {
        it("returns true and narrows state to the matching union member", () => {
            const result: ResetPasswordStartV2Result = new CustomAuthV2Result(
                buildSelectionState()
            );

            expect(
                result.isState("authenticationMethodSelectionRequired")
            ).toBe(true);

            if (
                result.isState("authenticationMethodSelectionRequired")
            ) {
                // Compile-time proof of narrowing: `methods` and
                // `requestChallenge` exist only on the narrowed member.
                expect(result.state.methods).toEqual([method]);
                expect(typeof result.state.requestChallenge).toBe("function");
            }
        });

        it("returns false for a non-matching state type", () => {
            const result: ResetPasswordStartV2Result = new CustomAuthV2Result(
                buildSelectionState()
            );

            expect(result.isState("failed")).toBe(false);
            expect(result.isState("webFallbackRequired")).toBe(false);
        });
    });

    describe("isFailed narrowing", () => {
        it("is false for a non-failed state", () => {
            const result: ResetPasswordStartV2Result = new CustomAuthV2Result(
                buildSelectionState()
            );

            expect(result.isFailed()).toBe(false);
        });

        it("is true for a FailedState", () => {
            const result: ResetPasswordStartV2Result = new CustomAuthV2Result(
                new FailedState()
            );

            expect(result.isFailed()).toBe(true);
        });
    });

    describe("createWithError", () => {
        it("builds a failed result carrying the flow-specific error", () => {
            const error = new ResetPasswordStartError(
                new CustomAuthV2ApiError("user_not_found", "User not found", {
                    correlationId,
                })
            );

            const result = CustomAuthV2Result.createWithError<
                ResetPasswordStartV2Result["state"],
                ResetPasswordStartError
            >(error);

            expect(result.isFailed()).toBe(true);
            expect(result.state).toBeInstanceOf(FailedState);
            expect(result.error).toBe(error);
        });

        it("propagates the scenario from the error", () => {
            const error = new ResetPasswordStartError(
                new CustomAuthV2ApiError("user_not_found", "User not found", {
                    correlationId,
                }),
                CustomAuthV2FlowScenario.ResetPassword
            );

            const result = CustomAuthV2Result.createWithError<
                ResetPasswordStartV2Result["state"],
                ResetPasswordStartError
            >(error);

            expect(result.scenario).toBe(
                CustomAuthV2FlowScenario.ResetPassword
            );
        });
    });

    describe("scenario", () => {
        it("defaults to Unknown when none is supplied", () => {
            const result: ResetPasswordStartV2Result = new CustomAuthV2Result(
                buildSelectionState()
            );

            expect(result.scenario).toBe(CustomAuthV2FlowScenario.Unknown);
        });

        it("carries the scenario passed to the constructor", () => {
            const result: ResetPasswordStartV2Result = new CustomAuthV2Result(
                buildSelectionState(),
                undefined,
                CustomAuthV2FlowScenario.ResetPassword
            );

            expect(result.scenario).toBe(
                CustomAuthV2FlowScenario.ResetPassword
            );
        });
    });
});

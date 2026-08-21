/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common/browser";
import { CustomAuthBrowserConfiguration } from "../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { CustomAuthV2Result } from "../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthV2Result.js";
import { ResetPasswordStartV2Result } from "../../../../../src/custom_auth/core/auth_flow/v2/result/ResetPasswordStartV2Result.js";
import { ResetPasswordStartError } from "../../../../../src/custom_auth/core/auth_flow/v2/error/ResetPasswordStartError.js";
import { CustomAuthApiError } from "../../../../../src/custom_auth/core/error/CustomAuthApiError.js";
import { MsalCustomAuthError } from "../../../../../src/custom_auth/core/error/MsalCustomAuthError.js";
import { UnexpectedError } from "../../../../../src/custom_auth/core/error/UnexpectedError.js";
import { AuthenticationMethodSelectionRequiredState } from "../../../../../src/custom_auth/core/auth_flow/v2/state/AuthenticationMethodSelectionRequiredState.js";
import { FailedState } from "../../../../../src/custom_auth/core/auth_flow/v2/state/FailedState.js";
import { AuthenticationMethodV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/AuthenticationMethodV2.js";
import { CustomAuthV2FlowScenario } from "../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthV2FlowScenario.js";
import { V2FlowInteractionClient } from "../../../../../src/custom_auth/core/interaction_client/v2/V2FlowInteractionClient.js";
import { CustomAuthSilentCacheClient } from "../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { getDefaultLogger } from "../../../test_resources/TestModules.js";

describe("CustomAuthV2Result", () => {
    const correlationId = "test-correlation-id";
    const mockConfig = {
        auth: { clientId: "test-client-id" },
        customAuth: { challengeTypes: ["password"] },
    } as unknown as jest.Mocked<CustomAuthBrowserConfiguration>;

    const method: AuthenticationMethodV2 = {
        id: "email",
        type: "email",
        challengeHref: "/c",
    };

    const buildSelectionState =
        (): AuthenticationMethodSelectionRequiredState =>
            new AuthenticationMethodSelectionRequiredState({
                correlationId,
                logger: getDefaultLogger(),
                config: mockConfig,
                flowClient: {} as unknown as V2FlowInteractionClient,
                cacheClient: {} as unknown as CustomAuthSilentCacheClient,
                continuationState: {
                    continuationToken: "ct",
                    scenario: CustomAuthV2FlowScenario.PasswordReset,
                    links: {},
                },
                methods: [{ id: "email", type: "email", challengeHref: "/c" }],
            });

    describe("isState narrowing", () => {
        it("returns true and narrows state to the matching union member", () => {
            const result: ResetPasswordStartV2Result = new CustomAuthV2Result(
                buildSelectionState()
            );

            expect(
                result.isState("authenticationMethodSelectionRequired")
            ).toBe(true);

            if (result.isState("authenticationMethodSelectionRequired")) {
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
            const error = new CustomAuthApiError(
                "user_not_found",
                "User not found",
                correlationId
            );

            const result = CustomAuthV2Result.createWithError<
                ResetPasswordStartV2Result["state"],
                ResetPasswordStartError
            >(error, {
                errorType: ResetPasswordStartError,
            });

            expect(result.isFailed()).toBe(true);
            expect(result.state).toBeInstanceOf(FailedState);
            expect(result.error).toBeInstanceOf(ResetPasswordStartError);
            expect(result.error?.errorData).toBe(error);
        });

        it("applies the scenario to the result and flow-specific error", () => {
            const result = CustomAuthV2Result.createWithError<
                ResetPasswordStartV2Result["state"],
                ResetPasswordStartError
            >(
                new CustomAuthApiError(
                    "user_not_found",
                    "User not found",
                    correlationId
                ),
                {
                    errorType: ResetPasswordStartError,
                    scenario: CustomAuthV2FlowScenario.PasswordReset,
                }
            );

            expect(result.scenario).toBe(
                CustomAuthV2FlowScenario.PasswordReset
            );
            expect(result.error?.scenario).toBe(
                CustomAuthV2FlowScenario.PasswordReset
            );
        });

        it("converts an AuthError to MsalCustomAuthError", () => {
            const result = CustomAuthV2Result.createWithError<
                ResetPasswordStartV2Result["state"],
                ResetPasswordStartError
            >(
                new AuthError(
                    "auth_error_code",
                    correlationId,
                    "Auth error message",
                    "auth_sub_error"
                ),
                {
                    errorType: ResetPasswordStartError,
                }
            );

            expect(result.error?.errorData).toBeInstanceOf(MsalCustomAuthError);
            expect(result.error?.errorData).toMatchObject({
                error: "auth_error_code",
                errorDescription: "Auth error message",
                subError: "auth_sub_error",
                correlationId,
            });
        });

        it("wraps an unknown error and preserves the supplied correlation ID", () => {
            const result = CustomAuthV2Result.createWithError<
                ResetPasswordStartV2Result["state"],
                ResetPasswordStartError
            >(new TypeError("something broke"), {
                errorType: ResetPasswordStartError,
                correlationId,
            });

            expect(result.error?.errorData).toBeInstanceOf(UnexpectedError);
            expect(result.error?.errorData).toMatchObject({
                error: "unexpected_error",
                errorDescription: "something broke",
                correlationId,
            });
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
                CustomAuthV2FlowScenario.PasswordReset
            );

            expect(result.scenario).toBe(
                CustomAuthV2FlowScenario.PasswordReset
            );
        });
    });
});

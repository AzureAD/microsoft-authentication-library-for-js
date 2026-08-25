/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common/browser";
import { CustomAuthBrowserConfiguration } from "../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { CustomAuthResultV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthResultV2.js";
import { ResetPasswordStartResultV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/result/ResetPasswordStartResultV2.js";
import { ResetPasswordStartErrorV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/error/ResetPasswordStartErrorV2.js";
import { CustomAuthApiError } from "../../../../../src/custom_auth/core/error/CustomAuthApiError.js";
import { MsalCustomAuthError } from "../../../../../src/custom_auth/core/error/MsalCustomAuthError.js";
import { UnexpectedError } from "../../../../../src/custom_auth/core/error/UnexpectedError.js";
import { AuthenticationMethodSelectionRequiredStateV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/state/AuthenticationMethodSelectionRequiredStateV2.js";
import { FailedStateV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/state/FailedStateV2.js";
import { AuthenticationMethodV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/AuthenticationMethodV2.js";
import { CustomAuthFlowScenarioV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthFlowScenarioV2.js";
import { FlowInteractionClientV2 } from "../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import { CustomAuthSilentCacheClient } from "../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { getDefaultLogger } from "../../../test_resources/TestModules.js";

describe("CustomAuthResultV2", () => {
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
        (): AuthenticationMethodSelectionRequiredStateV2 =>
            new AuthenticationMethodSelectionRequiredStateV2({
                correlationId,
                logger: getDefaultLogger(),
                config: mockConfig,
                flowClient: {} as unknown as FlowInteractionClientV2,
                cacheClient: {} as unknown as CustomAuthSilentCacheClient,
                continuationState: {
                    continuationToken: "ct",
                    scenario: CustomAuthFlowScenarioV2.PasswordReset,
                    links: {},
                },
                methods: [{ id: "email", type: "email", challengeHref: "/c" }],
            });

    describe("isState narrowing", () => {
        it("returns true and narrows state to the matching union member", () => {
            const result: ResetPasswordStartResultV2 = new CustomAuthResultV2(
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
            const result: ResetPasswordStartResultV2 = new CustomAuthResultV2(
                buildSelectionState()
            );

            expect(result.isState("failed")).toBe(false);
        });
    });

    describe("isFailed narrowing", () => {
        it("is false for a non-failed state", () => {
            const result: ResetPasswordStartResultV2 = new CustomAuthResultV2(
                buildSelectionState()
            );

            expect(result.isFailed()).toBe(false);
        });

        it("is true for a FailedStateV2", () => {
            const result: ResetPasswordStartResultV2 = new CustomAuthResultV2(
                new FailedStateV2()
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

            const result = CustomAuthResultV2.createWithError<
                ResetPasswordStartResultV2["state"],
                ResetPasswordStartErrorV2
            >(error, {
                errorType: ResetPasswordStartErrorV2,
            });

            expect(result.isFailed()).toBe(true);
            expect(result.state).toBeInstanceOf(FailedStateV2);
            expect(result.error).toBeInstanceOf(ResetPasswordStartErrorV2);
            expect(result.error?.errorData).toBe(error);
        });

        it("applies the scenario to the result and flow-specific error", () => {
            const result = CustomAuthResultV2.createWithError<
                ResetPasswordStartResultV2["state"],
                ResetPasswordStartErrorV2
            >(
                new CustomAuthApiError(
                    "user_not_found",
                    "User not found",
                    correlationId
                ),
                {
                    errorType: ResetPasswordStartErrorV2,
                    scenario: CustomAuthFlowScenarioV2.PasswordReset,
                }
            );

            expect(result.scenario).toBe(
                CustomAuthFlowScenarioV2.PasswordReset
            );
            expect(result.error?.scenario).toBe(
                CustomAuthFlowScenarioV2.PasswordReset
            );
        });

        it("converts an AuthError to MsalCustomAuthError", () => {
            const result = CustomAuthResultV2.createWithError<
                ResetPasswordStartResultV2["state"],
                ResetPasswordStartErrorV2
            >(
                new AuthError(
                    "auth_error_code",
                    correlationId,
                    "Auth error message",
                    "auth_sub_error"
                ),
                {
                    errorType: ResetPasswordStartErrorV2,
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
            const result = CustomAuthResultV2.createWithError<
                ResetPasswordStartResultV2["state"],
                ResetPasswordStartErrorV2
            >(new TypeError("something broke"), {
                errorType: ResetPasswordStartErrorV2,
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
            const result: ResetPasswordStartResultV2 = new CustomAuthResultV2(
                buildSelectionState()
            );

            expect(result.scenario).toBe(CustomAuthFlowScenarioV2.Unknown);
        });

        it("carries the scenario passed to the constructor", () => {
            const result: ResetPasswordStartResultV2 = new CustomAuthResultV2(
                buildSelectionState(),
                undefined,
                CustomAuthFlowScenarioV2.PasswordReset
            );

            expect(result.scenario).toBe(
                CustomAuthFlowScenarioV2.PasswordReset
            );
        });
    });
});

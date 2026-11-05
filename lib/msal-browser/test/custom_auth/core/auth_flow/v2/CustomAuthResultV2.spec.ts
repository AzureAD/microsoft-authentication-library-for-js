/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common/browser";
import { CustomAuthBrowserConfiguration } from "../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { CustomAuthResultV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthResultV2.js";
import { ResetPasswordStartResultV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/result/ResetPasswordStartResultV2.js";
import { AuthFlowErrorV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/error/AuthFlowErrorV2.js";
import { CustomAuthApiError } from "../../../../../src/custom_auth/core/error/CustomAuthApiError.js";
import { MsalCustomAuthError } from "../../../../../src/custom_auth/core/error/MsalCustomAuthError.js";
import { UnexpectedError } from "../../../../../src/custom_auth/core/error/UnexpectedError.js";
import { InvalidArgumentError } from "../../../../../src/custom_auth/core/error/InvalidArgumentError.js";
import { AuthMethodSelectionRequiredStateV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/state/AuthMethodSelectionRequiredStateV2.js";
import { CodeRequiredStateV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/state/CodeRequiredStateV2.js";
import { FailedStateV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/state/FailedStateV2.js";
import { AuthenticationMethodV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/AuthenticationMethodV2.js";
import { CustomAuthFlowScenarioV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthFlowScenarioV2.js";
import { FlowInteractionClientV2 } from "../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import { CustomAuthSilentCacheClient } from "../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { AuthenticationFactorV2 } from "../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/result/BaseResultsV2.js";
import { getDefaultLogger } from "../../../test_resources/TestModules.js";
import { SubmitPasswordResultV2 } from "../../../../../src/custom_auth/sign_in/auth_flow/v2/result/SubmitPasswordResultV2.js";
import { SubmitAttributesResultV2 } from "../../../../../src/custom_auth/sign_up/auth_flow/v2/result/SubmitAttributesResultV2.js";

describe("CustomAuthResultV2", () => {
    const correlationId = "test-correlation-id";
    const scopes = ["openid", "profile", "offline_access"];
    const mockConfig = {
        auth: { clientId: "test-client-id" },
        customAuth: { challengeTypes: ["password"] },
    } as unknown as jest.Mocked<CustomAuthBrowserConfiguration>;

    const method: AuthenticationMethodV2 = {
        id: "email",
        type: "email",
        challengeHref: "/c",
    };

    const buildSelectionState = (): AuthMethodSelectionRequiredStateV2 =>
        new AuthMethodSelectionRequiredStateV2({
            correlationId,
            logger: getDefaultLogger(),
            config: mockConfig,
            flowClient: {} as unknown as FlowInteractionClientV2,
            cacheClient: {} as unknown as CustomAuthSilentCacheClient,
            continuationState: {
                continuationToken: "ct",
                scenario: CustomAuthFlowScenarioV2.PasswordReset,
                scopes,
                links: {},
            },
            methods: [{ id: "email", type: "email", challengeHref: "/c" }],
            authenticationFactor: AuthenticationFactorV2.SINGLE_FACTOR,
        });

    const expectUnifiedClassifiers = (
        result:
            | ResetPasswordStartResultV2
            | SubmitPasswordResultV2
            | SubmitAttributesResultV2
    ): void => {
        expect(result.error).toBeInstanceOf(AuthFlowErrorV2);
        if (!result.error) {
            throw new Error("Expected a unified V2 flow error.");
        }

        expect(typeof result.error.isBrowserRequired).toBe("function");
        expect(typeof result.error.isInvalidInput).toBe("function");
        expect(typeof result.error.isInvalidUsername).toBe("function");
        expect(typeof result.error.isUserNotFound).toBe("function");
        expect(typeof result.error.isInvalidCode).toBe("function");
        expect(typeof result.error.isInvalidChallenge).toBe("function");
        expect(typeof result.error.isInvalidAttributeError).toBe("function");
        expect(typeof result.error.isInvalidPassword).toBe("function");
    };

    describe("isState narrowing", () => {
        it("returns true and narrows state to the matching union member", () => {
            const result: ResetPasswordStartResultV2 = new CustomAuthResultV2(
                buildSelectionState()
            );

            expect(result.isState("authMethodSelectionRequired")).toBe(true);

            if (result.isState("authMethodSelectionRequired")) {
                // Compile-time proof of narrowing: `methods` and
                // `selectAuthMethod` exist only on the narrowed member.
                expect(result.state.methods).toEqual([method]);
                expect(typeof result.state.selectAuthMethod).toBe("function");
            }
        });

        it("returns false for a non-matching state type", () => {
            const result: ResetPasswordStartResultV2 = new CustomAuthResultV2(
                buildSelectionState()
            );

            expect(result.isState("failed")).toBe(false);
        });

        it("narrows an auto-selected reset result to code verification", () => {
            const result: ResetPasswordStartResultV2 = new CustomAuthResultV2(
                new CodeRequiredStateV2({
                    correlationId,
                    logger: getDefaultLogger(),
                    config: mockConfig,
                    flowClient: {} as unknown as FlowInteractionClientV2,
                    cacheClient: {} as unknown as CustomAuthSilentCacheClient,
                    continuationState: {
                        continuationToken: "ct",
                        scenario: CustomAuthFlowScenarioV2.PasswordReset,
                        scopes,
                        links: {
                            verify: "/verify",
                        },
                    },
                    method,
                    channel: "email",
                })
            );

            expect(result.isState("codeRequired")).toBe(true);
            if (result.isState("codeRequired")) {
                expect(result.state.method).toBe(method);
            }
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
        it("builds a failed result carrying the unified flow error", () => {
            const error = new CustomAuthApiError(
                "user_not_found",
                "User not found",
                correlationId
            );

            const result = CustomAuthResultV2.createWithError<
                ResetPasswordStartResultV2["state"]
            >(error, {});

            expect(result.isFailed()).toBe(true);
            expect(result.state).toBeInstanceOf(FailedStateV2);
            expect(result.error?.errorData).toBe(error);
            expectUnifiedClassifiers(result);
        });

        it("classifies attribute errors and preserves their diagnostics", () => {
            const error = new CustomAuthApiError(
                "invalidRequest",
                "Some of the collected attributes were invalid.",
                correlationId,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                [
                    {
                        attributeIds: ["username"],
                        code: "attributeValidationFailed",
                    },
                ],
                "attributeValidationError"
            );
            const result = CustomAuthResultV2.createWithError(error, {});

            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData).toBe(error);
            expect(result.error?.isInvalidAttributeError()).toBe(true);
            expect(result.error?.invalidAttributes).toEqual(["username"]);
            expect(result.error?.innerErrorCode).toBe(
                "attributeValidationError"
            );
            expect(result.error?.isInvalidUsername()).toBe(false);
            expect(result.error?.isInvalidInput()).toBe(false);
        });

        it("preserves a classified challenge and its owning scenario", () => {
            const errorData = new CustomAuthApiError(
                "invalidGrant",
                "Invalid code.",
                correlationId,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                "invalidOneTimeCode"
            );
            const error = new AuthFlowErrorV2(
                errorData,
                CustomAuthFlowScenarioV2.SignIn,
                "challenge"
            );

            const result = CustomAuthResultV2.createWithError(error, {
                scenario: CustomAuthFlowScenarioV2.PasswordReset,
            });

            expect(result.isFailed()).toBe(true);
            expect(result.error).toBe(error);
            expect(result.error?.errorData).toBe(errorData);
            expect(result.error?.isInvalidChallenge()).toBe(true);
            expect(result.error?.isInvalidCode()).toBe(false);
            expect(result.scenario).toBe(CustomAuthFlowScenarioV2.SignIn);
            expect(result.error?.scenario).toBe(result.scenario);
        });

        it("preserves local username and input classification", () => {
            const errorData = new InvalidArgumentError(
                "inputs.username",
                correlationId
            );
            const error = new AuthFlowErrorV2(
                errorData,
                CustomAuthFlowScenarioV2.SignUp,
                "username"
            );

            const result = CustomAuthResultV2.createWithError(error, {});

            expect(result.error).toBe(error);
            expect(result.error?.errorData).toBe(errorData);
            expect(result.error?.isInvalidUsername()).toBe(true);
            expect(result.error?.isInvalidInput()).toBe(true);
            expect(result.error?.correlationId).toBe(correlationId);
            expect(result.scenario).toBe(CustomAuthFlowScenarioV2.SignUp);
        });

        it("applies the scenario to the result and unified error", () => {
            const result = CustomAuthResultV2.createWithError<
                ResetPasswordStartResultV2["state"]
            >(
                new CustomAuthApiError(
                    "user_not_found",
                    "User not found",
                    correlationId
                ),
                {
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
                ResetPasswordStartResultV2["state"]
            >(
                new AuthError(
                    "auth_error_code",
                    correlationId,
                    "Auth error message",
                    "auth_sub_error"
                ),
                {}
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
                ResetPasswordStartResultV2["state"]
            >(new TypeError("something broke"), {
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

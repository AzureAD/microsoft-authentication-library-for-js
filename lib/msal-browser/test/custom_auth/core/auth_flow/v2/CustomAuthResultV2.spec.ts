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
import { AuthMethodSelectionRequiredStateV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/state/AuthMethodSelectionRequiredStateV2.js";
import { CodeRequiredStateV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/state/CodeRequiredStateV2.js";
import { FailedStateV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/state/FailedStateV2.js";
import { AuthenticationMethodV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/AuthenticationMethodV2.js";
import { CustomAuthFlowScenarioV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthFlowScenarioV2.js";
import { FlowInteractionClientV2 } from "../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import { CustomAuthSilentCacheClient } from "../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { AuthenticationFactorV2 } from "../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/result/BaseResultsV2.js";
import { getDefaultLogger } from "../../../test_resources/TestModules.js";
import { SubmitPasswordResultV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/result/SubmitPasswordResultV2.js";
import { SubmitAttributesResultV2 } from "../../../../../src/custom_auth/sign_up/auth_flow/v2/result/SubmitAttributesResultV2.js";
import { PasswordRequiredStateV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/state/PasswordRequiredStateV2.js";
import type { SignInStartResultV2 } from "../../../../../src/custom_auth/sign_in/auth_flow/v2/result/SignInStartResultV2.js";
import type { VerifyChallengeResultV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/result/VerifyChallengeResultV2.js";
import type { SignInContinuationResultV2 } from "../../../../../src/custom_auth/sign_in/auth_flow/v2/result/SignInContinuationResultV2.js";
import type { MFASubmitChallengeResultV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/result/MFASubmitChallengeResultV2.js";
import type { AuthMethodVerificationSubmitChallengeResultV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/result/AuthMethodVerificationSubmitChallengeResultV2.js";
import { CompletedStateV2 } from "../../../../../src/custom_auth/core/auth_flow/v2/state/CompletedStateV2.js";
import { CustomAuthAccountData } from "../../../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";

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
        expect(typeof result.error.isInvalidCredentials).toBe("function");
        expect(typeof result.error.isInvalidCode).toBe("function");
        expect(typeof result.error.isInvalidPassword).toBe("function");
        expect(typeof result.error.isUserAlreadyExists).toBe("function");
        expect(typeof result.error.isMissingRequiredAttributes).toBe(
            "function"
        );
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

    describe("agreed password-required result contract", () => {
        it("UT-SU-01: isPasswordRequired narrows sign-in and sign-up results to the shared state", () => {
            const buildPasswordState = (scenario: CustomAuthFlowScenarioV2) =>
                new PasswordRequiredStateV2({
                    correlationId,
                    logger: getDefaultLogger(),
                    config: mockConfig,
                    flowClient: {} as FlowInteractionClientV2,
                    cacheClient: {} as CustomAuthSilentCacheClient,
                    continuationState: {
                        continuationToken: "ct-password",
                        scenario,
                        scopes,
                        links: {},
                    },
                });
            const signInResult: SignInStartResultV2 = new CustomAuthResultV2(
                buildPasswordState(CustomAuthFlowScenarioV2.SignIn)
            );
            const signUpResult: VerifyChallengeResultV2 =
                new CustomAuthResultV2(
                    buildPasswordState(CustomAuthFlowScenarioV2.SignUp)
                );

            for (const result of [signInResult, signUpResult]) {
                expect(result.isPasswordRequired()).toBe(true);
                expect(result.isFailed()).toBe(false);
                expect(result.error).toBeUndefined();
                if (result.isPasswordRequired()) {
                    const state: PasswordRequiredStateV2 = result.state;
                    expect(typeof state.submitPassword).toBe("function");
                    expect(state.attributes).toEqual([]);
                }
            }
        });

        it("UT-SU-02: isPasswordRequired is false for other states and invalid-password failures", () => {
            const otherResult: ResetPasswordStartResultV2 =
                new CustomAuthResultV2(buildSelectionState());
            const error = new CustomAuthApiError(
                "invalidRequest",
                "Password does not meet requirements.",
                correlationId
            );
            error.innerErrorCode = "passwordTooWeak";
            const failedResult = CustomAuthResultV2.createWithError<
                VerifyChallengeResultV2["state"]
            >(error, {
                scenario: CustomAuthFlowScenarioV2.SignUp,
                correlationId,
            });

            expect(otherResult.isPasswordRequired()).toBe(false);
            expect(failedResult.isPasswordRequired()).toBe(false);
            expect(failedResult.isFailed()).toBe(true);
            expect(failedResult.error?.isInvalidPassword()).toBe(true);
        });
    });

    describe("result data typing", () => {
        it("accepts data-free results in the mixed account-data result aliases", () => {
            const result = new CustomAuthResultV2(
                new FailedStateV2(),
                undefined,
                CustomAuthFlowScenarioV2.SignIn
            );
            const results: [
                SignInStartResultV2,
                VerifyChallengeResultV2,
                SubmitPasswordResultV2
            ] = [result, result, result];

            for (const accountResult of results) {
                expect(accountResult.data).toBeUndefined();
            }
        });

        it("accepts completed account data in every account-bearing result alias", () => {
            const account = new CustomAuthAccountData(
                {
                    homeAccountId: "uid.utid",
                    localAccountId: "uid",
                    tenantId: "utid",
                    environment: "login.example.com",
                    username: "test-user",
                },
                mockConfig,
                {} as CustomAuthSilentCacheClient,
                getDefaultLogger(),
                correlationId
            );
            const result = new CustomAuthResultV2(
                new CompletedStateV2(),
                account,
                CustomAuthFlowScenarioV2.SignIn
            );
            const results: [
                SignInStartResultV2,
                VerifyChallengeResultV2,
                SubmitPasswordResultV2,
                SignInContinuationResultV2,
                MFASubmitChallengeResultV2,
                AuthMethodVerificationSubmitChallengeResultV2
            ] = [result, result, result, result, result, result];

            for (const accountResult of results) {
                expect(accountResult.data).toBe(account);
            }
        });

        it("allows a no-data attribute result to be returned as a password result", () => {
            const attributeResult: SubmitAttributesResultV2 =
                new CustomAuthResultV2(
                    new FailedStateV2(),
                    undefined,
                    CustomAuthFlowScenarioV2.SignUp
                );
            const passwordResult: SubmitPasswordResultV2 = attributeResult;

            expect(passwordResult).toBe(attributeResult);
            expect(passwordResult.data).toBeUndefined();
            expect(passwordResult.scenario).toBe(
                CustomAuthFlowScenarioV2.SignUp
            );
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

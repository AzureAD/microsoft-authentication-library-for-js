/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthPublicClientApplication } from "../../../src/custom_auth/CustomAuthPublicClientApplication.js";
import { CustomAuthStandardController } from "../../../src/custom_auth/controller/CustomAuthStandardController.js";
import { AuthMethodSelectionRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/AuthMethodSelectionRequiredStateV2.js";
import { CodeRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/CodeRequiredStateV2.js";
import { CompletedStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/CompletedStateV2.js";
import { AuthMethodRegistrationRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/AuthMethodRegistrationRequiredStateV2.js";
import { AuthMethodVerificationRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/AuthMethodVerificationRequiredStateV2.js";
import { AuthFlowErrorV2 } from "../../../src/custom_auth/core/auth_flow/v2/error/AuthFlowErrorV2.js";
import { CustomAuthAccountData } from "../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { NewPasswordRequiredStateV2 } from "../../../src/custom_auth/reset_password/auth_flow/v2/state/NewPasswordRequiredStateV2.js";
import { SignInContinuationStateV2 } from "../../../src/custom_auth/sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";
import { INVALID_HAL_RESPONSE } from "../../../src/custom_auth/core/network_client/custom_auth_api/v2/ErrorCodesV2.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";
import { TestServerTokenResponse } from "../test_resources/TestConstants.js";
import {
    ACTIVATED_CONTINUE_RESPONSE,
    CONTINUE_RESPONSE,
    ENROLL_ACTIVATION_RESPONSE,
    EMAIL_AND_SMS_START_RESPONSE,
    EMAIL_CHALLENGE_RESPONSE,
    EMAIL_ONLY_START_RESPONSE,
    ENTRY_RESPONSE,
    POLL_ENROLL_REQUIRED_RESPONSE,
    POLL_COMPLETED_RESPONSE,
    SMS_CHALLENGE_RESPONSE,
    SMS_ONLY_START_RESPONSE,
    SMS_RESEND_CHALLENGE_RESPONSE,
    SMS_RESEND_RISK_VERIFY_RESPONSE,
    SMS_RISK_VERIFY_RESPONSE,
    UPDATE_RESPONSE,
    VERIFY_RESPONSE,
} from "./ResetPasswordV2Constants.js";

const buildResponse = (
    body: unknown,
    status = 200,
    headers: Record<string, string> = { "x-ms-request-id": "corr-1" }
): Response =>
    ({
        status,
        headers: {
            get: (name: string) => headers[name] ?? null,
        },
        json: async () => body,
    } as unknown as Response);

describe("Reset password V2 (SSPR)", () => {
    let app: CustomAuthPublicClientApplication;

    beforeEach(async () => {
        app = (await CustomAuthPublicClientApplication.create(
            customAuthConfig
        )) as CustomAuthPublicClientApplication;

        global.fetch = jest.fn();
    });

    afterEach(() => {
        if (app.getAllAccounts().length > 0) {
            app.clearCache();
        }

        const controller = app[
            "customAuthController"
        ] as CustomAuthStandardController;
        if (
            controller &&
            controller["eventHandler"] &&
            controller["eventHandler"]["broadcastChannel"]
        ) {
            controller["eventHandler"]["broadcastChannel"].close();
        }

        jest.clearAllMocks();
        jest.useRealTimers();
    });

    const completePasswordReset = async (
        codeState: CodeRequiredStateV2
    ): Promise<void> => {
        const verifyResult = await codeState.submitCode("123456");
        expect(verifyResult.isFailed()).toBe(false);
        expect(verifyResult.state).toBeInstanceOf(NewPasswordRequiredStateV2);

        const passwordState = verifyResult.state as NewPasswordRequiredStateV2;
        const submitResult = await passwordState.submitNewPassword(
            "new-valid-password"
        );
        expect(submitResult.isFailed()).toBe(false);
        expect(submitResult.state).toBeInstanceOf(SignInContinuationStateV2);

        const signInState = submitResult.state as SignInContinuationStateV2;
        const signInResult = await signInState.signIn();
        expect(signInResult.isFailed()).toBe(false);
        expect(signInResult.isState("completed")).toBe(true);
        expect(signInResult.state).toBeInstanceOf(CompletedStateV2);
        expect(signInResult.data).toBeInstanceOf(CustomAuthAccountData);
        expect(signInResult.data?.getAccount()?.idToken).toStrictEqual(
            TestServerTokenResponse.id_token
        );
    };

    it("completes password reset after automatically challenging the only Email method", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(EMAIL_ONLY_START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(EMAIL_CHALLENGE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(VERIFY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(UPDATE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(POLL_COMPLETED_RESPONSE))
            .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

        const startResult = await app.resetPasswordV2({
            username: "user@contoso.com",
        });

        expect(startResult.isFailed()).toBe(false);
        expect(startResult.isState("codeRequired")).toBe(true);
        expect(startResult.state).toBeInstanceOf(CodeRequiredStateV2);

        const codeState = startResult.state as CodeRequiredStateV2;
        expect(codeState.method?.id).toBe("email");
        expect(codeState.channel).toBe("email");

        await completePasswordReset(codeState);

        expect(fetch as jest.Mock).toHaveBeenCalledTimes(8);
    });

    it.each([false, true])(
        "enrolls and activates a method after the final poll (in-progress poll: %s)",
        async (pollInProgress) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
                .mockResolvedValueOnce(buildResponse(EMAIL_ONLY_START_RESPONSE))
                .mockResolvedValueOnce(buildResponse(EMAIL_CHALLENGE_RESPONSE))
                .mockResolvedValueOnce(buildResponse(VERIFY_RESPONSE))
                .mockResolvedValueOnce(buildResponse(UPDATE_RESPONSE));
            if (pollInProgress) {
                (fetch as jest.Mock).mockResolvedValueOnce(
                    buildResponse({
                        continuationToken: "ct-poll-in-progress",
                        action: "poll",
                        _links: {
                            poll: { href: "/tenant/api/v0.1/poll-next" },
                        },
                    })
                );
            }
            (fetch as jest.Mock)
                .mockResolvedValueOnce(
                    buildResponse(POLL_ENROLL_REQUIRED_RESPONSE)
                )
                .mockResolvedValueOnce(
                    buildResponse(ENROLL_ACTIVATION_RESPONSE)
                )
                .mockResolvedValueOnce(
                    buildResponse(ACTIVATED_CONTINUE_RESPONSE)
                )
                .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
                .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

            const startResult = await app.resetPasswordV2({
                username: "user@contoso.com",
                scopes: ["openid"],
            });
            if (!startResult.isState("codeRequired")) {
                throw new Error("Expected a reset verification code.");
            }
            const verified = await startResult.state.submitCode("123456");
            if (!verified.isState("newPasswordRequired")) {
                throw new Error("Expected a new password before enrollment.");
            }
            expect(fetch).toHaveBeenCalledTimes(4);

            if (pollInProgress) {
                jest.useFakeTimers();
            }
            const registrationPromise =
                verified.state.submitNewPassword("new-valid-password");
            if (pollInProgress) {
                await jest.advanceTimersByTimeAsync(1500);
            }
            const registration = await registrationPromise;
            jest.useRealTimers();
            expect(registration.state).toBeInstanceOf(
                AuthMethodRegistrationRequiredStateV2
            );
            if (!registration.isState("authMethodRegistrationRequired")) {
                throw new Error("Expected enrollment after password update.");
            }
            const enrollCallIndex = pollInProgress ? 7 : 6;
            expect(fetch).toHaveBeenCalledTimes(enrollCallIndex);
            const pollCalls = (fetch as jest.Mock).mock.calls;
            expect(String(pollCalls[5][0])).toContain("/poll");
            expect(JSON.parse(pollCalls[5][1].body)).toEqual({
                continuationToken: "ct-update",
            });
            if (pollInProgress) {
                expect(String(pollCalls[6][0])).toContain("/poll-next");
                expect(JSON.parse(pollCalls[6][1].body)).toEqual({
                    continuationToken: "ct-poll-in-progress",
                });
            }
            const activation = await registration.state.enrollAuthMethod(
                registration.state.methods[0],
                "user@contoso.com"
            );
            expect(activation.state).toBeInstanceOf(
                AuthMethodVerificationRequiredStateV2
            );
            if (!activation.isState("authMethodVerificationRequired")) {
                throw new Error("Expected method activation.");
            }

            const completed = await activation.state.submitChallenge("123456");
            expect(completed.isState("completed")).toBe(true);
            expect(completed.data).toBeInstanceOf(CustomAuthAccountData);
            expect(fetch).toHaveBeenCalledTimes(enrollCallIndex + 4);
            const calls = (fetch as jest.Mock).mock.calls;
            expect(String(calls[enrollCallIndex][0])).toContain(
                "/enroll/email"
            );
            expect(JSON.parse(calls[enrollCallIndex][1].body)).toEqual({
                continuationToken: "ct-enroll",
                email: "user@contoso.com",
            });
            expect(String(calls[enrollCallIndex + 1][0])).toContain(
                "/activate/email"
            );
            expect(
                (calls[enrollCallIndex + 2][1].body as URLSearchParams).get(
                    "continuation_token"
                )
            ).toBe("ct-activated");
        }
    );

    it.each([
        { state: "continue", action: "future-action" },
        { state: "future-state" },
    ])(
        "rejects an unsupported poll response %j without retrying",
        async (body) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
                .mockResolvedValueOnce(buildResponse(EMAIL_ONLY_START_RESPONSE))
                .mockResolvedValueOnce(buildResponse(EMAIL_CHALLENGE_RESPONSE))
                .mockResolvedValueOnce(buildResponse(VERIFY_RESPONSE))
                .mockResolvedValueOnce(buildResponse(UPDATE_RESPONSE))
                .mockResolvedValueOnce(
                    buildResponse({
                        ...body,
                        continuationToken: "ct-poll",
                        _links: {
                            poll: { href: "/tenant/api/v0.1/poll-next" },
                        },
                    })
                );

            const startResult = await app.resetPasswordV2({
                username: "user@contoso.com",
            });
            if (!startResult.isState("codeRequired")) {
                throw new Error("Expected a reset verification code.");
            }
            const verified = await startResult.state.submitCode("123456");
            if (!verified.isState("newPasswordRequired")) {
                throw new Error("Expected a new password.");
            }

            const result = await verified.state.submitNewPassword(
                "new-valid-password"
            );

            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData).toMatchObject({
                error: INVALID_HAL_RESPONSE,
            });
            expect(result.isState("failed")).toBe(true);
            expect(fetch).toHaveBeenCalledTimes(6);
        }
    );

    it("rejects enrollment before a new password is submitted", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(EMAIL_ONLY_START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(EMAIL_CHALLENGE_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse(POLL_ENROLL_REQUIRED_RESPONSE)
            );

        const startResult = await app.resetPasswordV2({
            username: "user@contoso.com",
        });
        if (!startResult.isState("codeRequired")) {
            throw new Error("Expected a reset verification code.");
        }
        const result = await startResult.state.submitCode("123456");

        expect(result.isFailed()).toBe(true);
        expect(result.error?.errorData).toMatchObject({
            error: "unsupported_flow_transition",
        });
        expect(fetch).toHaveBeenCalledTimes(4);
    });

    it("completes password reset after automatically challenging the only SMS method", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(SMS_ONLY_START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(SMS_CHALLENGE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(SMS_RISK_VERIFY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(VERIFY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(UPDATE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(POLL_COMPLETED_RESPONSE))
            .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

        const startResult = await app.resetPasswordV2({
            username: "user@contoso.com",
        });

        expect(startResult.isFailed()).toBe(false);
        expect(startResult.isState("codeRequired")).toBe(true);
        expect(startResult.state).toBeInstanceOf(CodeRequiredStateV2);

        const codeState = startResult.state as CodeRequiredStateV2;
        expect(codeState.method?.id).toBe("sms");
        expect(codeState.channel).toBe("sms");
        expect(codeState.sentTo).toBe("+*** *******11");

        await completePasswordReset(codeState);

        expect(fetch as jest.Mock).toHaveBeenCalledTimes(9);
        expect(String((fetch as jest.Mock).mock.calls[3][0])).toContain(
            "/risk/phone/verify"
        );
        expect(String((fetch as jest.Mock).mock.calls[4][0])).toContain(
            "/sms/verify"
        );
    });

    it("completes password reset after selecting Email from multiple methods", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(EMAIL_AND_SMS_START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(EMAIL_CHALLENGE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(VERIFY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(UPDATE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(POLL_COMPLETED_RESPONSE))
            .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

        const startResult = await app.resetPasswordV2({
            username: "user@contoso.com",
        });

        expect(startResult.isFailed()).toBe(false);
        expect(startResult.isState("authMethodSelectionRequired")).toBe(true);
        expect(startResult.state).toBeInstanceOf(
            AuthMethodSelectionRequiredStateV2
        );

        const methodState =
            startResult.state as AuthMethodSelectionRequiredStateV2;
        const emailMethod = methodState.methods.find(
            (method) => method.type === "email"
        );
        if (!emailMethod) {
            throw new Error("Expected an Email password-reset method.");
        }

        const challengeResult = await methodState.selectAuthMethod(emailMethod);
        expect(challengeResult.isFailed()).toBe(false);
        expect(challengeResult.state).toBeInstanceOf(CodeRequiredStateV2);

        await completePasswordReset(
            challengeResult.state as CodeRequiredStateV2
        );

        expect(fetch as jest.Mock).toHaveBeenCalledTimes(8);
    });

    it("completes password reset after selecting SMS and resending the code", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(EMAIL_AND_SMS_START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(SMS_CHALLENGE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(SMS_RISK_VERIFY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(SMS_RESEND_CHALLENGE_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse(SMS_RESEND_RISK_VERIFY_RESPONSE)
            )
            .mockResolvedValueOnce(buildResponse(VERIFY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(UPDATE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(POLL_COMPLETED_RESPONSE))
            .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

        const startResult = await app.resetPasswordV2({
            username: "user@contoso.com",
        });

        expect(startResult.isFailed()).toBe(false);
        expect(startResult.isState("authMethodSelectionRequired")).toBe(true);
        expect(startResult.state).toBeInstanceOf(
            AuthMethodSelectionRequiredStateV2
        );

        const methodState =
            startResult.state as AuthMethodSelectionRequiredStateV2;
        const smsMethod = methodState.methods.find(
            (method) => method.type === "sms"
        );
        if (!smsMethod) {
            throw new Error("Expected an SMS password-reset method.");
        }

        const challengeResult = await methodState.selectAuthMethod(smsMethod);
        expect(challengeResult.isFailed()).toBe(false);
        expect(challengeResult.state).toBeInstanceOf(CodeRequiredStateV2);

        const resendResult = await (
            challengeResult.state as CodeRequiredStateV2
        ).resendCode();
        expect(resendResult.isFailed()).toBe(false);
        expect(resendResult.state).toBeInstanceOf(CodeRequiredStateV2);
        expect((resendResult.state as CodeRequiredStateV2).channel).toBe("sms");

        await completePasswordReset(resendResult.state as CodeRequiredStateV2);

        expect(fetch as jest.Mock).toHaveBeenCalledTimes(11);
        expect(String((fetch as jest.Mock).mock.calls[4][0])).toContain(
            "/sms/challenge"
        );
        expect(String((fetch as jest.Mock).mock.calls[5][0])).toContain(
            "/risk/phone/verify"
        );
    });

    it("surfaces an invalid-code failure while awaiting a valid code", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(EMAIL_ONLY_START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(EMAIL_CHALLENGE_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse(
                    {
                        error: {
                            code: "invalidGrant",
                            message: "AADSTS50181: Unable to validate the otp.",
                            innerError: { code: "invalidOneTimeCode" },
                        },
                    },
                    400
                )
            );

        const startResult = await app.resetPasswordV2({
            username: "user@contoso.com",
        });
        const result = await (
            startResult.state as CodeRequiredStateV2
        ).submitCode("00000");

        expect(result.isFailed()).toBe(true);
        expect(result.error).toBeInstanceOf(AuthFlowErrorV2);
        expect(result.error?.isInvalidCode()).toBe(true);
        expect(fetch).toHaveBeenCalledTimes(4);
    });

    it("surfaces an invalid-password failure while awaiting a valid password", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(EMAIL_ONLY_START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(EMAIL_CHALLENGE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(VERIFY_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse(
                    {
                        error: {
                            code: "invalidRequest",
                            message:
                                "AADSTS120002: New password doesn't meet complexity requirements.",
                            innerError: { code: "passwordTooWeak" },
                        },
                    },
                    400
                )
            );

        const startResult = await app.resetPasswordV2({
            username: "user@contoso.com",
        });
        const verifyResult = await (
            startResult.state as CodeRequiredStateV2
        ).submitCode("123456");
        const result = await (
            verifyResult.state as NewPasswordRequiredStateV2
        ).submitNewPassword("weak");

        expect(result.isFailed()).toBe(true);
        expect(result.error).toBeInstanceOf(AuthFlowErrorV2);
        expect(result.error?.isInvalidPassword()).toBe(true);
        expect(fetch).toHaveBeenCalledTimes(5);
    });

    it("surfaces a browser-required failure when the server asks for web fallback", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(EMAIL_ONLY_START_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse(
                    {
                        error: "invalid_grant",
                        error_description:
                            "AADSTS55214: Non-retryable error has occurred.",
                        error_codes: [55214],
                        suberror: "web_redirect_required",
                    },
                    400
                )
            );

        const result = await app.resetPasswordV2({
            username: "user@contoso.com",
        });

        expect(result.isFailed()).toBe(true);
        expect(result.error).toBeInstanceOf(AuthFlowErrorV2);
        expect(result.error?.isBrowserRequired()).toBe(true);
        expect(fetch).toHaveBeenCalledTimes(3);
    });
});

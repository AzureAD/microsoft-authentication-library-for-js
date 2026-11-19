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
import { MFAVerificationRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/MFAVerificationRequiredStateV2.js";
import { INVALID_HAL_RESPONSE } from "../../../src/custom_auth/core/network_client/custom_auth_api/v2/ErrorCodesV2.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";
import { TestServerTokenResponse } from "../test_resources/TestConstants.js";
import { CustomAuthApiClientV2 } from "../../../src/custom_auth/core/network_client/custom_auth_api/v2/CustomAuthApiClientV2.js";
import { CustomAuthApiError } from "../../../src/custom_auth/core/error/CustomAuthApiError.js";
import {
    ENTRY_RESPONSE,
    EMAIL_ONLY_START_RESPONSE,
    SMS_ONLY_START_RESPONSE,
    EMAIL_AND_SMS_START_RESPONSE,
    EMAIL_CHALLENGE_RESPONSE,
    SMS_CHALLENGE_RESPONSE,
    SMS_RISK_VERIFY_RESPONSE,
    SMS_RESEND_CHALLENGE_RESPONSE,
    SMS_RESEND_RISK_VERIFY_RESPONSE,
    VERIFY_RESPONSE,
    UPDATE_RESPONSE,
    POLL_COMPLETED_RESPONSE,
    POLL_MFA_REQUIRED_RESPONSE,
    MFA_EMAIL_CHALLENGE_RESPONSE,
    MFA_VERIFY_RESPONSE,
    POLL_ENROLL_REQUIRED_RESPONSE,
    ENROLL_ACTIVATION_RESPONSE,
    ACTIVATED_CONTINUE_RESPONSE,
} from "./ResetPasswordV2Constants.js";

const createApiMocks = () => {
    const unexpected = new Error("Unexpected V2 API call in reset test");
    return {
        signInStart: jest
            .spyOn(CustomAuthApiClientV2.prototype, "signInStart")
            .mockRejectedValue(unexpected),
        signUpStart: jest
            .spyOn(CustomAuthApiClientV2.prototype, "signUpStart")
            .mockRejectedValue(unexpected),
        submitSignUpAttributes: jest
            .spyOn(CustomAuthApiClientV2.prototype, "submitSignUpAttributes")
            .mockRejectedValue(unexpected),
        resendAuthMethodRegistrationChallenge: jest
            .spyOn(
                CustomAuthApiClientV2.prototype,
                "resendAuthMethodRegistrationChallenge"
            )
            .mockRejectedValue(unexpected),
        authorizeChallengeStart: jest
            .spyOn(CustomAuthApiClientV2.prototype, "authorizeChallengeStart")
            .mockRejectedValue(unexpected),
        resetPasswordStart: jest
            .spyOn(CustomAuthApiClientV2.prototype, "resetPasswordStart")
            .mockRejectedValue(unexpected),
        requestChallenge: jest
            .spyOn(CustomAuthApiClientV2.prototype, "requestChallenge")
            .mockRejectedValue(unexpected),
        verifyRisk: jest
            .spyOn(CustomAuthApiClientV2.prototype, "verifyRisk")
            .mockRejectedValue(unexpected),
        verifyChallenge: jest
            .spyOn(CustomAuthApiClientV2.prototype, "verifyChallenge")
            .mockRejectedValue(unexpected),
        submitNewPassword: jest
            .spyOn(CustomAuthApiClientV2.prototype, "submitNewPassword")
            .mockRejectedValue(unexpected),
        poll: jest
            .spyOn(CustomAuthApiClientV2.prototype, "poll")
            .mockRejectedValue(unexpected),
        completeWithTokens: jest
            .spyOn(CustomAuthApiClientV2.prototype, "completeWithTokens")
            .mockRejectedValue(unexpected),
        enrollAuthMethod: jest
            .spyOn(CustomAuthApiClientV2.prototype, "enrollAuthMethod")
            .mockRejectedValue(unexpected),
        activateAuthMethod: jest
            .spyOn(CustomAuthApiClientV2.prototype, "activateAuthMethod")
            .mockRejectedValue(unexpected),
    };
};

describe("Reset password V2 (SSPR)", () => {
    let app: CustomAuthPublicClientApplication;
    let apiClient: ReturnType<typeof createApiMocks>;

    beforeEach(async () => {
        apiClient = createApiMocks();
        app = (await CustomAuthPublicClientApplication.create(
            customAuthConfig
        )) as CustomAuthPublicClientApplication;
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

        jest.restoreAllMocks();
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
        expect(app.getAllAccounts()).toHaveLength(1);
        expect(apiClient.completeWithTokens).toHaveBeenCalledWith(
            {
                continuationToken: "ct-poll",
                continueHref: POLL_COMPLETED_RESPONSE.continueHref,
            },
            expect.anything()
        );
    };

    const reachResetMfaSelection =
        async (): Promise<AuthMethodSelectionRequiredStateV2> => {
            apiClient.authorizeChallengeStart.mockResolvedValueOnce(
                ENTRY_RESPONSE
            );
            apiClient.resetPasswordStart.mockResolvedValueOnce(
                EMAIL_ONLY_START_RESPONSE
            );
            apiClient.requestChallenge.mockResolvedValueOnce(
                EMAIL_CHALLENGE_RESPONSE
            );
            apiClient.verifyChallenge.mockResolvedValueOnce(VERIFY_RESPONSE);
            apiClient.submitNewPassword.mockResolvedValueOnce(UPDATE_RESPONSE);
            apiClient.poll.mockResolvedValueOnce(POLL_MFA_REQUIRED_RESPONSE);

            const start = await app.resetPasswordV2({
                username: "user@contoso.com",
                scopes: ["openid"],
            });
            if (!start.isState("codeRequired")) {
                throw new Error("Expected first-factor verification.");
            }
            const verified = await start.state.submitCode("123456");
            if (!verified.isState("newPasswordRequired")) {
                throw new Error("Expected a new password.");
            }
            const selection = await verified.state.submitNewPassword(
                "new-valid-password"
            );
            if (!selection.isState("authMethodSelectionRequired")) {
                throw new Error("Expected reset MFA selection.");
            }
            expect(apiClient.poll).toHaveBeenCalledTimes(1);
            expect(apiClient.verifyChallenge).toHaveBeenCalledTimes(1);
            expect(apiClient.completeWithTokens).not.toHaveBeenCalled();
            expect(app.getAllAccounts()).toHaveLength(0);
            return selection.state;
        };

    it("completes password reset after automatically challenging the only Email method", async () => {
        apiClient.authorizeChallengeStart.mockResolvedValueOnce(ENTRY_RESPONSE);
        apiClient.resetPasswordStart.mockResolvedValueOnce(
            EMAIL_ONLY_START_RESPONSE
        );
        apiClient.requestChallenge.mockResolvedValueOnce(
            EMAIL_CHALLENGE_RESPONSE
        );
        apiClient.verifyChallenge.mockResolvedValueOnce(VERIFY_RESPONSE);
        apiClient.submitNewPassword.mockResolvedValueOnce(UPDATE_RESPONSE);
        apiClient.poll.mockResolvedValueOnce(POLL_COMPLETED_RESPONSE);
        apiClient.completeWithTokens.mockResolvedValueOnce(
            TestServerTokenResponse
        );

        const startResult = await app.resetPasswordV2({
            username: "user@contoso.com",
        });
        if (!startResult.isState("codeRequired")) {
            throw new Error("Expected a reset verification code.");
        }

        const codeState = startResult.state;
        expect(codeState.method?.id).toBe("email");
        expect(codeState.channel).toBe("email");

        await completePasswordReset(codeState);

        expect(apiClient.requestChallenge).toHaveBeenCalledTimes(1);
    });

    it("completes password reset after automatically challenging the only Email method and resending the code", async () => {
        apiClient.authorizeChallengeStart.mockResolvedValueOnce(ENTRY_RESPONSE);
        apiClient.resetPasswordStart.mockResolvedValueOnce(
            EMAIL_ONLY_START_RESPONSE
        );
        apiClient.requestChallenge.mockResolvedValueOnce(
            EMAIL_CHALLENGE_RESPONSE
        );
        apiClient.requestChallenge.mockResolvedValueOnce({
            ...EMAIL_CHALLENGE_RESPONSE,
            continuationToken: "ct-email-resend",
        });
        apiClient.verifyChallenge.mockResolvedValueOnce(VERIFY_RESPONSE);
        apiClient.submitNewPassword.mockResolvedValueOnce(UPDATE_RESPONSE);
        apiClient.poll.mockResolvedValueOnce(POLL_COMPLETED_RESPONSE);
        apiClient.completeWithTokens.mockResolvedValueOnce(
            TestServerTokenResponse
        );

        const startResult = await app.resetPasswordV2({
            username: "user@contoso.com",
        });
        if (!startResult.isState("codeRequired")) {
            throw new Error("Expected a reset verification code.");
        }

        const codeState = startResult.state;
        expect(codeState.method?.id).toBe("email");
        expect(codeState.channel).toBe("email");

        const resent = await codeState.resendCode();
        if (!resent.isState("codeRequired")) {
            throw new Error("Expected a replacement reset code.");
        }
        await completePasswordReset(resent.state);

        expect(apiClient.requestChallenge).toHaveBeenNthCalledWith(
            2,
            EMAIL_CHALLENGE_RESPONSE.resendHref,
            { continuationToken: "ct-email-challenge" },
            expect.anything()
        );
        expect(apiClient.verifyChallenge).toHaveBeenCalledWith(
            EMAIL_CHALLENGE_RESPONSE.verifyHref,
            { continuationToken: "ct-email-resend", otp: "123456" },
            expect.anything()
        );
    });

    it.each([false, true])(
        "enrolls and activates a method after the final poll (in-progress poll: %s)",
        async (pollInProgress) => {
            apiClient.authorizeChallengeStart.mockResolvedValueOnce(
                ENTRY_RESPONSE
            );
            apiClient.resetPasswordStart.mockResolvedValueOnce(
                EMAIL_ONLY_START_RESPONSE
            );
            apiClient.requestChallenge.mockResolvedValueOnce(
                EMAIL_CHALLENGE_RESPONSE
            );
            apiClient.verifyChallenge.mockResolvedValueOnce(VERIFY_RESPONSE);
            apiClient.submitNewPassword.mockResolvedValueOnce(UPDATE_RESPONSE);
            if (pollInProgress) {
                apiClient.poll.mockResolvedValueOnce({
                    nextAction: "poll",
                    continuationToken: "ct-poll-in-progress",
                    pollHref: "/tenant/api/v0.1/poll-next",
                });
            }
            apiClient.poll.mockResolvedValueOnce(POLL_ENROLL_REQUIRED_RESPONSE);
            apiClient.enrollAuthMethod.mockResolvedValueOnce(
                ENROLL_ACTIVATION_RESPONSE
            );
            apiClient.activateAuthMethod.mockResolvedValueOnce(
                ACTIVATED_CONTINUE_RESPONSE
            );
            apiClient.completeWithTokens.mockResolvedValueOnce(
                TestServerTokenResponse
            );

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
            expect(apiClient.verifyChallenge).toHaveBeenCalledTimes(1);
            expect(apiClient.submitNewPassword).not.toHaveBeenCalled();

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
            expect(apiClient.poll).toHaveBeenCalledTimes(
                pollInProgress ? 2 : 1
            );
            expect(apiClient.poll).toHaveBeenNthCalledWith(
                1,
                "/tenant/api/v0.1/poll",
                { continuationToken: "ct-update" },
                expect.anything()
            );
            if (pollInProgress) {
                expect(apiClient.poll).toHaveBeenNthCalledWith(
                    2,
                    "/tenant/api/v0.1/poll-next",
                    { continuationToken: "ct-poll-in-progress" },
                    expect.anything()
                );
            }
            expect(apiClient.enrollAuthMethod).not.toHaveBeenCalled();
            const activation = await registration.state.selectAuthMethod(
                registration.state.methods[0],
                "user@contoso.com"
            );
            expect(activation.state).toBeInstanceOf(
                AuthMethodVerificationRequiredStateV2
            );
            if (!activation.isState("authMethodVerificationRequired")) {
                throw new Error("Expected method activation.");
            }

            const continuation = await activation.state.submitChallenge(
                "123456"
            );
            expect(continuation.data).toBeUndefined();
            expect(continuation.scenario).toBe("passwordReset");
            expect(app.getAllAccounts()).toHaveLength(0);
            expect(apiClient.activateAuthMethod).toHaveBeenCalledTimes(1);
            expect(apiClient.completeWithTokens).not.toHaveBeenCalled();
            if (!continuation.isState("signInContinuation")) {
                throw new Error("Expected explicit sign-in after activation.");
            }
            const completed = await continuation.state.signIn();
            expect(completed.isState("completed")).toBe(true);
            expect(completed.data).toBeInstanceOf(CustomAuthAccountData);
            expect(apiClient.enrollAuthMethod).toHaveBeenCalledWith(
                "/tenant/api/v0.1/enroll/email",
                { continuationToken: "ct-enroll", email: "user@contoso.com" },
                expect.anything()
            );
            expect(apiClient.activateAuthMethod).toHaveBeenCalledWith(
                "/tenant/api/v0.1/activate/email",
                { continuationToken: "ct-activation", otp: "123456" },
                expect.anything()
            );
            expect(apiClient.completeWithTokens).toHaveBeenCalledWith(
                {
                    continuationToken: "ct-activated",
                    continueHref: ACTIVATED_CONTINUE_RESPONSE.continueHref,
                },
                expect.anything()
            );
        }
    );

    it.each([false, true])(
        "completes password reset MFA with explicit sign-in (in-progress poll: %s)",
        async (pollInProgress) => {
            apiClient.authorizeChallengeStart.mockResolvedValueOnce(
                ENTRY_RESPONSE
            );
            apiClient.resetPasswordStart.mockResolvedValueOnce(
                EMAIL_ONLY_START_RESPONSE
            );
            apiClient.requestChallenge.mockResolvedValueOnce(
                EMAIL_CHALLENGE_RESPONSE
            );
            apiClient.verifyChallenge.mockResolvedValueOnce(VERIFY_RESPONSE);
            apiClient.submitNewPassword.mockResolvedValueOnce(UPDATE_RESPONSE);
            if (pollInProgress) {
                apiClient.poll.mockResolvedValueOnce({
                    nextAction: "poll",
                    continuationToken: "ct-poll-in-progress",
                    pollHref: "/tenant/api/v0.1/poll-next",
                });
            }
            apiClient.poll.mockResolvedValueOnce(POLL_MFA_REQUIRED_RESPONSE);
            apiClient.requestChallenge.mockResolvedValueOnce(
                MFA_EMAIL_CHALLENGE_RESPONSE
            );
            apiClient.verifyChallenge.mockResolvedValueOnce(
                MFA_VERIFY_RESPONSE
            );
            apiClient.completeWithTokens.mockResolvedValueOnce(
                TestServerTokenResponse
            );

            const startResult = await app.resetPasswordV2({
                username: "user@contoso.com",
                scopes: ["openid"],
            });
            if (!startResult.isState("codeRequired")) {
                throw new Error("Expected a reset verification code.");
            }
            const verified = await startResult.state.submitCode("123456");
            if (!verified.isState("newPasswordRequired")) {
                throw new Error("Expected a new password.");
            }

            if (pollInProgress) {
                jest.useFakeTimers();
            }
            const selectionPromise =
                verified.state.submitNewPassword("new-valid-password");
            if (pollInProgress) {
                await jest.advanceTimersByTimeAsync(1500);
            }
            const selection = await selectionPromise;
            jest.useRealTimers();
            expect(selection.isState("authMethodSelectionRequired")).toBe(true);
            if (!selection.isState("authMethodSelectionRequired")) {
                throw new Error("Expected reset MFA method selection.");
            }
            expect(selection.state.methods).toHaveLength(1);

            const challenge = await selection.state.selectAuthMethod(
                selection.state.methods[0]
            );
            expect(challenge.state).toBeInstanceOf(
                MFAVerificationRequiredStateV2
            );
            if (!challenge.isState("mfaVerificationRequired")) {
                throw new Error("Expected reset MFA verification.");
            }

            const continuation = await challenge.state.submitChallenge(
                "654321"
            );
            expect(continuation.data).toBeUndefined();
            expect(continuation.scenario).toBe("passwordReset");
            expect(app.getAllAccounts()).toHaveLength(0);
            expect(apiClient.completeWithTokens).not.toHaveBeenCalled();
            if (!continuation.isState("signInContinuation")) {
                throw new Error("Expected explicit sign-in after MFA.");
            }
            const completed = await continuation.state.signIn();
            expect(completed.isState("completed")).toBe(true);
            expect(completed.data).toBeInstanceOf(CustomAuthAccountData);
            expect(completed.data?.getAccount()?.idToken).toBe(
                TestServerTokenResponse.id_token
            );
            expect(apiClient.poll).toHaveBeenCalledTimes(
                pollInProgress ? 2 : 1
            );
            expect(apiClient.poll).toHaveBeenNthCalledWith(
                1,
                "/tenant/api/v0.1/poll",
                { continuationToken: "ct-update" },
                expect.anything()
            );
            if (pollInProgress) {
                expect(apiClient.poll).toHaveBeenNthCalledWith(
                    2,
                    "/tenant/api/v0.1/poll-next",
                    { continuationToken: "ct-poll-in-progress" },
                    expect.anything()
                );
            }
            expect(apiClient.requestChallenge).toHaveBeenNthCalledWith(
                2,
                "/tenant/api/v0.1/mfa/email/challenge",
                { continuationToken: "ct-mfa-selection" },
                expect.anything()
            );
            expect(apiClient.verifyChallenge).toHaveBeenNthCalledWith(
                2,
                "/tenant/api/v0.1/mfa/email/verify",
                { continuationToken: "ct-mfa-challenge", otp: "654321" },
                expect.anything()
            );
            expect(apiClient.completeWithTokens).toHaveBeenCalledWith(
                {
                    continuationToken: "ct-mfa-verified",
                    continueHref: MFA_VERIFY_RESPONSE.continueHref,
                },
                expect.anything()
            );
        }
    );

    it("uses the refreshed MFA token and verify link after resending", async () => {
        const selection = await reachResetMfaSelection();
        apiClient.requestChallenge
            .mockResolvedValueOnce(MFA_EMAIL_CHALLENGE_RESPONSE)
            .mockResolvedValueOnce({
                ...MFA_EMAIL_CHALLENGE_RESPONSE,
                continuationToken: "ct-mfa-resent",
                codeLength: 8,
                hint: "r***@contoso.com",
                verifyHref: "/tenant/api/v0.1/mfa/email/verify-resent",
                resendHref: "/tenant/api/v0.1/mfa/email/resend-next",
            });
        apiClient.verifyChallenge.mockResolvedValueOnce(MFA_VERIFY_RESPONSE);
        apiClient.completeWithTokens.mockResolvedValueOnce(
            TestServerTokenResponse
        );

        const challenge = await selection.selectAuthMethod(
            selection.methods[0]
        );
        if (!challenge.isState("mfaVerificationRequired")) {
            throw new Error("Expected reset MFA verification.");
        }
        const resent = await challenge.state.resendChallenge();
        if (!resent.isState("mfaVerificationRequired")) {
            throw new Error("Expected refreshed MFA verification.");
        }
        expect(resent.state.codeLength).toBe(8);
        expect(resent.state.sentTo).toBe("r***@contoso.com");
        expect(app.getAllAccounts()).toHaveLength(0);
        const continuation = await resent.state.submitChallenge("12345678");
        expect(continuation.data).toBeUndefined();
        expect(app.getAllAccounts()).toHaveLength(0);
        expect(apiClient.completeWithTokens).not.toHaveBeenCalled();
        if (!continuation.isState("signInContinuation")) {
            throw new Error("Expected explicit sign-in after MFA resend.");
        }
        const completed = await continuation.state.signIn();
        expect(completed.isState("completed")).toBe(true);
        expect(completed.data).toBeInstanceOf(CustomAuthAccountData);

        expect(apiClient.completeWithTokens).toHaveBeenCalledTimes(1);
        expect(apiClient.requestChallenge).toHaveBeenNthCalledWith(
            3,
            "/tenant/api/v0.1/mfa/email/resend",
            { continuationToken: "ct-mfa-challenge" },
            expect.anything()
        );
        expect(apiClient.verifyChallenge).toHaveBeenNthCalledWith(
            2,
            "/tenant/api/v0.1/mfa/email/verify-resent",
            { continuationToken: "ct-mfa-resent", otp: "12345678" },
            expect.anything()
        );
    });

    it.each(["selection", "resend", "verification"] as const)(
        "rejects enrollment after MFA %s without caching an account",
        async (step) => {
            const selection = await reachResetMfaSelection();
            const invalidChallenge = new CustomAuthApiError(
                INVALID_HAL_RESPONSE,
                "Enrollment is not a challenge response",
                "corr-1"
            );
            if (step === "selection") {
                apiClient.requestChallenge.mockRejectedValueOnce(
                    invalidChallenge
                );
            } else {
                apiClient.requestChallenge.mockResolvedValueOnce(
                    MFA_EMAIL_CHALLENGE_RESPONSE
                );
                if (step === "resend") {
                    apiClient.requestChallenge.mockRejectedValueOnce(
                        invalidChallenge
                    );
                } else {
                    apiClient.verifyChallenge.mockResolvedValueOnce(
                        POLL_ENROLL_REQUIRED_RESPONSE
                    );
                }
            }
            const challenge = await selection.selectAuthMethod(
                selection.methods[0]
            );
            if (
                step !== "selection" &&
                !challenge.isState("mfaVerificationRequired")
            ) {
                throw new Error("Expected reset MFA verification.");
            }
            const result = challenge.isState("mfaVerificationRequired")
                ? step === "resend"
                    ? await challenge.state.resendChallenge()
                    : await challenge.state.submitChallenge("654321")
                : challenge;

            expect(result.isFailed()).toBe(true);
            expect(result.error).toBeInstanceOf(AuthFlowErrorV2);
            expect(result.data).toBeUndefined();
            expect(app.getAllAccounts()).toHaveLength(0);
            expect(apiClient.requestChallenge).toHaveBeenCalledTimes(
                step === "resend" ? 3 : 2
            );
            expect(apiClient.completeWithTokens).not.toHaveBeenCalled();
        }
    );

    it.each([
        {
            name: "invalid OTP",
            response: new CustomAuthApiError(
                "invalidGrant",
                "Synthetic rejected verification code.",
                "corr-1"
            ),
            rejectToken: false,
        },
        {
            name: "expired continuation",
            response: new CustomAuthApiError(
                "invalidRequest",
                "Synthetic expired continuation.",
                "corr-1"
            ),
            rejectToken: false,
        },
        {
            name: "unexpected update",
            response: VERIFY_RESPONSE,
            rejectToken: false,
        },
        {
            name: "unexpected risk verification",
            response: new CustomAuthApiError(
                INVALID_HAL_RESPONSE,
                "Unexpected risk verification response.",
                "corr-1"
            ),
            rejectToken: false,
        },
        {
            name: "rejected token exchange",
            response: MFA_VERIFY_RESPONSE,
            rejectToken: true,
        },
    ])(
        "does not complete or cache an account after MFA $name",
        async ({ response, rejectToken }) => {
            const selection = await reachResetMfaSelection();
            apiClient.requestChallenge.mockResolvedValueOnce(
                MFA_EMAIL_CHALLENGE_RESPONSE
            );
            if (response instanceof CustomAuthApiError) {
                apiClient.verifyChallenge.mockRejectedValueOnce(response);
            } else {
                apiClient.verifyChallenge.mockResolvedValueOnce(response);
            }
            if (rejectToken) {
                apiClient.completeWithTokens.mockRejectedValueOnce(
                    new CustomAuthApiError(
                        "invalid_grant",
                        "Synthetic token exchange rejection.",
                        "corr-1",
                        undefined,
                        undefined
                    )
                );
            }

            const challenge = await selection.selectAuthMethod(
                selection.methods[0]
            );
            if (!challenge.isState("mfaVerificationRequired")) {
                throw new Error("Expected reset MFA verification.");
            }
            const verification = await challenge.state.submitChallenge(
                "654321"
            );
            if (rejectToken) {
                expect(verification.isState("signInContinuation")).toBe(true);
                expect(app.getAllAccounts()).toHaveLength(0);
                expect(apiClient.completeWithTokens).not.toHaveBeenCalled();
            }
            const result = verification.isState("signInContinuation")
                ? await verification.state.signIn()
                : verification;
            expect(result.isFailed()).toBe(true);
            expect(result.error).toBeInstanceOf(AuthFlowErrorV2);
            expect(result.data).toBeUndefined();
            expect(app.getAllAccounts()).toHaveLength(0);
            expect(apiClient.completeWithTokens).toHaveBeenCalledTimes(
                rejectToken ? 1 : 0
            );
            expect(apiClient.verifyChallenge).toHaveBeenNthCalledWith(
                2,
                "/tenant/api/v0.1/mfa/email/verify",
                { continuationToken: "ct-mfa-challenge", otp: "654321" },
                expect.anything()
            );
        }
    );

    it.each([
        { state: "continue", action: "future-action" },
        { state: "future-state" },
    ])(
        "rejects an unsupported poll response %j without retrying",
        async (body) => {
            const error = new CustomAuthApiError(
                INVALID_HAL_RESPONSE,
                `Unsupported poll response: ${JSON.stringify(body)}`,
                "corr-1"
            );
            apiClient.authorizeChallengeStart.mockResolvedValueOnce(
                ENTRY_RESPONSE
            );
            apiClient.resetPasswordStart.mockResolvedValueOnce(
                EMAIL_ONLY_START_RESPONSE
            );
            apiClient.requestChallenge.mockResolvedValueOnce(
                EMAIL_CHALLENGE_RESPONSE
            );
            apiClient.verifyChallenge.mockResolvedValueOnce(VERIFY_RESPONSE);
            apiClient.submitNewPassword.mockResolvedValueOnce(UPDATE_RESPONSE);
            apiClient.poll.mockRejectedValueOnce(error);

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
                errorDescription: error.errorDescription,
            });
            expect(result.isState("failed")).toBe(true);
            expect(apiClient.poll).toHaveBeenCalledTimes(1);
            expect(apiClient.completeWithTokens).not.toHaveBeenCalled();
        }
    );

    it("rejects enrollment before a new password is submitted", async () => {
        apiClient.authorizeChallengeStart.mockResolvedValueOnce(ENTRY_RESPONSE);
        apiClient.resetPasswordStart.mockResolvedValueOnce(
            EMAIL_ONLY_START_RESPONSE
        );
        apiClient.requestChallenge.mockResolvedValueOnce(
            EMAIL_CHALLENGE_RESPONSE
        );
        apiClient.verifyChallenge.mockResolvedValueOnce(
            POLL_ENROLL_REQUIRED_RESPONSE
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
        expect(apiClient.verifyChallenge).toHaveBeenCalledTimes(1);
        expect(apiClient.submitNewPassword).not.toHaveBeenCalled();
        expect(apiClient.completeWithTokens).not.toHaveBeenCalled();
    });

    it("completes password reset after automatically challenging the only SMS method", async () => {
        apiClient.authorizeChallengeStart.mockResolvedValueOnce(ENTRY_RESPONSE);
        apiClient.resetPasswordStart.mockResolvedValueOnce(
            SMS_ONLY_START_RESPONSE
        );
        apiClient.requestChallenge.mockResolvedValueOnce(
            SMS_CHALLENGE_RESPONSE
        );
        apiClient.verifyRisk.mockResolvedValueOnce(SMS_RISK_VERIFY_RESPONSE);
        apiClient.verifyChallenge.mockResolvedValueOnce(VERIFY_RESPONSE);
        apiClient.submitNewPassword.mockResolvedValueOnce(UPDATE_RESPONSE);
        apiClient.poll.mockResolvedValueOnce(POLL_COMPLETED_RESPONSE);
        apiClient.completeWithTokens.mockResolvedValueOnce(
            TestServerTokenResponse
        );

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

        expect(apiClient.verifyRisk).toHaveBeenCalledWith(
            SMS_CHALLENGE_RESPONSE.riskVerifyHref,
            { continuationToken: "ct-sms-risk" },
            expect.anything()
        );
        expect(apiClient.verifyChallenge).toHaveBeenCalledWith(
            SMS_RISK_VERIFY_RESPONSE.verifyHref,
            { continuationToken: "ct-sms-verify", otp: "123456" },
            expect.anything()
        );
    });

    it("completes password reset after selecting Email from multiple methods", async () => {
        apiClient.authorizeChallengeStart.mockResolvedValueOnce(ENTRY_RESPONSE);
        apiClient.resetPasswordStart.mockResolvedValueOnce(
            EMAIL_AND_SMS_START_RESPONSE
        );
        apiClient.requestChallenge.mockResolvedValueOnce(
            EMAIL_CHALLENGE_RESPONSE
        );
        apiClient.verifyChallenge.mockResolvedValueOnce(VERIFY_RESPONSE);
        apiClient.submitNewPassword.mockResolvedValueOnce(UPDATE_RESPONSE);
        apiClient.poll.mockResolvedValueOnce(POLL_COMPLETED_RESPONSE);
        apiClient.completeWithTokens.mockResolvedValueOnce(
            TestServerTokenResponse
        );

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

        expect(apiClient.requestChallenge).toHaveBeenCalledWith(
            emailMethod.challengeHref,
            { continuationToken: "ct-start" },
            expect.anything()
        );
    });

    it("completes password reset after selecting SMS and resending the code", async () => {
        apiClient.authorizeChallengeStart.mockResolvedValueOnce(ENTRY_RESPONSE);
        apiClient.resetPasswordStart.mockResolvedValueOnce(
            EMAIL_AND_SMS_START_RESPONSE
        );
        apiClient.requestChallenge.mockResolvedValueOnce(
            SMS_CHALLENGE_RESPONSE
        );
        apiClient.verifyRisk.mockResolvedValueOnce(SMS_RISK_VERIFY_RESPONSE);
        apiClient.requestChallenge.mockResolvedValueOnce(
            SMS_RESEND_CHALLENGE_RESPONSE
        );
        apiClient.verifyRisk.mockResolvedValueOnce(
            SMS_RESEND_RISK_VERIFY_RESPONSE
        );
        apiClient.verifyChallenge.mockResolvedValueOnce(VERIFY_RESPONSE);
        apiClient.submitNewPassword.mockResolvedValueOnce(UPDATE_RESPONSE);
        apiClient.poll.mockResolvedValueOnce(POLL_COMPLETED_RESPONSE);
        apiClient.completeWithTokens.mockResolvedValueOnce(
            TestServerTokenResponse
        );

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

        expect(apiClient.requestChallenge).toHaveBeenNthCalledWith(
            2,
            SMS_RISK_VERIFY_RESPONSE.resendHref,
            { continuationToken: "ct-sms-verify" },
            expect.anything()
        );
        expect(apiClient.verifyRisk).toHaveBeenNthCalledWith(
            2,
            SMS_RESEND_CHALLENGE_RESPONSE.riskVerifyHref,
            { continuationToken: "ct-sms-resend-risk" },
            expect.anything()
        );
    });

    it("surfaces a reset-disabled error when starting password reset", async () => {
        apiClient.authorizeChallengeStart.mockResolvedValueOnce(ENTRY_RESPONSE);
        apiClient.resetPasswordStart.mockRejectedValueOnce(
            new CustomAuthApiError(
                "invalidRequest",
                "AADSTS10040039: You can't reset your own password because password reset isn't turned on for your account.",
                "corr-1",
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                "passwordResetNotEnabledForUser"
            )
        );

        const result = await app.resetPasswordV2({
            username: "user@contoso.com",
        });

        expect(result.isFailed()).toBe(true);
        expect(result.error).toBeInstanceOf(AuthFlowErrorV2);
        expect(result.error?.isInvalidPassword()).toBe(false);
        expect(result.error?.innerErrorCode).toBe(
            "passwordResetNotEnabledForUser"
        );
        expect(apiClient.resetPasswordStart).toHaveBeenCalledTimes(1);
        expect(apiClient.requestChallenge).not.toHaveBeenCalled();
    });

    it("surfaces an invalid-code failure while awaiting a valid code", async () => {
        apiClient.authorizeChallengeStart.mockResolvedValueOnce(ENTRY_RESPONSE);
        apiClient.resetPasswordStart.mockResolvedValueOnce(
            EMAIL_ONLY_START_RESPONSE
        );
        apiClient.requestChallenge.mockResolvedValueOnce(
            EMAIL_CHALLENGE_RESPONSE
        );
        apiClient.verifyChallenge.mockRejectedValueOnce(
            new CustomAuthApiError(
                "invalidGrant",
                "AADSTS50181: Unable to validate the otp.",
                "corr-1",
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                "invalidOneTimeCode"
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
        expect(apiClient.verifyChallenge).toHaveBeenCalledWith(
            EMAIL_CHALLENGE_RESPONSE.verifyHref,
            { continuationToken: "ct-email-challenge", otp: "00000" },
            expect.anything()
        );
        expect(apiClient.submitNewPassword).not.toHaveBeenCalled();
    });

    it("surfaces an invalid-password failure while awaiting a valid password", async () => {
        apiClient.authorizeChallengeStart.mockResolvedValueOnce(ENTRY_RESPONSE);
        apiClient.resetPasswordStart.mockResolvedValueOnce(
            EMAIL_ONLY_START_RESPONSE
        );
        apiClient.requestChallenge.mockResolvedValueOnce(
            EMAIL_CHALLENGE_RESPONSE
        );
        apiClient.verifyChallenge.mockResolvedValueOnce(VERIFY_RESPONSE);
        apiClient.submitNewPassword.mockRejectedValueOnce(
            new CustomAuthApiError(
                "invalidRequest",
                "AADSTS120002: New password doesn't meet complexity requirements.",
                "corr-1",
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                "passwordTooWeak"
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
        expect(apiClient.submitNewPassword).toHaveBeenCalledWith(
            "/tenant/api/v0.1/update",
            { continuationToken: "ct-verify", newPassword: "weak" },
            expect.anything()
        );
        expect(apiClient.poll).not.toHaveBeenCalled();
    });

    it("surfaces a browser-required failure when the server asks for web fallback", async () => {
        apiClient.authorizeChallengeStart.mockResolvedValueOnce(ENTRY_RESPONSE);
        apiClient.resetPasswordStart.mockResolvedValueOnce(
            EMAIL_ONLY_START_RESPONSE
        );
        apiClient.requestChallenge.mockRejectedValueOnce(
            new CustomAuthApiError(
                "invalid_grant",
                "AADSTS55214: Non-retryable error has occurred.",
                "corr-1",
                [55214],
                "web_redirect_required"
            )
        );

        const result = await app.resetPasswordV2({
            username: "user@contoso.com",
        });

        expect(result.isFailed()).toBe(true);
        expect(result.error).toBeInstanceOf(AuthFlowErrorV2);
        expect(result.error?.isBrowserRequired()).toBe(true);
        expect(apiClient.requestChallenge).toHaveBeenCalledTimes(1);
        expect(apiClient.verifyChallenge).not.toHaveBeenCalled();
    });
});

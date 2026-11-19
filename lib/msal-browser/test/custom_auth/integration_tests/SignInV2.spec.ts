/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthPublicClientApplication } from "../../../src/custom_auth/CustomAuthPublicClientApplication.js";
import { CustomAuthStandardController } from "../../../src/custom_auth/controller/CustomAuthStandardController.js";
import { PasswordRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/PasswordRequiredStateV2.js";
import { CompletedStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/CompletedStateV2.js";
import { AuthMethodSelectionRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/AuthMethodSelectionRequiredStateV2.js";
import { CodeRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/CodeRequiredStateV2.js";
import { AuthFlowErrorV2 } from "../../../src/custom_auth/core/auth_flow/v2/error/AuthFlowErrorV2.js";
import { MFAVerificationRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/MFAVerificationRequiredStateV2.js";
import { CustomAuthAccountData } from "../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import {
    AuthMethodRegistrationRequiredStateV2,
    AuthMethodVerificationRequiredStateV2,
} from "../../../src/custom_auth/index.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";
import { TestServerTokenResponse } from "../test_resources/TestConstants.js";
import { CustomAuthApiClientV2 } from "../../../src/custom_auth/core/network_client/custom_auth_api/v2/CustomAuthApiClientV2.js";
import { CustomAuthApiError } from "../../../src/custom_auth/core/error/CustomAuthApiError.js";
import {
    MFA_V2_RESEND_CHALLENGE,
    MFA_V2_SELECT_AUTH_METHOD,
    MFA_V2_SUBMIT_CHALLENGE,
    SIGN_IN_V2_CHALLENGE,
    SIGN_IN_V2_COMPLETE,
    SIGN_IN_V2_START,
    SIGN_IN_V2_SUBMIT_PASSWORD,
} from "../../../src/custom_auth/core/telemetry/PublicApiId.js";
import {
    ENTRY_RESULT as ENTRY_RESPONSE,
    START_RESULT as START_RESPONSE,
    EMAIL_START_RESULT as EMAIL_START_RESPONSE,
    PASSWORD_AND_EMAIL_START_RESULT as PASSWORD_AND_EMAIL_START_RESPONSE,
    PASSWORD_EMAIL_AND_SMS_START_RESULT as PASSWORD_EMAIL_AND_SMS_START_RESPONSE,
    PASSWORD_METHOD_RESULT as passwordMethod,
    PASSWORD_CHALLENGE_RESULT as PASSWORD_CHALLENGE_RESPONSE,
    EMAIL_CHALLENGE_RESULT as EMAIL_CHALLENGE_RESPONSE,
    EMAIL_RESEND_RESULT as EMAIL_RESEND_RESPONSE,
    SMS_CHALLENGE_RESULT as SMS_CHALLENGE_RESPONSE,
    SIGN_IN_CONTINUE_RESULT as SIGN_IN_CONTINUE_RESPONSE,
    EMAIL_REGISTRATION_REQUIRED_RESULT as EMAIL_REGISTRATION_REQUIRED_RESPONSE,
    PHONE_REGISTRATION_REQUIRED_RESULT as PHONE_REGISTRATION_REQUIRED_RESPONSE,
    EMAIL_REGISTRATION_ACTIVATION_RESULT as EMAIL_REGISTRATION_ACTIVATION_RESPONSE,
    PHONE_REGISTRATION_ACTIVATION_RESULT as PHONE_REGISTRATION_ACTIVATION_RESPONSE,
    EMAIL_MFA_REQUIRED_RESULT as EMAIL_MFA_REQUIRED_RESPONSE,
    SMS_MFA_REQUIRED_RESULT as SMS_MFA_REQUIRED_RESPONSE,
    EMAIL_MFA_CHALLENGE_RESULT as EMAIL_MFA_CHALLENGE_RESPONSE,
    SMS_MFA_CHALLENGE_RESULT as SMS_MFA_CHALLENGE_RESPONSE,
    SMS_MFA_RESEND_RESULT as SMS_MFA_RESEND_RESPONSE,
    MFA_VERIFY_RESULT as MFA_VERIFY_RESPONSE,
} from "./SignInV2Constants.js";

const createApiMocks = () => {
    const unexpected = new Error("Unexpected V2 API call in sign-in test");
    return {
        resetPasswordStart: jest
            .spyOn(CustomAuthApiClientV2.prototype, "resetPasswordStart")
            .mockRejectedValue(unexpected),
        signUpStart: jest
            .spyOn(CustomAuthApiClientV2.prototype, "signUpStart")
            .mockRejectedValue(unexpected),
        submitSignUpAttributes: jest
            .spyOn(CustomAuthApiClientV2.prototype, "submitSignUpAttributes")
            .mockRejectedValue(unexpected),
        verifyRisk: jest
            .spyOn(CustomAuthApiClientV2.prototype, "verifyRisk")
            .mockRejectedValue(unexpected),
        submitNewPassword: jest
            .spyOn(CustomAuthApiClientV2.prototype, "submitNewPassword")
            .mockRejectedValue(unexpected),
        poll: jest
            .spyOn(CustomAuthApiClientV2.prototype, "poll")
            .mockRejectedValue(unexpected),
        authorizeChallengeStart: jest
            .spyOn(CustomAuthApiClientV2.prototype, "authorizeChallengeStart")
            .mockRejectedValue(unexpected),
        signInStart: jest
            .spyOn(CustomAuthApiClientV2.prototype, "signInStart")
            .mockRejectedValue(unexpected),
        requestChallenge: jest
            .spyOn(CustomAuthApiClientV2.prototype, "requestChallenge")
            .mockRejectedValue(unexpected),
        verifyChallenge: jest
            .spyOn(CustomAuthApiClientV2.prototype, "verifyChallenge")
            .mockRejectedValue(unexpected),
        completeWithTokens: jest
            .spyOn(CustomAuthApiClientV2.prototype, "completeWithTokens")
            .mockRejectedValue(unexpected),
        enrollAuthMethod: jest
            .spyOn(CustomAuthApiClientV2.prototype, "enrollAuthMethod")
            .mockRejectedValue(unexpected),
        resendAuthMethodRegistrationChallenge: jest
            .spyOn(
                CustomAuthApiClientV2.prototype,
                "resendAuthMethodRegistrationChallenge"
            )
            .mockRejectedValue(unexpected),
        activateAuthMethod: jest
            .spyOn(CustomAuthApiClientV2.prototype, "activateAuthMethod")
            .mockRejectedValue(unexpected),
    };
};

describe("Sign-in V2", () => {
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
        controller["eventHandler"]["broadcastChannel"]?.close();
        jest.restoreAllMocks();
    });

    describe("single-factor completion", () => {
        describe("PasswordRequiredStateV2", () => {
            it("IT-SF-01: signInV2 -> passwordRequired -> completed", async () => {
                apiClient.authorizeChallengeStart.mockResolvedValueOnce(
                    ENTRY_RESPONSE
                );
                apiClient.signInStart.mockResolvedValueOnce(START_RESPONSE);
                apiClient.requestChallenge.mockResolvedValueOnce(
                    PASSWORD_CHALLENGE_RESPONSE
                );
                apiClient.verifyChallenge.mockResolvedValueOnce(
                    SIGN_IN_CONTINUE_RESPONSE
                );
                apiClient.completeWithTokens.mockResolvedValueOnce(
                    TestServerTokenResponse
                );

                const startResult = await app.signInV2({
                    username: "user@contoso.com",
                    scopes: ["User.Read"],
                });

                expect(startResult.isState("passwordRequired")).toBe(true);
                expect(startResult.state).toBeInstanceOf(
                    PasswordRequiredStateV2
                );

                const result = await (
                    startResult.state as PasswordRequiredStateV2
                ).submitPassword("valid-password");

                expect(result.isState("completed")).toBe(true);
                expect(result.state).toBeInstanceOf(CompletedStateV2);
                expect(result.data).toBeInstanceOf(CustomAuthAccountData);
                expect(app.getAllAccounts()).toHaveLength(1);
            });

            it.each(["valid-password", "", 42])(
                "IT-SF-02: ignores legacy upfront password %p until the requested state submits it",
                async (password) => {
                    apiClient.authorizeChallengeStart.mockResolvedValueOnce(
                        ENTRY_RESPONSE
                    );
                    apiClient.signInStart.mockResolvedValueOnce(START_RESPONSE);
                    apiClient.requestChallenge.mockResolvedValueOnce(
                        PASSWORD_CHALLENGE_RESPONSE
                    );
                    apiClient.verifyChallenge.mockResolvedValueOnce(
                        SIGN_IN_CONTINUE_RESPONSE
                    );
                    apiClient.completeWithTokens.mockResolvedValueOnce(
                        TestServerTokenResponse
                    );

                    const inputs = {
                        username: "user@contoso.com",
                        password,
                        scopes: ["User.Read"],
                    };
                    const startResult = await app.signInV2(inputs);

                    expect(startResult.isState("passwordRequired")).toBe(true);
                    expect(startResult.data).toBeUndefined();
                    expect(
                        apiClient.authorizeChallengeStart
                    ).toHaveBeenCalledTimes(1);
                    expect(apiClient.signInStart).toHaveBeenCalledWith(
                        ENTRY_RESPONSE.signInHref,
                        {
                            continuationToken: "ct-entry",
                            username: inputs.username,
                        },
                        expect.anything()
                    );
                    expect(apiClient.requestChallenge).toHaveBeenCalledWith(
                        passwordMethod.challengeHref,
                        { continuationToken: "ct-start" },
                        expect.anything()
                    );
                    expect(apiClient.verifyChallenge).not.toHaveBeenCalled();
                    if (!startResult.isState("passwordRequired")) {
                        throw new Error("Expected a password-required state.");
                    }
                    const result = await startResult.state.submitPassword(
                        "valid-password"
                    );
                    expect(result.isState("completed")).toBe(true);
                    expect(result.state).toBeInstanceOf(CompletedStateV2);
                    expect(result.data).toBeInstanceOf(CustomAuthAccountData);
                }
            );

            it("returns an invalid-password error from PasswordRequiredStateV2", async () => {
                apiClient.authorizeChallengeStart.mockResolvedValueOnce(
                    ENTRY_RESPONSE
                );
                apiClient.signInStart.mockResolvedValueOnce(START_RESPONSE);
                apiClient.requestChallenge.mockResolvedValueOnce(
                    PASSWORD_CHALLENGE_RESPONSE
                );
                apiClient.verifyChallenge.mockRejectedValueOnce(
                    new CustomAuthApiError(
                        "invalidGrant",
                        "AADSTS50126: Invalid username or password.",
                        "corr-1",
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        "invalidUserNameOrPassword"
                    )
                );

                const startResult = await app.signInV2({
                    username: "user@contoso.com",
                });
                const result = await (
                    startResult.state as PasswordRequiredStateV2
                ).submitPassword("incorrect");

                expect(result.isFailed()).toBe(true);
                expect(result.error).toBeInstanceOf(AuthFlowErrorV2);
                expect(result.error?.isInvalidPassword()).toBe(true);
                expect(apiClient.verifyChallenge).toHaveBeenCalledWith(
                    PASSWORD_CHALLENGE_RESPONSE.verifyHref,
                    {
                        continuationToken: "ct-password-challenge",
                        password: "incorrect",
                    },
                    expect.anything()
                );
                expect(apiClient.completeWithTokens).not.toHaveBeenCalled();
            });
        });

        describe("CodeRequiredStateV2", () => {
            it("IT-SF-03: signInV2 -> codeRequired(email) -> completed", async () => {
                apiClient.authorizeChallengeStart.mockResolvedValueOnce(
                    ENTRY_RESPONSE
                );
                apiClient.signInStart.mockResolvedValueOnce(
                    EMAIL_START_RESPONSE
                );
                apiClient.requestChallenge.mockResolvedValueOnce(
                    EMAIL_CHALLENGE_RESPONSE
                );
                apiClient.verifyChallenge.mockResolvedValueOnce(
                    SIGN_IN_CONTINUE_RESPONSE
                );
                apiClient.completeWithTokens.mockResolvedValueOnce(
                    TestServerTokenResponse
                );

                const startResult = await app.signInV2({
                    username: "user@contoso.com",
                    scopes: ["User.Read"],
                });

                expect(startResult.isState("codeRequired")).toBe(true);
                expect(startResult.state).toBeInstanceOf(CodeRequiredStateV2);

                const result = await (
                    startResult.state as CodeRequiredStateV2
                ).submitCode("123456");

                expect(result.isState("completed")).toBe(true);
                expect(result.state).toBeInstanceOf(CompletedStateV2);
                expect(result.data).toBeInstanceOf(CustomAuthAccountData);
            });

            it("IT-SF-04: signInV2 -> codeRequired(email) -> resendCode -> codeRequired -> completed", async () => {
                apiClient.authorizeChallengeStart.mockResolvedValueOnce(
                    ENTRY_RESPONSE
                );
                apiClient.signInStart.mockResolvedValueOnce(
                    EMAIL_START_RESPONSE
                );
                apiClient.requestChallenge.mockResolvedValueOnce(
                    EMAIL_CHALLENGE_RESPONSE
                );
                apiClient.requestChallenge.mockResolvedValueOnce(
                    EMAIL_RESEND_RESPONSE
                );
                apiClient.verifyChallenge.mockResolvedValueOnce(
                    SIGN_IN_CONTINUE_RESPONSE
                );
                apiClient.completeWithTokens.mockResolvedValueOnce(
                    TestServerTokenResponse
                );

                const startResult = await app.signInV2({
                    username: "user@contoso.com",
                });
                const resendResult = await (
                    startResult.state as CodeRequiredStateV2
                ).resendCode();

                expect(resendResult.isState("codeRequired")).toBe(true);
                expect(resendResult.state).toBeInstanceOf(CodeRequiredStateV2);
                if (resendResult.isState("codeRequired")) {
                    expect(resendResult.state.channel).toBe("email");
                    expect(resendResult.state.sentTo).toBe("u***@contoso.com");
                }

                const result = await (
                    resendResult.state as CodeRequiredStateV2
                ).submitCode("123456");

                expect(result.isState("completed")).toBe(true);
                expect(result.state).toBeInstanceOf(CompletedStateV2);
            });
        });

        describe("AuthMethodSelectionRequiredStateV2(SINGLE_FACTOR)", () => {
            it("IT-SF-05: signInV2 -> authMethodSelectionRequired(singleFactor) -> passwordRequired -> completed", async () => {
                apiClient.authorizeChallengeStart.mockResolvedValueOnce(
                    ENTRY_RESPONSE
                );
                apiClient.signInStart.mockResolvedValueOnce(
                    PASSWORD_AND_EMAIL_START_RESPONSE
                );
                apiClient.requestChallenge.mockResolvedValueOnce(
                    PASSWORD_CHALLENGE_RESPONSE
                );
                apiClient.verifyChallenge.mockResolvedValueOnce(
                    SIGN_IN_CONTINUE_RESPONSE
                );
                apiClient.completeWithTokens.mockResolvedValueOnce(
                    TestServerTokenResponse
                );

                const startResult = await app.signInV2({
                    username: "user@contoso.com",
                });

                expect(startResult.isState("authMethodSelectionRequired")).toBe(
                    true
                );
                expect(apiClient.requestChallenge).not.toHaveBeenCalled();
                const selectionState =
                    startResult.state as AuthMethodSelectionRequiredStateV2;
                const passwordMethod = selectionState.methods.find(
                    (method) => method.type === "password"
                );
                if (!passwordMethod) {
                    throw new Error(
                        "Expected a password authentication method."
                    );
                }

                const passwordResult = await selectionState.selectAuthMethod(
                    passwordMethod
                );

                expect(passwordResult.isState("passwordRequired")).toBe(true);
                expect(apiClient.requestChallenge).toHaveBeenCalledWith(
                    passwordMethod.challengeHref,
                    { continuationToken: "ct-start" },
                    expect.anything()
                );

                const result = await (
                    passwordResult.state as PasswordRequiredStateV2
                ).submitPassword("selected-password");

                expect(result.isState("completed")).toBe(true);
                expect(result.state).toBeInstanceOf(CompletedStateV2);
            });

            it("IT-SF-06: signInV2 -> authMethodSelectionRequired(singleFactor) -> codeRequired(email) -> completed", async () => {
                apiClient.authorizeChallengeStart.mockResolvedValueOnce(
                    ENTRY_RESPONSE
                );
                apiClient.signInStart.mockResolvedValueOnce(
                    PASSWORD_AND_EMAIL_START_RESPONSE
                );
                apiClient.requestChallenge.mockResolvedValueOnce(
                    EMAIL_CHALLENGE_RESPONSE
                );
                apiClient.verifyChallenge.mockResolvedValueOnce(
                    SIGN_IN_CONTINUE_RESPONSE
                );
                apiClient.completeWithTokens.mockResolvedValueOnce(
                    TestServerTokenResponse
                );

                const startResult = await app.signInV2({
                    username: "user@contoso.com",
                });
                expect(startResult.isState("authMethodSelectionRequired")).toBe(
                    true
                );
                expect(apiClient.requestChallenge).not.toHaveBeenCalled();
                const selectionState =
                    startResult.state as AuthMethodSelectionRequiredStateV2;
                const emailMethod = selectionState.methods.find(
                    (method) => method.type === "email"
                );
                if (!emailMethod) {
                    throw new Error("Expected an email authentication method.");
                }

                const codeResult = await selectionState.selectAuthMethod(
                    emailMethod
                );

                expect(codeResult.isState("codeRequired")).toBe(true);
                expect(codeResult.state).toBeInstanceOf(CodeRequiredStateV2);
                expect(apiClient.requestChallenge).toHaveBeenCalledWith(
                    emailMethod.challengeHref,
                    { continuationToken: "ct-start" },
                    expect.anything()
                );

                const result = await (
                    codeResult.state as CodeRequiredStateV2
                ).submitCode("123456");

                expect(result.isState("completed")).toBe(true);
                expect(result.state).toBeInstanceOf(CompletedStateV2);
            });
        });
    });

    describe("JIT registration after sign-in verification", () => {
        it("signInV2 -> passwordRequired -> register email -> resend activation -> completed", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValueOnce(
                ENTRY_RESPONSE
            );
            apiClient.signInStart.mockResolvedValueOnce(START_RESPONSE);
            apiClient.requestChallenge.mockResolvedValueOnce(
                PASSWORD_CHALLENGE_RESPONSE
            );
            apiClient.verifyChallenge.mockResolvedValueOnce(
                EMAIL_REGISTRATION_REQUIRED_RESPONSE
            );
            apiClient.enrollAuthMethod.mockResolvedValueOnce(
                EMAIL_REGISTRATION_ACTIVATION_RESPONSE
            );
            apiClient.resendAuthMethodRegistrationChallenge.mockResolvedValueOnce(
                {
                    ...EMAIL_REGISTRATION_ACTIVATION_RESPONSE,
                    continuationToken: "ct-email-resend",
                    codeLength: 8,
                }
            );
            apiClient.activateAuthMethod.mockResolvedValueOnce(
                SIGN_IN_CONTINUE_RESPONSE
            );
            apiClient.completeWithTokens.mockResolvedValueOnce(
                TestServerTokenResponse
            );

            const startResult = await app.signInV2({
                username: "user@contoso.com",
                scopes: ["User.Read"],
            });
            expect(startResult.isState("passwordRequired")).toBe(true);
            if (!startResult.isState("passwordRequired")) {
                throw new Error("Expected a password challenge.");
            }

            const registrationResult = await startResult.state.submitPassword(
                "valid-password"
            );
            expect(
                registrationResult.isState("authMethodRegistrationRequired")
            ).toBe(true);
            if (!registrationResult.isState("authMethodRegistrationRequired")) {
                throw new Error("Expected authentication-method registration.");
            }
            expect(registrationResult.state).toBeInstanceOf(
                AuthMethodRegistrationRequiredStateV2
            );
            expect(registrationResult.state.methods).toMatchObject([
                { type: "email" },
            ]);

            const activationResult =
                await registrationResult.state.selectAuthMethod(
                    registrationResult.state.methods[0],
                    "user@contoso.com"
                );
            expect(
                activationResult.isState("authMethodVerificationRequired")
            ).toBe(true);
            if (!activationResult.isState("authMethodVerificationRequired")) {
                throw new Error("Expected an activation challenge.");
            }
            expect(activationResult.state).toBeInstanceOf(
                AuthMethodVerificationRequiredStateV2
            );
            expect(activationResult.state.codeLength).toBe(6);
            expect(activationResult.state.sentTo).toBe("u***@contoso.com");

            const resendResult = await activationResult.state.resendChallenge();
            expect(resendResult.isState("authMethodVerificationRequired")).toBe(
                true
            );
            if (!resendResult.isState("authMethodVerificationRequired")) {
                throw new Error("Expected a replacement activation challenge.");
            }
            expect(resendResult.state.codeLength).toBe(8);

            const result = await resendResult.state.submitChallenge("12345678");
            expect(result.isState("completed")).toBe(true);
            expect(result.data).toBeInstanceOf(CustomAuthAccountData);
            expect(apiClient.enrollAuthMethod).toHaveBeenCalledWith(
                "/tenant/api/v0.1/enroll/email",
                {
                    email: "user@contoso.com",
                    continuationToken: "ct-email-enroll",
                },
                expect.anything()
            );
            expect(
                apiClient.resendAuthMethodRegistrationChallenge
            ).toHaveBeenCalledWith(
                "/tenant/api/v0.1/enroll/email",
                { continuationToken: "ct-email-activate" },
                expect.anything()
            );
            expect(apiClient.activateAuthMethod).toHaveBeenCalledWith(
                "/tenant/api/v0.1/activate/email",
                { otp: "12345678", continuationToken: "ct-email-resend" },
                expect.anything()
            );
            expect(apiClient.completeWithTokens).toHaveBeenCalledTimes(1);
        });

        it("signInV2 -> passwordRequired -> register email -> completed", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValueOnce(
                ENTRY_RESPONSE
            );
            apiClient.signInStart.mockResolvedValueOnce(START_RESPONSE);
            apiClient.requestChallenge.mockResolvedValueOnce(
                PASSWORD_CHALLENGE_RESPONSE
            );
            apiClient.verifyChallenge.mockResolvedValueOnce(
                EMAIL_REGISTRATION_REQUIRED_RESPONSE
            );
            apiClient.enrollAuthMethod.mockResolvedValueOnce(
                EMAIL_REGISTRATION_ACTIVATION_RESPONSE
            );
            apiClient.activateAuthMethod.mockResolvedValueOnce(
                SIGN_IN_CONTINUE_RESPONSE
            );
            apiClient.completeWithTokens.mockResolvedValueOnce(
                TestServerTokenResponse
            );

            const startResult = await app.signInV2({
                username: "user@contoso.com",
                scopes: ["User.Read"],
            });
            if (!startResult.isState("passwordRequired")) {
                throw new Error("Expected a password-required state.");
            }
            const registrationResult = await startResult.state.submitPassword(
                "valid-password"
            );
            expect(
                registrationResult.isState("authMethodRegistrationRequired")
            ).toBe(true);
            if (!registrationResult.isState("authMethodRegistrationRequired")) {
                throw new Error("Expected authentication-method registration.");
            }

            const activationResult =
                await registrationResult.state.selectAuthMethod(
                    registrationResult.state.methods[0],
                    "user@contoso.com"
                );
            expect(
                activationResult.isState("authMethodVerificationRequired")
            ).toBe(true);
            if (!activationResult.isState("authMethodVerificationRequired")) {
                throw new Error("Expected an activation challenge.");
            }

            const result = await activationResult.state.submitChallenge(
                "123456"
            );
            expect(result.isState("completed")).toBe(true);
            expect(result.data).toBeInstanceOf(CustomAuthAccountData);
            expect(apiClient.completeWithTokens).toHaveBeenCalledTimes(1);
        });

        it("signInV2 -> codeRequired -> register SMS phone -> completed", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValueOnce(
                ENTRY_RESPONSE
            );
            apiClient.signInStart.mockResolvedValueOnce(EMAIL_START_RESPONSE);
            apiClient.requestChallenge.mockResolvedValueOnce(
                EMAIL_CHALLENGE_RESPONSE
            );
            apiClient.verifyChallenge.mockResolvedValueOnce(
                PHONE_REGISTRATION_REQUIRED_RESPONSE
            );
            apiClient.enrollAuthMethod.mockResolvedValueOnce(
                PHONE_REGISTRATION_ACTIVATION_RESPONSE
            );
            apiClient.activateAuthMethod.mockResolvedValueOnce(
                SIGN_IN_CONTINUE_RESPONSE
            );
            apiClient.completeWithTokens.mockResolvedValueOnce(
                TestServerTokenResponse
            );

            const startResult = await app.signInV2({
                username: "user@contoso.com",
                scopes: ["User.Read"],
            });
            expect(startResult.isState("codeRequired")).toBe(true);
            if (!startResult.isState("codeRequired")) {
                throw new Error("Expected an email code challenge.");
            }

            const registrationResult = await startResult.state.submitCode(
                "123456"
            );
            expect(
                registrationResult.isState("authMethodRegistrationRequired")
            ).toBe(true);
            if (!registrationResult.isState("authMethodRegistrationRequired")) {
                throw new Error("Expected authentication-method registration.");
            }
            expect(registrationResult.state.methods).toMatchObject([
                { type: "phone", channels: ["sms"] },
            ]);

            const activationResult =
                await registrationResult.state.selectAuthMethod(
                    registrationResult.state.methods[0],
                    "+15555551234"
                );
            expect(
                activationResult.isState("authMethodVerificationRequired")
            ).toBe(true);
            if (!activationResult.isState("authMethodVerificationRequired")) {
                throw new Error("Expected an activation challenge.");
            }
            expect(activationResult.state.type).toBe("phone");
            expect(activationResult.state.codeLength).toBe(6);

            const result = await activationResult.state.submitChallenge(
                "123456"
            );
            expect(result.isState("completed")).toBe(true);
            expect(result.data).toBeInstanceOf(CustomAuthAccountData);
            expect(apiClient.completeWithTokens).toHaveBeenCalledTimes(1);
            expect(apiClient.enrollAuthMethod).toHaveBeenCalledWith(
                "/tenant/api/v0.1/enroll/phone",
                {
                    phoneNumber: "+15555551234",
                    channel: "sms",
                    continuationToken: "ct-phone-enroll",
                },
                expect.anything()
            );
            expect(apiClient.activateAuthMethod).toHaveBeenCalledWith(
                "/tenant/api/v0.1/activate/phone",
                { continuationToken: "ct-phone-activate", otp: "123456" },
                expect.anything()
            );
        });
    });

    describe("MFA completion", () => {
        describe("after PasswordRequiredStateV2", () => {
            it("IT-MFA-01: signInV2 -> passwordRequired -> authMethodSelectionRequired(multiFactor: email) -> mfaVerificationRequired -> completed", async () => {
                apiClient.authorizeChallengeStart.mockResolvedValueOnce(
                    ENTRY_RESPONSE
                );
                apiClient.signInStart.mockResolvedValueOnce(START_RESPONSE);
                apiClient.requestChallenge.mockResolvedValueOnce(
                    PASSWORD_CHALLENGE_RESPONSE
                );
                apiClient.verifyChallenge.mockResolvedValueOnce(
                    EMAIL_MFA_REQUIRED_RESPONSE
                );
                apiClient.requestChallenge.mockResolvedValueOnce(
                    EMAIL_MFA_CHALLENGE_RESPONSE
                );
                apiClient.verifyChallenge.mockResolvedValueOnce(
                    MFA_VERIFY_RESPONSE
                );
                apiClient.completeWithTokens.mockResolvedValueOnce(
                    TestServerTokenResponse
                );

                const startResult = await app.signInV2({
                    username: "user@contoso.com",
                });
                const passwordResult = await (
                    startResult.state as PasswordRequiredStateV2
                ).submitPassword("valid-password");

                expect(
                    passwordResult.isState("authMethodSelectionRequired")
                ).toBe(true);
                const mfaSelectionState =
                    passwordResult.state as AuthMethodSelectionRequiredStateV2;
                expect(mfaSelectionState.methods[0].type).toBe("email");

                const challengeResult =
                    await mfaSelectionState.selectAuthMethod(
                        mfaSelectionState.methods[0]
                    );

                expect(challengeResult.isState("mfaVerificationRequired")).toBe(
                    true
                );

                const result = await (
                    challengeResult.state as MFAVerificationRequiredStateV2
                ).submitChallenge("123456");

                expect(result.isState("completed")).toBe(true);
                expect(result.state).toBeInstanceOf(CompletedStateV2);
            });

            it("IT-MFA-02: signInV2 -> passwordRequired -> authMethodSelectionRequired(multiFactor: sms) -> mfaVerificationRequired -> resendChallenge -> mfaVerificationRequired -> completed", async () => {
                apiClient.authorizeChallengeStart.mockResolvedValueOnce(
                    ENTRY_RESPONSE
                );
                apiClient.signInStart.mockResolvedValueOnce(START_RESPONSE);
                apiClient.requestChallenge.mockResolvedValueOnce(
                    PASSWORD_CHALLENGE_RESPONSE
                );
                apiClient.verifyChallenge.mockResolvedValueOnce(
                    SMS_MFA_REQUIRED_RESPONSE
                );
                apiClient.requestChallenge.mockResolvedValueOnce(
                    SMS_MFA_CHALLENGE_RESPONSE
                );
                apiClient.requestChallenge.mockResolvedValueOnce(
                    SMS_MFA_RESEND_RESPONSE
                );
                apiClient.verifyChallenge.mockResolvedValueOnce(
                    MFA_VERIFY_RESPONSE
                );
                apiClient.completeWithTokens.mockResolvedValueOnce(
                    TestServerTokenResponse
                );

                const startResult = await app.signInV2({
                    username: "user@contoso.com",
                });
                const passwordResult = await (
                    startResult.state as PasswordRequiredStateV2
                ).submitPassword("valid-password");
                const mfaSelectionState =
                    passwordResult.state as AuthMethodSelectionRequiredStateV2;

                expect(mfaSelectionState.methods[0].type).toBe("sms");

                const challengeResult =
                    await mfaSelectionState.selectAuthMethod(
                        mfaSelectionState.methods[0]
                    );
                const resendResult = await (
                    challengeResult.state as MFAVerificationRequiredStateV2
                ).resendChallenge();

                expect(resendResult.isState("mfaVerificationRequired")).toBe(
                    true
                );
                if (resendResult.isState("mfaVerificationRequired")) {
                    expect(resendResult.state.channel).toBe("sms");
                    expect(resendResult.state.sentTo).toBe("+1******1234");
                }

                const result = await (
                    resendResult.state as MFAVerificationRequiredStateV2
                ).submitChallenge("123456");

                expect(result.isState("completed")).toBe(true);
                expect(result.state).toBeInstanceOf(CompletedStateV2);

                const expectedApiIds = [
                    SIGN_IN_V2_START,
                    SIGN_IN_V2_START,
                    SIGN_IN_V2_CHALLENGE,
                    SIGN_IN_V2_SUBMIT_PASSWORD,
                    MFA_V2_SELECT_AUTH_METHOD,
                    MFA_V2_RESEND_CHALLENGE,
                    MFA_V2_SUBMIT_CHALLENGE,
                    SIGN_IN_V2_COMPLETE,
                ];
                const contexts = [
                    apiClient.authorizeChallengeStart.mock.calls[0][0],
                    apiClient.signInStart.mock.calls[0][2],
                    apiClient.requestChallenge.mock.calls[0][2],
                    apiClient.verifyChallenge.mock.calls[0][2],
                    apiClient.requestChallenge.mock.calls[1][2],
                    apiClient.requestChallenge.mock.calls[2][2],
                    apiClient.verifyChallenge.mock.calls[1][2],
                    apiClient.completeWithTokens.mock.calls[0][1],
                ];
                expect(apiClient.requestChallenge).toHaveBeenCalledTimes(3);
                expect(apiClient.verifyChallenge).toHaveBeenCalledTimes(2);
                expect(apiClient.completeWithTokens).toHaveBeenCalledTimes(1);
                expectedApiIds.forEach((apiId, index) => {
                    expect(
                        contexts[
                            index
                        ].telemetryManager.generateCurrentRequestHeaderValue()
                    ).toContain(`|${apiId},`);
                });
            });
        });

        describe("after CodeRequiredStateV2", () => {
            it("IT-MFA-03: signInV2 -> codeRequired(email) -> authMethodSelectionRequired(multiFactor) -> mfaVerificationRequired -> completed", async () => {
                apiClient.authorizeChallengeStart.mockResolvedValueOnce(
                    ENTRY_RESPONSE
                );
                apiClient.signInStart.mockResolvedValueOnce(
                    EMAIL_START_RESPONSE
                );
                apiClient.requestChallenge.mockResolvedValueOnce(
                    EMAIL_CHALLENGE_RESPONSE
                );
                apiClient.verifyChallenge.mockResolvedValueOnce(
                    EMAIL_MFA_REQUIRED_RESPONSE
                );
                apiClient.requestChallenge.mockResolvedValueOnce(
                    EMAIL_MFA_CHALLENGE_RESPONSE
                );
                apiClient.verifyChallenge.mockResolvedValueOnce(
                    MFA_VERIFY_RESPONSE
                );
                apiClient.completeWithTokens.mockResolvedValueOnce(
                    TestServerTokenResponse
                );

                const startResult = await app.signInV2({
                    username: "user@contoso.com",
                });
                const codeResult = await (
                    startResult.state as CodeRequiredStateV2
                ).submitCode("123456");

                expect(codeResult.isState("authMethodSelectionRequired")).toBe(
                    true
                );
                const mfaSelectionState =
                    codeResult.state as AuthMethodSelectionRequiredStateV2;
                const challengeResult =
                    await mfaSelectionState.selectAuthMethod(
                        mfaSelectionState.methods[0]
                    );

                expect(challengeResult.isState("mfaVerificationRequired")).toBe(
                    true
                );

                const result = await (
                    challengeResult.state as MFAVerificationRequiredStateV2
                ).submitChallenge("123456");

                expect(result.isState("completed")).toBe(true);
                expect(result.state).toBeInstanceOf(CompletedStateV2);
            });
        });

        describe("after AuthMethodSelectionRequiredStateV2(SINGLE_FACTOR)", () => {
            it("IT-MFA-04: signInV2 -> authMethodSelectionRequired(singleFactor) -> passwordRequired -> authMethodSelectionRequired(multiFactor) -> mfaVerificationRequired -> completed", async () => {
                apiClient.authorizeChallengeStart.mockResolvedValueOnce(
                    ENTRY_RESPONSE
                );
                apiClient.signInStart.mockResolvedValueOnce(
                    PASSWORD_AND_EMAIL_START_RESPONSE
                );
                apiClient.requestChallenge.mockResolvedValueOnce(
                    PASSWORD_CHALLENGE_RESPONSE
                );
                apiClient.verifyChallenge.mockResolvedValueOnce(
                    EMAIL_MFA_REQUIRED_RESPONSE
                );
                apiClient.requestChallenge.mockResolvedValueOnce(
                    EMAIL_MFA_CHALLENGE_RESPONSE
                );
                apiClient.verifyChallenge.mockResolvedValueOnce(
                    MFA_VERIFY_RESPONSE
                );
                apiClient.completeWithTokens.mockResolvedValueOnce(
                    TestServerTokenResponse
                );

                const startResult = await app.signInV2({
                    username: "user@contoso.com",
                });
                const primarySelectionState =
                    startResult.state as AuthMethodSelectionRequiredStateV2;
                const passwordMethod = primarySelectionState.methods.find(
                    (method) => method.type === "password"
                );
                if (!passwordMethod) {
                    throw new Error(
                        "Expected a password authentication method."
                    );
                }

                const passwordRequiredResult =
                    await primarySelectionState.selectAuthMethod(
                        passwordMethod
                    );
                const mfaSelectionResult = await (
                    passwordRequiredResult.state as PasswordRequiredStateV2
                ).submitPassword("valid-password");

                expect(
                    mfaSelectionResult.isState("authMethodSelectionRequired")
                ).toBe(true);
                const mfaSelectionState =
                    mfaSelectionResult.state as AuthMethodSelectionRequiredStateV2;
                const challengeResult =
                    await mfaSelectionState.selectAuthMethod(
                        mfaSelectionState.methods[0]
                    );

                const result = await (
                    challengeResult.state as MFAVerificationRequiredStateV2
                ).submitChallenge("123456");

                expect(result.isState("completed")).toBe(true);
                expect(result.state).toBeInstanceOf(CompletedStateV2);
            });

            it.each([
                {
                    primaryChannel: "email",
                    challengeResponse: EMAIL_CHALLENGE_RESPONSE,
                },
                {
                    primaryChannel: "sms",
                    challengeResponse: SMS_CHALLENGE_RESPONSE,
                },
            ])(
                "IT-MFA-05: signInV2 -> authMethodSelectionRequired(singleFactor) -> codeRequired($primaryChannel) -> authMethodSelectionRequired(multiFactor) -> mfaVerificationRequired -> completed",
                async ({ primaryChannel, challengeResponse }) => {
                    apiClient.authorizeChallengeStart.mockResolvedValueOnce(
                        ENTRY_RESPONSE
                    );
                    apiClient.signInStart.mockResolvedValueOnce(
                        PASSWORD_EMAIL_AND_SMS_START_RESPONSE
                    );
                    apiClient.requestChallenge.mockResolvedValueOnce(
                        challengeResponse
                    );
                    apiClient.verifyChallenge.mockResolvedValueOnce(
                        EMAIL_MFA_REQUIRED_RESPONSE
                    );
                    apiClient.requestChallenge.mockResolvedValueOnce(
                        EMAIL_MFA_CHALLENGE_RESPONSE
                    );
                    apiClient.verifyChallenge.mockResolvedValueOnce(
                        MFA_VERIFY_RESPONSE
                    );
                    apiClient.completeWithTokens.mockResolvedValueOnce(
                        TestServerTokenResponse
                    );

                    const startResult = await app.signInV2({
                        username: "user@contoso.com",
                    });
                    const primarySelectionState =
                        startResult.state as AuthMethodSelectionRequiredStateV2;
                    const primaryMethod = primarySelectionState.methods.find(
                        (method) => method.type === primaryChannel
                    );
                    if (!primaryMethod) {
                        throw new Error(
                            `Expected a ${primaryChannel} authentication method.`
                        );
                    }

                    const codeRequiredResult =
                        await primarySelectionState.selectAuthMethod(
                            primaryMethod
                        );

                    expect(codeRequiredResult.isState("codeRequired")).toBe(
                        true
                    );
                    if (codeRequiredResult.isState("codeRequired")) {
                        expect(codeRequiredResult.state.channel).toBe(
                            primaryChannel
                        );
                    }

                    const mfaSelectionResult = await (
                        codeRequiredResult.state as CodeRequiredStateV2
                    ).submitCode("123456");

                    expect(
                        mfaSelectionResult.isState(
                            "authMethodSelectionRequired"
                        )
                    ).toBe(true);
                    const mfaSelectionState =
                        mfaSelectionResult.state as AuthMethodSelectionRequiredStateV2;
                    const challengeResult =
                        await mfaSelectionState.selectAuthMethod(
                            mfaSelectionState.methods[0]
                        );

                    const result = await (
                        challengeResult.state as MFAVerificationRequiredStateV2
                    ).submitChallenge("123456");

                    expect(result.isState("completed")).toBe(true);
                    expect(result.state).toBeInstanceOf(CompletedStateV2);
                }
            );
        });

        describe("after requested password submission", () => {
            it("IT-MFA-06: signInV2 -> passwordRequired -> authMethodSelectionRequired(multiFactor) -> mfaVerificationRequired -> completed", async () => {
                apiClient.authorizeChallengeStart.mockResolvedValueOnce(
                    ENTRY_RESPONSE
                );
                apiClient.signInStart.mockResolvedValueOnce(START_RESPONSE);
                apiClient.requestChallenge.mockResolvedValueOnce(
                    PASSWORD_CHALLENGE_RESPONSE
                );
                apiClient.verifyChallenge.mockResolvedValueOnce(
                    EMAIL_MFA_REQUIRED_RESPONSE
                );
                apiClient.requestChallenge.mockResolvedValueOnce(
                    EMAIL_MFA_CHALLENGE_RESPONSE
                );
                apiClient.verifyChallenge.mockResolvedValueOnce(
                    MFA_VERIFY_RESPONSE
                );
                apiClient.completeWithTokens.mockResolvedValueOnce(
                    TestServerTokenResponse
                );

                const startResult = await app.signInV2({
                    username: "user@contoso.com",
                });
                if (!startResult.isState("passwordRequired")) {
                    throw new Error("Expected a password-required state.");
                }
                const mfaSelectionResult =
                    await startResult.state.submitPassword("valid-password");

                expect(
                    mfaSelectionResult.isState("authMethodSelectionRequired")
                ).toBe(true);
                const mfaSelectionState =
                    mfaSelectionResult.state as AuthMethodSelectionRequiredStateV2;
                const challengeResult =
                    await mfaSelectionState.selectAuthMethod(
                        mfaSelectionState.methods[0]
                    );

                const result = await (
                    challengeResult.state as MFAVerificationRequiredStateV2
                ).submitChallenge("123456");

                expect(result.isState("completed")).toBe(true);
                expect(result.state).toBeInstanceOf(CompletedStateV2);
            });
        });
    });
});

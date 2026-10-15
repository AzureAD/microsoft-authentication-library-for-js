/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthPublicClientApplication } from "../../../src/custom_auth/CustomAuthPublicClientApplication.js";
import { CustomAuthStandardController } from "../../../src/custom_auth/controller/CustomAuthStandardController.js";
import { PasswordRequiredStateV2 } from "../../../src/custom_auth/sign_in/auth_flow/v2/state/PasswordRequiredStateV2.js";
import { CompletedStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/CompletedStateV2.js";
import { AuthMethodSelectionRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/AuthMethodSelectionRequiredStateV2.js";
import { CodeRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/CodeRequiredStateV2.js";
import { MFAVerificationRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/MFAVerificationRequiredStateV2.js";
import { CustomAuthAccountData } from "../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";
import { TestServerTokenResponse } from "../test_resources/TestConstants.js";
import {
    CONTINUE_RESPONSE,
    EMAIL_CHALLENGE_RESPONSE,
    EMAIL_MFA_CHALLENGE_RESPONSE,
    EMAIL_MFA_REQUIRED_RESPONSE,
    EMAIL_RESEND_RESPONSE,
    EMAIL_START_RESPONSE,
    ENTRY_RESPONSE,
    MFA_VERIFY_RESPONSE,
    PASSWORD_AND_EMAIL_START_RESPONSE,
    PASSWORD_CHALLENGE_RESPONSE,
    PASSWORD_EMAIL_AND_SMS_START_RESPONSE,
    SIGN_IN_CONTINUE_RESPONSE,
    SMS_CHALLENGE_RESPONSE,
    SMS_MFA_CHALLENGE_RESPONSE,
    SMS_MFA_REQUIRED_RESPONSE,
    SMS_MFA_RESEND_RESPONSE,
    START_RESPONSE,
} from "./SignInV2Constants.js";

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

describe("Sign-in V2", () => {
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
        controller["eventHandler"]["broadcastChannel"]?.close();
        jest.clearAllMocks();
    });

    describe("single-factor completion", () => {
        describe("PasswordRequiredStateV2", () => {
            it("IT-SF-01: signInV2 -> passwordRequired -> completed", async () => {
                (fetch as jest.Mock)
                    .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
                    .mockResolvedValueOnce(buildResponse(START_RESPONSE))
                    .mockResolvedValueOnce(
                        buildResponse(PASSWORD_CHALLENGE_RESPONSE)
                    )
                    .mockResolvedValueOnce(
                        buildResponse(SIGN_IN_CONTINUE_RESPONSE)
                    )
                    .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
                    .mockResolvedValueOnce(
                        buildResponse(TestServerTokenResponse)
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
            });

            it("IT-SF-02: signInV2(password supplied) -> completed", async () => {
                (fetch as jest.Mock)
                    .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
                    .mockResolvedValueOnce(buildResponse(START_RESPONSE))
                    .mockResolvedValueOnce(
                        buildResponse(PASSWORD_CHALLENGE_RESPONSE)
                    )
                    .mockResolvedValueOnce(
                        buildResponse(SIGN_IN_CONTINUE_RESPONSE)
                    )
                    .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
                    .mockResolvedValueOnce(
                        buildResponse(TestServerTokenResponse)
                    );

                const result = await app.signInV2({
                    username: "user@contoso.com",
                    password: "valid-password",
                    scopes: ["User.Read"],
                });

                expect(result.isState("completed")).toBe(true);
                expect(result.state).toBeInstanceOf(CompletedStateV2);
                expect(result.data).toBeInstanceOf(CustomAuthAccountData);
            });
        });

        describe("CodeRequiredStateV2", () => {
            it("IT-SF-03: signInV2 -> codeRequired(email) -> completed", async () => {
                (fetch as jest.Mock)
                    .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
                    .mockResolvedValueOnce(buildResponse(EMAIL_START_RESPONSE))
                    .mockResolvedValueOnce(
                        buildResponse(EMAIL_CHALLENGE_RESPONSE)
                    )
                    .mockResolvedValueOnce(
                        buildResponse(SIGN_IN_CONTINUE_RESPONSE)
                    )
                    .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
                    .mockResolvedValueOnce(
                        buildResponse(TestServerTokenResponse)
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
                (fetch as jest.Mock)
                    .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
                    .mockResolvedValueOnce(buildResponse(EMAIL_START_RESPONSE))
                    .mockResolvedValueOnce(
                        buildResponse(EMAIL_CHALLENGE_RESPONSE)
                    )
                    .mockResolvedValueOnce(buildResponse(EMAIL_RESEND_RESPONSE))
                    .mockResolvedValueOnce(
                        buildResponse(SIGN_IN_CONTINUE_RESPONSE)
                    )
                    .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
                    .mockResolvedValueOnce(
                        buildResponse(TestServerTokenResponse)
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
                (fetch as jest.Mock)
                    .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
                    .mockResolvedValueOnce(
                        buildResponse(PASSWORD_AND_EMAIL_START_RESPONSE)
                    )
                    .mockResolvedValueOnce(
                        buildResponse(PASSWORD_CHALLENGE_RESPONSE)
                    )
                    .mockResolvedValueOnce(
                        buildResponse(SIGN_IN_CONTINUE_RESPONSE)
                    )
                    .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
                    .mockResolvedValueOnce(
                        buildResponse(TestServerTokenResponse)
                    );

                const startResult = await app.signInV2({
                    username: "user@contoso.com",
                });

                expect(startResult.isState("authMethodSelectionRequired")).toBe(
                    true
                );
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

                const result = await (
                    passwordResult.state as PasswordRequiredStateV2
                ).submitPassword("selected-password");

                expect(result.isState("completed")).toBe(true);
                expect(result.state).toBeInstanceOf(CompletedStateV2);
            });

            it("IT-SF-06: signInV2 -> authMethodSelectionRequired(singleFactor) -> codeRequired(email) -> completed", async () => {
                (fetch as jest.Mock)
                    .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
                    .mockResolvedValueOnce(
                        buildResponse(PASSWORD_AND_EMAIL_START_RESPONSE)
                    )
                    .mockResolvedValueOnce(
                        buildResponse(EMAIL_CHALLENGE_RESPONSE)
                    )
                    .mockResolvedValueOnce(
                        buildResponse(SIGN_IN_CONTINUE_RESPONSE)
                    )
                    .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
                    .mockResolvedValueOnce(
                        buildResponse(TestServerTokenResponse)
                    );

                const startResult = await app.signInV2({
                    username: "user@contoso.com",
                });
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

                const result = await (
                    codeResult.state as CodeRequiredStateV2
                ).submitCode("123456");

                expect(result.isState("completed")).toBe(true);
                expect(result.state).toBeInstanceOf(CompletedStateV2);
            });
        });
    });

    describe("MFA completion", () => {
        describe("after PasswordRequiredStateV2", () => {
            it("IT-MFA-01: signInV2 -> passwordRequired -> authMethodSelectionRequired(multiFactor: email) -> mfaVerificationRequired -> completed", async () => {
                (fetch as jest.Mock)
                    .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
                    .mockResolvedValueOnce(buildResponse(START_RESPONSE))
                    .mockResolvedValueOnce(
                        buildResponse(PASSWORD_CHALLENGE_RESPONSE)
                    )
                    .mockResolvedValueOnce(
                        buildResponse(EMAIL_MFA_REQUIRED_RESPONSE)
                    )
                    .mockResolvedValueOnce(
                        buildResponse(EMAIL_MFA_CHALLENGE_RESPONSE)
                    )
                    .mockResolvedValueOnce(buildResponse(MFA_VERIFY_RESPONSE))
                    .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
                    .mockResolvedValueOnce(
                        buildResponse(TestServerTokenResponse)
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
                (fetch as jest.Mock)
                    .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
                    .mockResolvedValueOnce(buildResponse(START_RESPONSE))
                    .mockResolvedValueOnce(
                        buildResponse(PASSWORD_CHALLENGE_RESPONSE)
                    )
                    .mockResolvedValueOnce(
                        buildResponse(SMS_MFA_REQUIRED_RESPONSE)
                    )
                    .mockResolvedValueOnce(
                        buildResponse(SMS_MFA_CHALLENGE_RESPONSE)
                    )
                    .mockResolvedValueOnce(
                        buildResponse(SMS_MFA_RESEND_RESPONSE)
                    )
                    .mockResolvedValueOnce(buildResponse(MFA_VERIFY_RESPONSE))
                    .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
                    .mockResolvedValueOnce(
                        buildResponse(TestServerTokenResponse)
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
            });
        });

        describe("after CodeRequiredStateV2", () => {
            it("IT-MFA-03: signInV2 -> codeRequired(email) -> authMethodSelectionRequired(multiFactor) -> mfaVerificationRequired -> completed", async () => {
                (fetch as jest.Mock)
                    .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
                    .mockResolvedValueOnce(buildResponse(EMAIL_START_RESPONSE))
                    .mockResolvedValueOnce(
                        buildResponse(EMAIL_CHALLENGE_RESPONSE)
                    )
                    .mockResolvedValueOnce(
                        buildResponse(EMAIL_MFA_REQUIRED_RESPONSE)
                    )
                    .mockResolvedValueOnce(
                        buildResponse(EMAIL_MFA_CHALLENGE_RESPONSE)
                    )
                    .mockResolvedValueOnce(buildResponse(MFA_VERIFY_RESPONSE))
                    .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
                    .mockResolvedValueOnce(
                        buildResponse(TestServerTokenResponse)
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
                (fetch as jest.Mock)
                    .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
                    .mockResolvedValueOnce(
                        buildResponse(PASSWORD_AND_EMAIL_START_RESPONSE)
                    )
                    .mockResolvedValueOnce(
                        buildResponse(PASSWORD_CHALLENGE_RESPONSE)
                    )
                    .mockResolvedValueOnce(
                        buildResponse(EMAIL_MFA_REQUIRED_RESPONSE)
                    )
                    .mockResolvedValueOnce(
                        buildResponse(EMAIL_MFA_CHALLENGE_RESPONSE)
                    )
                    .mockResolvedValueOnce(buildResponse(MFA_VERIFY_RESPONSE))
                    .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
                    .mockResolvedValueOnce(
                        buildResponse(TestServerTokenResponse)
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
                    (fetch as jest.Mock)
                        .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
                        .mockResolvedValueOnce(
                            buildResponse(PASSWORD_EMAIL_AND_SMS_START_RESPONSE)
                        )
                        .mockResolvedValueOnce(buildResponse(challengeResponse))
                        .mockResolvedValueOnce(
                            buildResponse(EMAIL_MFA_REQUIRED_RESPONSE)
                        )
                        .mockResolvedValueOnce(
                            buildResponse(EMAIL_MFA_CHALLENGE_RESPONSE)
                        )
                        .mockResolvedValueOnce(
                            buildResponse(MFA_VERIFY_RESPONSE)
                        )
                        .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
                        .mockResolvedValueOnce(
                            buildResponse(TestServerTokenResponse)
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

        describe("after automatic password submission", () => {
            it("IT-MFA-06: signInV2(password supplied) -> authMethodSelectionRequired(multiFactor) -> mfaVerificationRequired -> completed", async () => {
                (fetch as jest.Mock)
                    .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
                    .mockResolvedValueOnce(buildResponse(START_RESPONSE))
                    .mockResolvedValueOnce(
                        buildResponse(PASSWORD_CHALLENGE_RESPONSE)
                    )
                    .mockResolvedValueOnce(
                        buildResponse(EMAIL_MFA_REQUIRED_RESPONSE)
                    )
                    .mockResolvedValueOnce(
                        buildResponse(EMAIL_MFA_CHALLENGE_RESPONSE)
                    )
                    .mockResolvedValueOnce(buildResponse(MFA_VERIFY_RESPONSE))
                    .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
                    .mockResolvedValueOnce(
                        buildResponse(TestServerTokenResponse)
                    );

                const mfaSelectionResult = await app.signInV2({
                    username: "user@contoso.com",
                    password: "valid-password",
                });

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

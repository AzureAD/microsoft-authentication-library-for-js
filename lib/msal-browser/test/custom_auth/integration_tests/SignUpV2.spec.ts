/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthPublicClientApplication } from "../../../src/custom_auth/CustomAuthPublicClientApplication.js";
import { CustomAuthStandardController } from "../../../src/custom_auth/controller/CustomAuthStandardController.js";
import { CodeRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/CodeRequiredStateV2.js";
import { CompletedStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/CompletedStateV2.js";
import { FailedStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/FailedStateV2.js";
import { AttributesRequiredStateV2 } from "../../../src/custom_auth/sign_up/auth_flow/v2/state/AttributesRequiredStateV2.js";
import { PasswordRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/PasswordRequiredStateV2.js";
import * as customAuth from "../../../src/custom_auth/index.js";
import { SignInContinuationStateV2 } from "../../../src/custom_auth/sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";
import type {
    ResetPasswordInputsV2,
    SignInInputsV2,
    SignUpInputsV2,
} from "../../../src/custom_auth/index.js";
import type { FlowSignUpStartParamsV2 } from "../../../src/custom_auth/core/interaction_client/v2/parameter/FlowParamsV2.js";
import type { UserAccountAttributes } from "../../../src/custom_auth/UserAccountAttributes.js";
import type { AttributeValidationDetailV2 } from "../../../src/custom_auth/core/network_client/custom_auth_api/v2/response/ErrorResponsesV2.js";
import { CustomAuthAccountData } from "../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { AuthFlowErrorV2 } from "../../../src/custom_auth/core/auth_flow/v2/error/AuthFlowErrorV2.js";
import { UnexpectedError } from "../../../src/custom_auth/core/error/UnexpectedError.js";
import { CustomAuthApiError } from "../../../src/custom_auth/core/error/CustomAuthApiError.js";
import { CustomAuthError } from "../../../src/custom_auth/core/error/CustomAuthError.js";
import { UNSUPPORTED_FLOW_TRANSITION } from "../../../src/custom_auth/core/network_client/custom_auth_api/v2/ErrorCodesV2.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";
import { TestServerTokenResponse } from "../test_resources/TestConstants.js";
import {
    ACTIVATED_CONTINUE_RESPONSE,
    CONTINUE_RESPONSE,
    ENROLL_ACTIVATION_RESPONSE,
    ENROLL_REQUIRED_RESPONSE,
    ENTRY_RESPONSE,
    FLAT_USERNAME_REQUIRED_RESPONSE,
    PASSWORD_AND_PROFILE_REQUIRED_RESPONSE,
    PASSWORD_POLICY_ERROR_RESPONSE,
    START_RESPONSE,
    SYNTHETIC_EXISTING_ACCOUNT_EMAIL_CHALLENGE_RESPONSE,
    SYNTHETIC_EXISTING_ACCOUNT_EMAIL_START_RESPONSE,
    SYNTHETIC_EXISTING_ACCOUNT_MULTIPLE_METHODS_RESPONSE,
    SYNTHETIC_EXISTING_ACCOUNT_PASSWORD_START_RESPONSE,
    USERNAME_START_REQUEST,
    WEAK_PASSWORD_ERROR_RESPONSE,
} from "./SignUpV2Constants.js";
import {
    ENTRY_RESPONSE as SIGN_IN_ENTRY_RESPONSE,
    START_RESPONSE as SIGN_IN_START_RESPONSE,
    PASSWORD_CHALLENGE_RESPONSE,
    SMS_MFA_REQUIRED_RESPONSE,
    SMS_MFA_CHALLENGE_RESPONSE,
    SMS_MFA_RESEND_RESPONSE,
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

describe("Sign-up V2 agreed contract", () => {
    it("does not accept null scopes on any public V2 entry input", () => {
        const nullableScopesAllowed: [
            null extends SignInInputsV2["scopes"] ? true : false,
            null extends ResetPasswordInputsV2["scopes"] ? true : false,
            null extends SignUpInputsV2["scopes"] ? true : false,
            null extends FlowSignUpStartParamsV2["scopes"] ? true : false
        ] = [false, false, false, false];

        expect(nullableScopesAllowed).toEqual([false, false, false, false]);
    });

    it("does not expose an upfront password on public or internal start inputs", () => {
        const publicInputHasPassword: "password" extends keyof SignUpInputsV2
            ? true
            : false = false;
        const flowInputHasPassword: "password" extends keyof FlowSignUpStartParamsV2
            ? true
            : false = false;

        expect([publicInputHasPassword, flowInputHasPassword]).toEqual([
            false,
            false,
        ]);
    });

    it.todo(
        "IT-SU-15: surfaces unknown service errors and malformed or transport failures"
    );
    it.todo(
        "IT-SU-16: preserves JIT enrollment, activation, resend, and completion"
    );
});

describe("Sign-up V2 entry", () => {
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

    it("authenticates an existing account with an email code without submitting upfront profiles", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(
                buildResponse(SYNTHETIC_EXISTING_ACCOUNT_EMAIL_START_RESPONSE)
            )
            .mockResolvedValueOnce(
                buildResponse(
                    SYNTHETIC_EXISTING_ACCOUNT_EMAIL_CHALLENGE_RESPONSE
                )
            )
            .mockResolvedValueOnce(buildResponse(ACTIVATED_CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

        const startResult = await app.signUpV2({
            username: "existing@contoso.com",
            scopes: ["User.Read"],
            attributes: {
                displayName: "Signup profile",
                username: "signup-only-alias",
            },
        });

        expect(startResult.isState("existingAccountCodeRequired")).toBe(true);
        if (!startResult.isState("existingAccountCodeRequired")) {
            throw new Error("Expected existing-account email verification.");
        }
        expect(startResult.state).toBeInstanceOf(
            customAuth.ExistingAccountCodeRequiredStateV2
        );
        expect(startResult.state).toMatchObject({
            channel: "email",
            sentTo: "e***@contoso.com",
            codeLength: 6,
        });
        expect(
            startResult.state["stateParameters"].continuationState.signUp
        ).toEqual({ purpose: "existingAccount" });

        const result = await startResult.state.submitCode("123456");

        expect(result.isState("completed")).toBe(true);
        expect(result.data).toBeInstanceOf(CustomAuthAccountData);
        expect(JSON.parse((fetch as jest.Mock).mock.calls[3][1].body)).toEqual({
            continuationToken: "ct-existing-email",
            otp: "123456",
        });
        expect(
            (fetch as jest.Mock).mock.calls.some(([url]) =>
                String(url).includes("submitattributes")
            )
        ).toBe(false);
    });

    it("verifies an existing password without retaining or submitting upfront signup profiles", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(
                buildResponse(
                    SYNTHETIC_EXISTING_ACCOUNT_PASSWORD_START_RESPONSE
                )
            )
            .mockResolvedValueOnce(buildResponse(PASSWORD_CHALLENGE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(ACTIVATED_CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

        const startResult = await app.signUpV2({
            username: "existing@contoso.com",
            attributes: {
                displayName: "Signup profile",
                username: "signup-only-alias",
            },
        });

        expect(startResult.isState("existingAccountPasswordRequired")).toBe(
            true
        );
        if (!startResult.isState("existingAccountPasswordRequired")) {
            throw new Error("Expected existing-account password verification.");
        }
        expect(startResult.state).toBeInstanceOf(
            customAuth.ExistingAccountPasswordRequiredStateV2
        );
        expect(
            startResult.state["stateParameters"].continuationState.signUp
        ).toEqual({ purpose: "existingAccount" });

        const result = await startResult.state.submitPassword("valid-password");

        expect(result.isState("completed")).toBe(true);
        expect(JSON.parse((fetch as jest.Mock).mock.calls[3][1].body)).toEqual({
            continuationToken: PASSWORD_CHALLENGE_RESPONSE.continuationToken,
            password: "valid-password",
        });
        expect(
            (fetch as jest.Mock).mock.calls.some(([url]) =>
                String(url).includes("submitattributes")
            )
        ).toBe(false);
    });

    it.each(["email", "password"] as const)(
        "waits for selection before challenging an existing-account %s method",
        async (methodType) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(
                    buildResponse(
                        SYNTHETIC_EXISTING_ACCOUNT_MULTIPLE_METHODS_RESPONSE
                    )
                );

            const startResult = await app.signUpV2({
                username: "existing@contoso.com",
                attributes: {
                    displayName: "Signup profile",
                    username: "signup-only-alias",
                },
            });

            expect(startResult.isState("authMethodSelectionRequired")).toBe(
                true
            );
            expect(fetch).toHaveBeenCalledTimes(2);
            if (!startResult.isState("authMethodSelectionRequired")) {
                throw new Error("Expected existing-account method selection.");
            }
            expect(startResult.state).toBeInstanceOf(
                customAuth.AuthMethodSelectionRequiredStateV2
            );
            expect(
                startResult.state["stateParameters"].continuationState.signUp
            ).toEqual({ purpose: "existingAccount" });
            const method = startResult.state.methods.find(
                (candidate) => candidate.type === methodType
            );
            if (!method) {
                throw new Error("Expected an offered authentication method.");
            }
            (fetch as jest.Mock).mockResolvedValueOnce(
                buildResponse(
                    methodType === "email"
                        ? SYNTHETIC_EXISTING_ACCOUNT_EMAIL_CHALLENGE_RESPONSE
                        : PASSWORD_CHALLENGE_RESPONSE
                )
            );

            const result = await startResult.state.selectAuthMethod(method);

            expect(
                result.isState(
                    methodType === "email"
                        ? "existingAccountCodeRequired"
                        : "existingAccountPasswordRequired"
                )
            ).toBe(true);
            expect(fetch).toHaveBeenCalledTimes(3);
            expect(String((fetch as jest.Mock).mock.calls[2][0])).toContain(
                `/existing/${methodType}/challenge`
            );
            expect(
                JSON.parse((fetch as jest.Mock).mock.calls[2][1].body)
            ).toMatchObject({
                continuationToken: "ct-existing-start",
            });

            (fetch as jest.Mock)
                .mockResolvedValueOnce(
                    buildResponse(ACTIVATED_CONTINUE_RESPONSE)
                )
                .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
                .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));
            const completed = result.isState("existingAccountCodeRequired")
                ? await result.state.submitCode("123456")
                : result.isState("existingAccountPasswordRequired")
                ? await result.state.submitPassword("valid-password")
                : undefined;

            expect(completed?.isState("completed")).toBe(true);
            expect(completed?.scenario).toBe("signUp");
            expect(completed?.data).toBeInstanceOf(CustomAuthAccountData);
            expect(
                JSON.parse((fetch as jest.Mock).mock.calls[3][1].body)
            ).toEqual({
                continuationToken:
                    methodType === "email"
                        ? SYNTHETIC_EXISTING_ACCOUNT_EMAIL_CHALLENGE_RESPONSE.continuationToken
                        : PASSWORD_CHALLENGE_RESPONSE.continuationToken,
                ...(methodType === "email"
                    ? { otp: "123456" }
                    : { password: "valid-password" }),
            });
            expect(
                (fetch as jest.Mock).mock.calls.some(([url]) =>
                    String(url).includes("submitattributes")
                )
            ).toBe(false);
        }
    );

    it.each(["automatic", "selected"] as const)(
        "rejects an SMS first-factor challenge for an %s existing-account method",
        async (selection) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(
                    buildResponse(
                        selection === "automatic"
                            ? SYNTHETIC_EXISTING_ACCOUNT_EMAIL_START_RESPONSE
                            : SYNTHETIC_EXISTING_ACCOUNT_MULTIPLE_METHODS_RESPONSE
                    )
                )
                .mockResolvedValueOnce(
                    buildResponse(SMS_MFA_CHALLENGE_RESPONSE)
                );

            const start = await app.signUpV2({
                username: "existing@contoso.com",
            });
            expect(start.isState("authMethodSelectionRequired")).toBe(
                selection === "selected"
            );
            const result = start.isState("authMethodSelectionRequired")
                ? await start.state.selectAuthMethod(start.state.methods[0])
                : start;

            expect(result.isFailed()).toBe(true);
            expect(result.scenario).toBe("signUp");
            expect(result.error?.errorData.error).toBe(
                UNSUPPORTED_FLOW_TRANSITION
            );
            expect(fetch).toHaveBeenCalledTimes(3);
        }
    );

    it("resends an existing-account code and verifies with the refreshed token and link", async () => {
        const resendResponse = {
            ...SYNTHETIC_EXISTING_ACCOUNT_EMAIL_CHALLENGE_RESPONSE,
            continuationToken: "ct-existing-resend",
            hint: "r***@contoso.com",
            codeLength: 8,
            _links: {
                verify: { href: "/tenant/api/v0.1/existing/email/verify-new" },
                resend: { href: "/tenant/api/v0.1/existing/email/resend-new" },
            },
        };
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(
                buildResponse(SYNTHETIC_EXISTING_ACCOUNT_EMAIL_START_RESPONSE)
            )
            .mockResolvedValueOnce(
                buildResponse(
                    SYNTHETIC_EXISTING_ACCOUNT_EMAIL_CHALLENGE_RESPONSE
                )
            )
            .mockResolvedValueOnce(buildResponse(resendResponse))
            .mockResolvedValueOnce(buildResponse(ACTIVATED_CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

        const start = await app.signUpV2({
            username: "existing@contoso.com",
            attributes: {
                displayName: "Signup profile",
                username: "signup-only-alias",
            },
        });
        if (!start.isState("existingAccountCodeRequired")) {
            throw new Error("Expected existing-account email verification.");
        }
        const resent = await start.state.resendCode();
        if (!resent.isState("existingAccountCodeRequired")) {
            throw new Error("Expected existing-account replacement code.");
        }
        expect(resent.scenario).toBe("signUp");
        expect(resent.state).toMatchObject({
            sentTo: resendResponse.hint,
            codeLength: 8,
            method: start.state.method,
        });
        expect(
            resent.state["stateParameters"].continuationState.signUp
        ).toEqual({
            purpose: "existingAccount",
        });

        const completed = await resent.state.submitCode("12345678");

        expect(completed.isState("completed")).toBe(true);
        expect(completed.scenario).toBe("signUp");
        const requests = (fetch as jest.Mock).mock.calls;
        expect(String(requests[3][0])).toContain("/existing/email/resend");
        expect(JSON.parse(requests[3][1].body)).toEqual({
            continuationToken: "ct-existing-email",
        });
        expect(String(requests[4][0])).toContain("/existing/email/verify-new");
        expect(JSON.parse(requests[4][1].body)).toEqual({
            continuationToken: "ct-existing-resend",
            otp: "12345678",
        });
    });

    it.each(["password", "push", undefined])(
        "fails an existing-account resend that returns challenge type %s",
        async (type) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(
                    buildResponse(
                        SYNTHETIC_EXISTING_ACCOUNT_EMAIL_START_RESPONSE
                    )
                )
                .mockResolvedValueOnce(
                    buildResponse(
                        SYNTHETIC_EXISTING_ACCOUNT_EMAIL_CHALLENGE_RESPONSE
                    )
                )
                .mockResolvedValueOnce(
                    buildResponse({
                        ...SYNTHETIC_EXISTING_ACCOUNT_EMAIL_CHALLENGE_RESPONSE,
                        type,
                    })
                );

            const start = await app.signUpV2({
                username: "existing@contoso.com",
            });
            if (!start.isState("existingAccountCodeRequired")) {
                throw new Error(
                    "Expected existing-account email verification."
                );
            }
            const result = await start.state.resendCode();

            expect(result.isFailed()).toBe(true);
            expect(result.scenario).toBe("signUp");
            expect(result.error?.errorData.error).toBe(
                UNSUPPORTED_FLOW_TRANSITION
            );
            expect(fetch).toHaveBeenCalledTimes(4);
        }
    );

    it.each(["email", "password"] as const)(
        "keeps existing-account %s failures retryable with signup error attribution",
        async (methodType) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(
                    buildResponse(
                        methodType === "email"
                            ? SYNTHETIC_EXISTING_ACCOUNT_EMAIL_START_RESPONSE
                            : SYNTHETIC_EXISTING_ACCOUNT_PASSWORD_START_RESPONSE
                    )
                )
                .mockResolvedValueOnce(
                    buildResponse(
                        methodType === "email"
                            ? SYNTHETIC_EXISTING_ACCOUNT_EMAIL_CHALLENGE_RESPONSE
                            : PASSWORD_CHALLENGE_RESPONSE
                    )
                )
                .mockResolvedValueOnce(
                    buildResponse(
                        {
                            error: {
                                code: "invalidGrant",
                                message:
                                    "The supplied credential is incorrect.",
                                innerError: {
                                    code:
                                        methodType === "email"
                                            ? "invalidOneTimeCode"
                                            : "invalidUserNameOrPassword",
                                },
                            },
                        },
                        400
                    )
                )
                .mockResolvedValueOnce(
                    buildResponse(ACTIVATED_CONTINUE_RESPONSE)
                )
                .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
                .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

            const start = await app.signUpV2({
                username: "existing@contoso.com",
                attributes: {
                    displayName: "Signup profile",
                    username: "signup-only-alias",
                },
            });
            const failed = start.isState("existingAccountCodeRequired")
                ? await start.state.submitCode("000000")
                : start.isState("existingAccountPasswordRequired")
                ? await start.state.submitPassword("wrong-password")
                : undefined;
            if (!failed) {
                throw new Error(
                    "Expected existing-account credential verification."
                );
            }

            expect(failed.isFailed()).toBe(true);
            expect(failed.scenario).toBe("signUp");
            expect(failed.error?.scenario).toBe("signUp");
            expect(failed.error?.isInvalidCode()).toBe(methodType === "email");
            expect(failed.error?.isInvalidPassword()).toBe(
                methodType === "password"
            );

            const completed = start.isState("existingAccountCodeRequired")
                ? await start.state.submitCode("123456")
                : start.isState("existingAccountPasswordRequired")
                ? await start.state.submitPassword("valid-password")
                : undefined;

            expect(completed?.isState("completed")).toBe(true);
            expect(completed?.scenario).toBe("signUp");
            expect(String((fetch as jest.Mock).mock.calls[4][0])).toBe(
                String((fetch as jest.Mock).mock.calls[3][0])
            );
        }
    );

    it.each(["email", "password"] as const)(
        "rejects signup attribute collection after existing-account %s verification",
        async (methodType) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(
                    buildResponse(
                        methodType === "email"
                            ? SYNTHETIC_EXISTING_ACCOUNT_EMAIL_START_RESPONSE
                            : SYNTHETIC_EXISTING_ACCOUNT_PASSWORD_START_RESPONSE
                    )
                )
                .mockResolvedValueOnce(
                    buildResponse(
                        methodType === "email"
                            ? SYNTHETIC_EXISTING_ACCOUNT_EMAIL_CHALLENGE_RESPONSE
                            : PASSWORD_CHALLENGE_RESPONSE
                    )
                )
                .mockResolvedValueOnce(
                    buildResponse(FLAT_USERNAME_REQUIRED_RESPONSE)
                );

            const start = await app.signUpV2({
                username: "existing@contoso.com",
                attributes: {
                    displayName: "Signup profile",
                    username: "signup-only-alias",
                },
            });
            const result = start.isState("existingAccountCodeRequired")
                ? await start.state.submitCode("123456")
                : start.isState("existingAccountPasswordRequired")
                ? await start.state.submitPassword("valid-password")
                : undefined;
            if (!result) {
                throw new Error(
                    "Expected existing-account credential verification."
                );
            }

            expect(result.isFailed()).toBe(true);
            expect(result.scenario).toBe("signUp");
            expect(result.error?.errorData.error).toBe(
                UNSUPPORTED_FLOW_TRANSITION
            );
            expect(fetch).toHaveBeenCalledTimes(4);
            expect(
                (fetch as jest.Mock).mock.calls.some(([url]) =>
                    String(url).includes("submitattributes")
                )
            ).toBe(false);
        }
    );

    it.each(["email", "password"] as const)(
        "rejects a password MFA challenge after existing-account %s verification",
        async (methodType) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(
                    buildResponse(
                        methodType === "email"
                            ? SYNTHETIC_EXISTING_ACCOUNT_EMAIL_START_RESPONSE
                            : SYNTHETIC_EXISTING_ACCOUNT_PASSWORD_START_RESPONSE
                    )
                )
                .mockResolvedValueOnce(
                    buildResponse(
                        methodType === "email"
                            ? SYNTHETIC_EXISTING_ACCOUNT_EMAIL_CHALLENGE_RESPONSE
                            : PASSWORD_CHALLENGE_RESPONSE
                    )
                )
                .mockResolvedValueOnce(buildResponse(SMS_MFA_REQUIRED_RESPONSE))
                .mockResolvedValueOnce(
                    buildResponse(PASSWORD_CHALLENGE_RESPONSE)
                );

            const start = await app.signUpV2({
                username: "existing@contoso.com",
            });
            const verified = start.isState("existingAccountCodeRequired")
                ? await start.state.submitCode("123456")
                : start.isState("existingAccountPasswordRequired")
                ? await start.state.submitPassword("valid-password")
                : undefined;
            if (!verified?.isState("authMethodSelectionRequired")) {
                throw new Error("Expected shared MFA selection.");
            }

            const result = await verified.state.selectAuthMethod(
                verified.state.methods[0]
            );

            expect(result.isFailed()).toBe(true);
            expect(result.scenario).toBe("signUp");
            expect(result.error?.errorData.error).toBe(
                UNSUPPORTED_FLOW_TRANSITION
            );
            expect(fetch).toHaveBeenCalledTimes(5);
        }
    );

    it.each(["email", "password"] as const)(
        "continues existing-account %s verification through SMS MFA and resend",
        async (methodType) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(
                    buildResponse(
                        methodType === "email"
                            ? SYNTHETIC_EXISTING_ACCOUNT_EMAIL_START_RESPONSE
                            : SYNTHETIC_EXISTING_ACCOUNT_PASSWORD_START_RESPONSE
                    )
                )
                .mockResolvedValueOnce(
                    buildResponse(
                        methodType === "email"
                            ? SYNTHETIC_EXISTING_ACCOUNT_EMAIL_CHALLENGE_RESPONSE
                            : PASSWORD_CHALLENGE_RESPONSE
                    )
                )
                .mockResolvedValueOnce(buildResponse(SMS_MFA_REQUIRED_RESPONSE))
                .mockResolvedValueOnce(
                    buildResponse(SMS_MFA_CHALLENGE_RESPONSE)
                )
                .mockResolvedValueOnce(buildResponse(SMS_MFA_RESEND_RESPONSE))
                .mockResolvedValueOnce(
                    buildResponse(ACTIVATED_CONTINUE_RESPONSE)
                )
                .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
                .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

            const start = await app.signUpV2({
                username: "existing@contoso.com",
                attributes: {
                    displayName: "Signup profile",
                    username: "signup-only-alias",
                },
            });
            const verified = start.isState("existingAccountCodeRequired")
                ? await start.state.submitCode("123456")
                : start.isState("existingAccountPasswordRequired")
                ? await start.state.submitPassword("valid-password")
                : undefined;
            if (!verified?.isState("authMethodSelectionRequired")) {
                throw new Error("Expected shared MFA selection.");
            }
            expect(verified.scenario).toBe("signUp");
            expect(verified.state).toBeInstanceOf(
                customAuth.AuthMethodSelectionRequiredStateV2
            );
            const challenged = await verified.state.selectAuthMethod(
                verified.state.methods[0]
            );
            if (!challenged.isState("mfaVerificationRequired")) {
                throw new Error("Expected SMS MFA verification.");
            }
            expect(challenged.state.channel).toBe("sms");
            const resent = await challenged.state.resendChallenge();
            if (!resent.isState("mfaVerificationRequired")) {
                throw new Error("Expected refreshed SMS MFA verification.");
            }
            expect(resent.scenario).toBe("signUp");
            expect(
                resent.state["stateParameters"].continuationState.signUp
            ).toEqual({
                purpose: "existingAccount",
            });

            const completed = await resent.state.submitChallenge("123456");

            expect(completed.isState("completed")).toBe(true);
            expect(completed.scenario).toBe("signUp");
            expect(completed.data).toBeInstanceOf(CustomAuthAccountData);
            expect(
                JSON.parse((fetch as jest.Mock).mock.calls[6][1].body)
            ).toEqual({
                continuationToken: SMS_MFA_RESEND_RESPONSE.continuationToken,
                otp: "123456",
            });
            expect(
                (fetch as jest.Mock).mock.calls.some(([url]) =>
                    String(url).includes("submitattributes")
                )
            ).toBe(false);
        }
    );

    it.each(["email", "password"] as const)(
        "continues existing-account %s verification through JIT enrollment",
        async (methodType) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(
                    buildResponse(
                        methodType === "email"
                            ? SYNTHETIC_EXISTING_ACCOUNT_EMAIL_START_RESPONSE
                            : SYNTHETIC_EXISTING_ACCOUNT_PASSWORD_START_RESPONSE
                    )
                )
                .mockResolvedValueOnce(
                    buildResponse(
                        methodType === "email"
                            ? SYNTHETIC_EXISTING_ACCOUNT_EMAIL_CHALLENGE_RESPONSE
                            : PASSWORD_CHALLENGE_RESPONSE
                    )
                )
                .mockResolvedValueOnce(buildResponse(ENROLL_REQUIRED_RESPONSE))
                .mockResolvedValueOnce(
                    buildResponse(ENROLL_ACTIVATION_RESPONSE)
                )
                .mockResolvedValueOnce(
                    buildResponse(ACTIVATED_CONTINUE_RESPONSE)
                )
                .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
                .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

            const start = await app.signUpV2({
                username: "existing@contoso.com",
                attributes: {
                    displayName: "Signup profile",
                    username: "signup-only-alias",
                },
            });
            const verified = start.isState("existingAccountCodeRequired")
                ? await start.state.submitCode("123456")
                : start.isState("existingAccountPasswordRequired")
                ? await start.state.submitPassword("valid-password")
                : undefined;
            if (!verified?.isState("authMethodRegistrationRequired")) {
                throw new Error("Expected JIT method registration.");
            }
            const activation = await verified.state.selectAuthMethod(
                verified.state.methods[1],
                "existing@contoso.com"
            );
            if (!activation.isState("authMethodVerificationRequired")) {
                throw new Error("Expected JIT activation.");
            }
            expect(activation.scenario).toBe("signUp");
            expect(
                activation.state["stateParameters"].continuationState.signUp
            ).toEqual({
                purpose: "existingAccount",
            });
            const continuation = await activation.state.submitChallenge(
                "123456"
            );
            expect(continuation.data).toBeUndefined();
            expect(app.getAllAccounts()).toHaveLength(0);
            expect(fetch).toHaveBeenCalledTimes(6);
            if (!continuation.isState("signInContinuation")) {
                throw new Error("Expected explicit sign-in after activation.");
            }
            const completed = await continuation.state.signIn();

            expect(completed.isState("completed")).toBe(true);
            expect(completed.scenario).toBe("signUp");
            expect(completed.data).toBeInstanceOf(CustomAuthAccountData);
            expect(
                (fetch as jest.Mock).mock.calls.some(([url]) =>
                    String(url).includes("submitattributes")
                )
            ).toBe(false);
        }
    );

    it.each<{ label: string; password: unknown }>([
        { label: "undefined", password: undefined },
        { label: "null", password: null },
        { label: "empty", password: "" },
        { label: "nonempty", password: "ignored-password" },
        { label: "numeric", password: 42 },
        { label: "object", password: {} },
    ])(
        "ignores an unsupported $label upfront password from a runtime caller",
        async ({ password }) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(buildResponse(START_RESPONSE));
            const inputs = {
                username: "user@contoso.com",
                password,
            };
            const result = await app.signUpV2(inputs);

            expect(result.isState("codeRequired")).toBe(true);
            expect(fetch).toHaveBeenCalledTimes(2);
            expect(
                JSON.parse((fetch as jest.Mock).mock.calls[1][1].body)
            ).toEqual(USERNAME_START_REQUEST);
            expect(inputs.password).toBe(password);
            if (result.isState("codeRequired")) {
                expect(
                    result.state["stateParameters"].continuationState
                ).not.toHaveProperty("password");
            }
        }
    );

    it.each([
        {
            label: "password collection",
            response: PASSWORD_AND_PROFILE_REQUIRED_RESPONSE,
            passwordRequired: true,
        },
        {
            label: "profile-only collection",
            response: FLAT_USERNAME_REQUIRED_RESPONSE,
            passwordRequired: false,
        },
    ])(
        "follows server-directed $label despite an extra runtime password",
        async ({ response, passwordRequired }) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(buildResponse(START_RESPONSE))
                .mockResolvedValueOnce(buildResponse(response));
            const runtimeInputs = {
                username: "user@contoso.com",
                password: "ignored-password",
            };

            const startResult = await app.signUpV2(runtimeInputs);
            if (!startResult.isState("codeRequired")) {
                throw new Error("Expected email verification first.");
            }
            const result = await startResult.state.submitCode("12345678");

            expect(result.isFailed()).toBe(false);
            expect(result.isState("passwordRequired")).toBe(passwordRequired);
            expect(result.isState("attributesRequired")).toBe(
                !passwordRequired
            );
            expect(fetch).toHaveBeenCalledTimes(3);
            expect(
                JSON.parse((fetch as jest.Mock).mock.calls[1][1].body)
            ).toEqual(USERNAME_START_REQUEST);
            expect(
                JSON.parse((fetch as jest.Mock).mock.calls[2][1].body)
            ).toEqual({
                continuationToken: "ct-start",
                otp: "12345678",
            });
        }
    );

    it.each([false, true])(
        "surfaces server-requested email collection as an API failure (automatic profile submission %s)",
        async (automaticProfileSubmission) => {
            const fetchMock = (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(buildResponse(START_RESPONSE));
            if (automaticProfileSubmission) {
                fetchMock.mockResolvedValueOnce(
                    buildResponse(FLAT_USERNAME_REQUIRED_RESPONSE)
                );
            }
            fetchMock.mockResolvedValueOnce(
                buildResponse({
                    ...FLAT_USERNAME_REQUIRED_RESPONSE,
                    attributes: [{ attributeId: "Email", required: true }],
                })
            );

            const startResult = await app.signUpV2({
                username: "user@contoso.com",
                attributes: automaticProfileSubmission
                    ? { givenName: "Test" }
                    : undefined,
            });
            if (!startResult.isState("codeRequired")) {
                throw new Error("Expected email verification first.");
            }

            const result = await startResult.state.submitCode("12345678");

            expect(result.isFailed()).toBe(true);
            expect(result.error?.isInvalidInput()).toBe(false);
            expect(result.error?.errorData).toBeInstanceOf(CustomAuthApiError);
            expect(result.error?.errorData.error).toBe("invalid_hal_response");
            expect(result.error?.correlationId).toBe("corr-1");
            expect(fetch).toHaveBeenCalledTimes(
                automaticProfileSubmission ? 4 : 3
            );
        }
    );

    it.each(["eMaIl", "PaSsWoRd"])(
        "filters the reserved upfront profile attribute %s before password submission",
        async (attributeId) => {
            const attributes = { [attributeId]: "ignored-value" };
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(buildResponse(START_RESPONSE))
                .mockResolvedValueOnce(
                    buildResponse(PASSWORD_AND_PROFILE_REQUIRED_RESPONSE)
                )
                .mockResolvedValueOnce(
                    buildResponse({
                        continuationToken: "ct-complete",
                        state: "continue",
                    })
                );
            const startResult = await app.signUpV2({
                username: "user@contoso.com",
                attributes,
            });
            if (!startResult.isState("codeRequired")) {
                throw new Error("Expected email verification first.");
            }
            const verifyResult = await startResult.state.submitCode("12345678");
            const result = verifyResult.isState("passwordRequired")
                ? await verifyResult.state.submitPassword("valid-password")
                : undefined;

            expect(result).toBeDefined();
            expect(result?.isState("signInContinuation")).toBe(true);
            expect(attributes).toEqual({ [attributeId]: "ignored-value" });
            expect(
                JSON.parse((fetch as jest.Mock).mock.calls[3][1].body)
            ).toEqual({
                continuationToken: "ct-password-profile",
                attributes: {
                    password: "valid-password",
                },
            });
            expect(fetch).toHaveBeenCalledTimes(4);
        }
    );

    it("rejects malformed claims without sending a request", async () => {
        const result = await app.signUpV2({
            username: "user@contoso.com",
            claims: "not-json",
        });

        expect(result.isFailed()).toBe(true);
        expect(result.error?.isInvalidInput()).toBe(true);
        expect(fetch).not.toHaveBeenCalled();
    });

    it("rejects malformed scopes without sending a request", async () => {
        const result = await app.signUpV2({
            username: "user@contoso.com",
            scopes: "User.Read" as unknown as string[],
        });

        expect(result.isFailed()).toBe(true);
        expect(result.error?.isInvalidInput()).toBe(true);
        expect(fetch).not.toHaveBeenCalled();
    });

    it.each([
        "FlowAttributesRequiredResultV2",
        "FlowSignUpPasswordRequiredResultV2",
        "unsupported",
    ])(
        "fails when sign-up start returns an unexpected %s result",
        async (type) => {
            const correlationId = "unsupported-result-correlation";
            const controller = app[
                "customAuthController"
            ] as CustomAuthStandardController;
            jest.spyOn(controller["flowClientV2"], "signUp").mockResolvedValue({
                // @ts-expect-error Exercise an unsupported runtime result outside the start contract.
                type,
                correlationId,
                continuationState: {
                    continuationToken: "ct-unsupported",
                    scenario: "signUp",
                    scopes: [],
                    links: {},
                },
            });

            const result = await app.signUpV2({
                username: "user@contoso.com",
                correlationId,
            });

            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(UnexpectedError);
            expect(result.error?.errorData).toMatchObject({
                error: "unexpected_error",
                errorDescription:
                    "Unsupported native auth V2 sign-up result type.",
                correlationId,
            });
            expect(fetch).not.toHaveBeenCalled();
        }
    );

    it("IT-SU-01: sends the email identifier as username on signup/start", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE));
        const controller = app[
            "customAuthController"
        ] as CustomAuthStandardController;
        const startSpy = jest.spyOn(controller["flowClientV2"], "signUp");

        const result = await app.signUpV2({
            username: "user@contoso.com",
            attributes: {
                displayName: "Test User",
                Email: "wrong@contoso.com",
                PASSWORD: "wrong-password",
            },
            scopes: ["openid", "User.Read"],
            claims: '{"id_token":{}}',
        });

        expect(result.isFailed()).toBe(false);
        expect(result.isState("codeRequired")).toBe(true);
        expect(result.state).toBeInstanceOf(CodeRequiredStateV2);
        expect(result.scenario).toBe("signUp");

        if (result.isState("codeRequired")) {
            expect(result.state.method).toBeUndefined();
            expect(result.state.sentTo).toBe("u***@contoso.com");
            expect(result.state.codeLength).toBe(8);
            expect(result.state["stateParameters"].continuationState).toEqual({
                continuationToken: "ct-start",
                scenario: "signUp",
                scopes: ["openid", "User.Read", "profile", "offline_access"],
                links: {
                    verify: "/tenant/api/v0.1/email/verify",
                    resend: "/tenant/api/v0.1/email/resend",
                },
                signUp: {
                    purpose: "newAccount",
                    pendingProfileAttributes: { displayName: "Test User" },
                    submittedAttributeIds: [],
                },
            });
        }

        expect(fetch).toHaveBeenCalledTimes(2);
        expect(startSpy).toHaveBeenCalledWith({
            correlationId: expect.any(String),
            username: "user@contoso.com",
            scopes: ["openid", "User.Read"],
            claims: '{"id_token":{}}',
            attributes: {
                Email: "wrong@contoso.com",
                PASSWORD: "wrong-password",
                displayName: "Test User",
            },
        });

        const [, entryOptions] = (fetch as jest.Mock).mock.calls[0];
        const entryBody = new URLSearchParams(entryOptions.body);
        expect(entryBody.get("client_id")).toBe(customAuthConfig.auth.clientId);
        expect(entryBody.get("scope")).toBe(
            "openid User.Read profile offline_access"
        );
        expect(entryBody.get("claims")).toBe('{"id_token":{}}');

        const [, startOptions] = (fetch as jest.Mock).mock.calls[1];
        expect(JSON.parse(startOptions.body)).toEqual(USERNAME_START_REQUEST);
        expect(startOptions.body).not.toContain("claims");

        startSpy.mockRestore();
    });

    it.each<{
        name: string;
        inputs: Omit<SignUpInputsV2, "username">;
    }>([
        {
            name: "email and full profile",
            inputs: {
                attributes: {
                    givenName: "Test",
                    surname: "User",
                },
            },
        },
        {
            name: "email and partial profile",
            inputs: {
                attributes: {
                    city: "Redmond",
                },
            },
        },
        {
            name: "email and username alias",
            inputs: {
                attributes: {
                    username: "test-user",
                },
            },
        },
    ])(
        "returns code-required without submitting upfront $name values",
        async ({ inputs }) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(buildResponse(START_RESPONSE));

            const result = await app.signUpV2({
                username: "user@contoso.com",
                ...inputs,
            });

            expect(result.isState("codeRequired")).toBe(true);
            expect(fetch).toHaveBeenCalledTimes(2);
            expect(
                JSON.parse((fetch as jest.Mock).mock.calls[1][1].body)
            ).toEqual(USERNAME_START_REQUEST);
        }
    );

    it.each<SignUpInputsV2["attributes"]>([
        undefined,
        {},
        { Email: "ignored@contoso.com", PASSWORD: "ignored-password" },
    ])(
        "IT-SU-02: returns code-required without synthesizing email or submitting initial attributes (%j)",
        async (attributes) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(buildResponse(START_RESPONSE));

            const result = await app.signUpV2({
                username: "user@contoso.com",
                attributes,
                scopes: ["User.Read"],
                correlationId: "corr-start",
            });

            expect(result.isState("codeRequired")).toBe(true);
            expect(fetch).toHaveBeenCalledTimes(2);
            expect(
                JSON.parse((fetch as jest.Mock).mock.calls[1][1].body)
            ).toEqual(USERNAME_START_REQUEST);
            if (!result.isState("codeRequired")) {
                throw new Error(
                    "Expected the verification challenge from start."
                );
            }
            expect(result.state["stateParameters"].continuationState).toEqual({
                continuationToken: "ct-start",
                scenario: "signUp",
                scopes: ["User.Read", "openid", "profile", "offline_access"],
                links: {
                    verify: START_RESPONSE._links.verify.href,
                    resend: START_RESPONSE._links.resend.href,
                },
                signUp: {
                    purpose: "newAccount",
                    pendingProfileAttributes: {},
                    submittedAttributeIds: [],
                },
            });
        }
    );

    it("IT-SU-03: ignores upfront flat username without changing the identifier or caller attributes", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE));
        const attributes = { username: "test-user", givenName: "Test" };

        const result = await app.signUpV2({
            username: "user@contoso.com",
            attributes,
        });

        expect(result.isState("codeRequired")).toBe(true);
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(JSON.parse((fetch as jest.Mock).mock.calls[1][1].body)).toEqual(
            USERNAME_START_REQUEST
        );
        expect(attributes).toEqual({
            username: "test-user",
            givenName: "Test",
        });
    });

    it("IT-SU-04: verifies email before collecting the requested password and profile", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse(PASSWORD_AND_PROFILE_REQUIRED_RESPONSE)
            )
            .mockResolvedValueOnce(
                buildResponse({
                    ...PASSWORD_AND_PROFILE_REQUIRED_RESPONSE,
                    continuationToken: "ct-password",
                    attributes: [
                        PASSWORD_AND_PROFILE_REQUIRED_RESPONSE.attributes[0],
                        PASSWORD_AND_PROFILE_REQUIRED_RESPONSE.attributes[2],
                    ],
                    _links: {
                        submitAttributes: {
                            href: "/tenant/api/v0.1/signup/submitpassword",
                        },
                    },
                })
            );

        const startResult = await app.signUpV2({
            username: "user@contoso.com",
            attributes: { username: "ignored-profile" },
        });

        expect(fetch).toHaveBeenCalledTimes(2);
        if (!startResult.isState("codeRequired")) {
            throw new Error(
                "Expected email verification before password collection."
            );
        }
        const result = await startResult.state.submitCode("12345678");
        expect(result.isState("passwordRequired")).toBe(true);
        if (!result.isState("passwordRequired")) {
            throw new Error(
                "Expected the password requested after verification."
            );
        }
        expect(result.state.requestedPasswordAttribute).toEqual(
            PASSWORD_AND_PROFILE_REQUIRED_RESPONSE.attributes[0]
        );
        expect(result.state).not.toHaveProperty("attributes");
        expect(fetch).toHaveBeenCalledTimes(4);
        expect(JSON.parse((fetch as jest.Mock).mock.calls[2][1].body)).toEqual({
            continuationToken: "ct-start",
            otp: "12345678",
        });
        expect(JSON.parse((fetch as jest.Mock).mock.calls[3][1].body)).toEqual({
            continuationToken: "ct-password-profile",
            attributes: {
                username: "ignored-profile",
            },
        });
    });

    it("rejects an unexpected enrollment response from start", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(ENROLL_REQUIRED_RESPONSE));

        const startResult = await app.signUpV2({
            username: "user@contoso.com",
            scopes: ["User.Read"],
        });

        expect(startResult.isFailed()).toBe(true);
        expect(startResult.error?.errorData).toMatchObject({
            error: "invalid_hal_response",
        });
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it("registers after automatically submitting retained attributes after email verification", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-attributes",
                    state: "interactionRequired",
                    action: "collectAttributes",
                    attributes: [
                        {
                            attributeId: "jobTitle",
                            inputType: "text",
                            required: true,
                        },
                    ],
                    _links: {
                        submitAttributes: {
                            href: "/tenant/api/v0.1/signup/submitattributes",
                        },
                    },
                })
            )
            .mockResolvedValueOnce(buildResponse(ENROLL_REQUIRED_RESPONSE))
            .mockResolvedValueOnce(buildResponse(ENROLL_ACTIVATION_RESPONSE))
            .mockResolvedValueOnce(buildResponse(ACTIVATED_CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

        const startResult = await app.signUpV2({
            username: "user@contoso.com",
            attributes: { jobTitle: "Engineer" },
        });
        if (!startResult.isState("codeRequired")) {
            throw new Error("Expected email verification first.");
        }

        const verifyResult = await startResult.state.submitCode("12345678");
        if (!verifyResult.isState("authMethodRegistrationRequired")) {
            throw new Error("Expected registration after retained attributes.");
        }

        const activationResult = await verifyResult.state.selectAuthMethod(
            verifyResult.state.methods[1],
            "user@contoso.com"
        );
        if (!activationResult.isState("authMethodVerificationRequired")) {
            throw new Error("Expected activation challenge.");
        }
        const continuationResult = await activationResult.state.submitChallenge(
            "123456"
        );
        expect(continuationResult.data).toBeUndefined();
        expect(app.getAllAccounts()).toHaveLength(0);
        expect(fetch).toHaveBeenCalledTimes(6);
        if (!continuationResult.isState("signInContinuation")) {
            throw new Error("Expected explicit sign-in after activation.");
        }
        const completedResult = await continuationResult.state.signIn();

        expect(completedResult.isState("completed")).toBe(true);
        const requests = (fetch as jest.Mock).mock.calls;
        expect(requests).toHaveLength(8);
        expect(JSON.parse(requests[2][1].body)).toEqual({
            continuationToken: "ct-start",
            otp: "12345678",
        });
        expect(JSON.parse(requests[3][1].body)).toEqual({
            continuationToken: "ct-attributes",
            attributes: { jobTitle: "Engineer" },
        });
        expect(
            requests.some(([url]: [string]) =>
                String(url).includes("/email/verify")
            )
        ).toBe(true);
    });

    it("registers after sign-up code verification without repeating that code", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(ENROLL_REQUIRED_RESPONSE))
            .mockResolvedValueOnce(buildResponse(ENROLL_ACTIVATION_RESPONSE))
            .mockResolvedValueOnce(buildResponse(ACTIVATED_CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

        const startResult = await app.signUpV2({
            username: "user@contoso.com",
        });
        if (!startResult.isState("codeRequired")) {
            throw new Error("Expected sign-up email-code challenge.");
        }

        const registrationResult = await startResult.state.submitCode(
            "12345678"
        );
        if (!registrationResult.isState("authMethodRegistrationRequired")) {
            throw new Error("Expected registration after code verification.");
        }
        const activationResult =
            await registrationResult.state.selectAuthMethod(
                registrationResult.state.methods[1],
                "user@contoso.com"
            );
        if (!activationResult.isState("authMethodVerificationRequired")) {
            throw new Error("Expected activation challenge.");
        }

        const continuationResult = await activationResult.state.submitChallenge(
            "123456"
        );
        expect(continuationResult.data).toBeUndefined();
        expect(app.getAllAccounts()).toHaveLength(0);
        expect(fetch).toHaveBeenCalledTimes(5);
        if (!continuationResult.isState("signInContinuation")) {
            throw new Error("Expected explicit sign-in after activation.");
        }
        const completedResult = await continuationResult.state.signIn();
        expect(completedResult.isState("completed")).toBe(true);
        expect(completedResult.data).toBeInstanceOf(CustomAuthAccountData);
        expect(fetch).toHaveBeenCalledTimes(7);
        expect(
            ((fetch as jest.Mock).mock.calls[5][1].body as URLSearchParams).get(
                "continuation_token"
            )
        ).toBe("ct-activated");
    });

    it.each(["attributes", "password"] as const)(
        "registers after deferred %s submission and completes sign-up",
        async (submission) => {
            const fetchMock = (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(buildResponse(START_RESPONSE))
                .mockResolvedValueOnce(
                    buildResponse({
                        continuationToken: "ct-attributes",
                        state: "interactionRequired",
                        action: "collectAttributes",
                        attributes: [
                            ...(submission === "password"
                                ? [
                                      {
                                          attributeId: "password",
                                          inputType: "password",
                                          required: true,
                                      },
                                  ]
                                : []),
                            {
                                attributeId: "jobTitle",
                                inputType: "text",
                                required: true,
                            },
                        ],
                        _links: {
                            submitAttributes: {
                                href: "/tenant/api/v0.1/signup/submitattributes",
                            },
                        },
                    })
                );
            if (submission === "password") {
                fetchMock.mockResolvedValueOnce(
                    buildResponse({
                        continuationToken: "ct-password",
                        state: "interactionRequired",
                        action: "collectAttributes",
                        attributes: [
                            {
                                attributeId: "password",
                                inputType: "password",
                                required: true,
                            },
                        ],
                        _links: {
                            submitAttributes: {
                                href: "/tenant/api/v0.1/signup/submitpassword",
                            },
                        },
                    })
                );
            }
            fetchMock
                .mockResolvedValueOnce(buildResponse(ENROLL_REQUIRED_RESPONSE))
                .mockResolvedValueOnce(
                    buildResponse(ENROLL_ACTIVATION_RESPONSE)
                )
                .mockResolvedValueOnce(
                    buildResponse(ACTIVATED_CONTINUE_RESPONSE)
                )
                .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
                .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

            const startResult = await app.signUpV2({
                username: "user@contoso.com",
                attributes:
                    submission === "password"
                        ? {
                              displayName: "Test User",
                              jobTitle: "Engineer",
                          }
                        : undefined,
            });
            if (!startResult.isState("codeRequired")) {
                throw new Error("Expected sign-up email-code challenge.");
            }

            const verifyResult = await startResult.state.submitCode("12345678");
            const registrationResult:
                | customAuth.SubmitPasswordResultV2
                | undefined =
                submission === "attributes" &&
                verifyResult.isState("attributesRequired")
                    ? await verifyResult.state.submitAttributes({
                          jobTitle: "Engineer",
                      })
                    : submission === "password" &&
                      verifyResult.isState("passwordRequired")
                    ? await verifyResult.state.submitPassword("valid-password")
                    : undefined;
            if (
                !registrationResult?.isState("authMethodRegistrationRequired")
            ) {
                throw new Error(
                    "Expected registration after deferred attributes."
                );
            }

            const activationResult =
                await registrationResult.state.selectAuthMethod(
                    registrationResult.state.methods[1],
                    "user@contoso.com"
                );
            if (!activationResult.isState("authMethodVerificationRequired")) {
                throw new Error("Expected activation challenge.");
            }
            const continuationResult =
                await activationResult.state.submitChallenge("123456");
            expect(continuationResult.data).toBeUndefined();
            expect(app.getAllAccounts()).toHaveLength(0);
            expect(fetch).toHaveBeenCalledTimes(
                submission === "password" ? 7 : 6
            );
            if (!continuationResult.isState("signInContinuation")) {
                throw new Error("Expected explicit sign-in after activation.");
            }
            const completedResult = await continuationResult.state.signIn();

            expect(completedResult.isState("completed")).toBe(true);
            expect(completedResult.data).toBeInstanceOf(CustomAuthAccountData);
            const requests = (fetch as jest.Mock).mock.calls;
            expect(requests).toHaveLength(submission === "password" ? 9 : 8);
            expect(JSON.parse(requests[3][1].body)).toEqual({
                continuationToken: "ct-attributes",
                attributes:
                    submission === "password"
                        ? {
                              displayName: "Test User",
                              jobTitle: "Engineer",
                          }
                        : {
                              jobTitle: "Engineer",
                          },
            });
            if (submission === "password") {
                expect(JSON.parse(requests[4][1].body)).toEqual({
                    continuationToken: "ct-password",
                    attributes: {
                        password: "valid-password",
                    },
                });
            }
            expect(
                (requests[requests.length - 2][1].body as URLSearchParams).get(
                    "continuation_token"
                )
            ).toBe("ct-activated");
        }
    );

    it.each([
        {
            code: "userAlreadyExists",
            attributeId: "email",
            missingRequired: false,
        },
        {
            code: "attributeRequired",
            attributeId: "givenName",
            missingRequired: true,
        },
    ])(
        "preserves $code details from initial attribute submission",
        async ({ code, attributeId, missingRequired }) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(buildResponse(START_RESPONSE))
                .mockResolvedValueOnce(
                    buildResponse({
                        ...PASSWORD_AND_PROFILE_REQUIRED_RESPONSE,
                        attributes: [
                            {
                                attributeId: "givenName",
                                inputType: "text",
                                required: true,
                            },
                        ],
                    })
                )
                .mockResolvedValueOnce(
                    buildResponse(
                        {
                            error: {
                                code: "invalidRequest",
                                message:
                                    "AADSTS1002027: Some of the collected attributes were invalid.",
                                correlationId: "corr-attributes",
                                innerError: {
                                    code: "attributeValidationError",
                                    details: [
                                        {
                                            attributeIds: [attributeId],
                                            code,
                                            message:
                                                "Attribute validation failed.",
                                        },
                                    ],
                                },
                            },
                        },
                        400
                    )
                );

            const startResult = await app.signUpV2({
                username: "existing@contoso.com",
                attributes: { givenName: "Test" },
            });
            if (!startResult.isState("codeRequired")) {
                throw new Error("Expected email verification first.");
            }
            const result = await startResult.state.submitCode("12345678");

            expect(result.isFailed()).toBe(true);
            expect(result.error?.correlationId).toBe("corr-attributes");
            expect(result.error?.errorData).toMatchObject({
                error: "invalidRequest",
                attributeValidationDetails: [
                    {
                        attributeIds: [attributeId],
                        code,
                        message: "Attribute validation failed.",
                    },
                ],
            });
            expect(result.error?.requiredAttributes).toEqual(
                missingRequired ? [attributeId] : []
            );
            expect(result.error?.invalidAttributes).toEqual([]);
            expect(result.error?.isInvalidPassword()).toBe(false);
        }
    );

    it("surfaces an existing-email error from signup/start", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(
                buildResponse(
                    {
                        error: {
                            code: "invalidRequest",
                            message:
                                "AADSTS1003037: An account with this email address may already exist.",
                            correlationId: "corr-existing",
                            innerError: {
                                details: [
                                    {
                                        attributeIds: ["email"],
                                        code: "userAlreadyExists",
                                        message:
                                            "An account with this identifier already exists.",
                                    },
                                ],
                            },
                        },
                    },
                    400
                )
            );

        const result = await app.signUpV2({
            username: "existing@contoso.com",
        });

        expect(result.isFailed()).toBe(true);
        expect(result.error?.correlationId).toBe("corr-existing");
        expect(result.error?.errorData).toMatchObject({
            error: "invalidRequest",
            attributeValidationDetails: [
                {
                    attributeIds: ["email"],
                    code: "userAlreadyExists",
                    message: "An account with this identifier already exists.",
                },
            ],
        });
        expect(result.error?.isInvalidInput()).toBe(false);
        expect(result.error?.isInvalidUsername()).toBe(false);
    });

    it("surfaces a signup/start server error as a general sign-up error", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(
                buildResponse(
                    {
                        error: {
                            code: "serverError",
                            message:
                                "AADSTS50000: There was an error issuing a token or an issue with our sign-in service.",
                            traceId: "trace-server",
                            correlationId: "corr-server",
                        },
                    },
                    500
                )
            );

        const result = await app.signUpV2({
            username: "user@contoso.com",
        });

        expect(result.isFailed()).toBe(true);
        expect(result.error?.errorData).toMatchObject({
            error: "serverError",
            errorDescription:
                "AADSTS50000: There was an error issuing a token or an issue with our sign-in service.",
            correlationId: "corr-server",
            traceId: "trace-server",
        });
    });

    it("validates a freshly submitted password even when an upfront password was supplied", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse({
                    ...PASSWORD_AND_PROFILE_REQUIRED_RESPONSE,
                    attributes: [
                        PASSWORD_AND_PROFILE_REQUIRED_RESPONSE.attributes[0],
                    ],
                })
            )
            .mockResolvedValueOnce(
                buildResponse(
                    {
                        error: {
                            code: "invalidRequest",
                            message:
                                "AADSTS1002027: Some of the collected attributes were invalid.",
                            correlationId: "corr-password-policy",
                            innerError: {
                                code: "attributeValidationError",
                                details: [
                                    {
                                        attributeIds: ["password"],
                                        message:
                                            "The password does not meet the requirements.",
                                    },
                                    {
                                        attributeIds: ["givenName", "surname"],
                                        code: "attributeRequired",
                                        message: "These fields are required.",
                                    },
                                ],
                            },
                        },
                    },
                    400
                )
            );

        const runtimeInputs = {
            username: "user@contoso.com",
            password: "ignored-password",
        };
        const startResult = await app.signUpV2(runtimeInputs);

        if (!startResult.isState("codeRequired")) {
            throw new Error("Expected email verification first.");
        }
        const verifyResult = await startResult.state.submitCode("12345678");
        if (!verifyResult.isState("passwordRequired")) {
            throw new Error("Expected password collection after verification.");
        }
        const result = await verifyResult.state.submitPassword("weak");
        expect(result.isFailed()).toBe(true);
        expect(result.error).toBeInstanceOf(AuthFlowErrorV2);
        expect(result.error?.isInvalidPassword()).toBe(true);
        expect(result.error?.isInvalidAttributes()).toBe(false);
        expect(result.error?.requiredAttributes).toEqual([
            "givenName",
            "surname",
        ]);
        expect(result.error?.invalidAttributes).toEqual([]);
        expect(result.error?.correlationId).toBe("corr-password-policy");
        expect(JSON.parse((fetch as jest.Mock).mock.calls[3][1].body)).toEqual({
            continuationToken: "ct-password-profile",
            attributes: { password: "weak" },
        });
    });

    it("IT-SU-05, IT-SU-09: validates retained profiles before collecting and submitting only the password", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-verify",
                    state: "interactionRequired",
                    action: "collectAttributes",
                    attributes: [
                        {
                            attributeId: "password",
                            inputType: "password",
                            required: true,
                            canChange: true,
                            label: "Password",
                            confirmationInput: "retype",
                        },
                        {
                            attributeId: "jobTitle",
                            inputType: "text",
                            required: true,
                            canChange: true,
                            label: "Job Title",
                        },
                        {
                            attributeId: "city",
                            inputType: "text",
                            required: false,
                            canChange: true,
                            label: "City",
                        },
                    ],
                    _links: {
                        submitAttributes: {
                            href: "/tenant/api/v0.1/signup/submitattributes",
                        },
                    },
                })
            )
            .mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-profile-accepted",
                    state: "interactionRequired",
                    action: "collectAttributes",
                    attributes: [
                        {
                            attributeId: "password",
                            inputType: "password",
                            required: true,
                            canChange: false,
                            label: "Create password",
                            confirmationInput: "confirm",
                        },
                        {
                            attributeId: "city",
                            inputType: "text",
                            required: false,
                            canChange: true,
                            label: "City",
                        },
                    ],
                    _links: {
                        submitAttributes: {
                            href: "/tenant/api/v0.1/signup/submitpassword",
                        },
                    },
                })
            )
            .mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-complete",
                    state: "continue",
                })
            );

        const startResult = await app.signUpV2({
            username: "user@contoso.com",
            attributes: {
                displayName: "Test User",
                jobTitle: "Engineer",
            },
        });

        expect(startResult.isState("codeRequired")).toBe(true);
        if (!startResult.isState("codeRequired")) {
            throw new Error("Expected challenge verification state.");
        }

        const verifyResult = await startResult.state.submitCode("12345678");

        expect(verifyResult.isState("passwordRequired")).toBe(true);
        expect(verifyResult.isFailed()).toBe(false);
        expect(verifyResult.error).toBeUndefined();
        expect(verifyResult.state).toBeInstanceOf(PasswordRequiredStateV2);
        if (verifyResult.isState("passwordRequired")) {
            expect(verifyResult.state.requestedPasswordAttribute).toEqual({
                attributeId: "password",
                inputType: "password",
                required: true,
                canChange: false,
                label: "Create password",
                confirmationInput: "confirm",
            });
            expect(verifyResult.state).not.toHaveProperty("attributes");
            expect(
                verifyResult.state["stateParameters"].continuationState
            ).toMatchObject({
                continuationToken: "ct-profile-accepted",
                links: {
                    submitAttributes: "/tenant/api/v0.1/signup/submitpassword",
                },
                signUp: {
                    purpose: "newAccount",
                    submittedAttributeIds: ["displayName", "jobTitle"],
                },
            });

            const submitResult = await verifyResult.state.submitPassword(
                "valid-password"
            );
            expect(submitResult.isState("signInContinuation")).toBe(true);
        }

        const [, verifyOptions] = (fetch as jest.Mock).mock.calls[2];
        expect(JSON.parse(verifyOptions.body)).toEqual({
            continuationToken: "ct-start",
            otp: "12345678",
        });

        const [, attributesOptions] = (fetch as jest.Mock).mock.calls[3];
        expect(JSON.parse(attributesOptions.body)).toEqual({
            continuationToken: "ct-verify",
            attributes: {
                displayName: "Test User",
                jobTitle: "Engineer",
            },
        });

        const [, passwordOptions] = (fetch as jest.Mock).mock.calls[4];
        expect(JSON.parse(passwordOptions.body)).toEqual({
            continuationToken: "ct-profile-accepted",
            attributes: {
                password: "valid-password",
            },
        });
        expect(fetch).toHaveBeenCalledTimes(5);
    });

    it.each([
        ["password", true],
        ["more attributes", false],
    ])(
        "fails retained profile validation during submitCode before prompting for %s",
        async (_nextPrompt, requestsPassword) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(buildResponse(START_RESPONSE))
                .mockResolvedValueOnce(
                    buildResponse({
                        continuationToken: "ct-verify",
                        state: "interactionRequired",
                        action: "collectAttributes",
                        attributes: [
                            ...(requestsPassword
                                ? [
                                      {
                                          attributeId: "password",
                                          inputType: "password",
                                          required: true,
                                      },
                                  ]
                                : []),
                            {
                                attributeId: "jobTitle",
                                inputType: "text",
                                required: true,
                            },
                        ],
                        _links: {
                            submitAttributes: {
                                href: "/tenant/api/v0.1/signup/submitattributes",
                            },
                        },
                    })
                )
                .mockResolvedValueOnce(
                    buildResponse(
                        {
                            error: {
                                code: "invalidRequest",
                                message: "Attribute validation failed.",
                                correlationId: "corr-profile-validation",
                                innerError: {
                                    code: "attributeValidationError",
                                    details: [
                                        {
                                            attributeIds: ["jobTitle"],
                                            code: "attributeRequired",
                                            message:
                                                "Attribute 'jobTitle' is required.",
                                        },
                                        {
                                            attributeIds: ["displayName"],
                                            code: "attributeValidationFailed",
                                            message: "Enter a valid value.",
                                        },
                                    ],
                                },
                            },
                        },
                        400
                    )
                );

            const startResult = await app.signUpV2({
                username: "user@contoso.com",
                attributes: {
                    displayName: "Invalid profile",
                },
            });
            if (!startResult.isState("codeRequired")) {
                throw new Error("Expected email verification first.");
            }

            const result = await startResult.state.submitCode("12345678");

            expect(result.isFailed()).toBe(true);
            expect(result.isPasswordRequired()).toBe(false);
            expect(result.isState("attributesRequired")).toBe(false);
            expect(result.error).toBeInstanceOf(AuthFlowErrorV2);
            expect(result.error?.requiredAttributes).toEqual(["jobTitle"]);
            expect(result.error?.invalidAttributes).toEqual(["displayName"]);
            expect(result.error?.correlationId).toBe("corr-profile-validation");
            expect(result.error?.errorData).toMatchObject({
                attributeValidationDetails: [
                    {
                        attributeIds: ["jobTitle"],
                        code: "attributeRequired",
                    },
                    {
                        attributeIds: ["displayName"],
                        code: "attributeValidationFailed",
                    },
                ],
            });
            expect(
                JSON.parse((fetch as jest.Mock).mock.calls[3][1].body)
            ).toEqual({
                continuationToken: "ct-verify",
                attributes: {
                    displayName: "Invalid profile",
                },
            });
            expect(fetch).toHaveBeenCalledTimes(4);
        }
    );

    it("collects the first password after manual profiles without replaying submitted attributes", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse(FLAT_USERNAME_REQUIRED_RESPONSE)
            )
            .mockResolvedValueOnce(
                buildResponse({
                    ...PASSWORD_AND_PROFILE_REQUIRED_RESPONSE,
                    attributes: [
                        { attributeId: "PaSsWoRd", required: true },
                        { attributeId: "surname", required: true },
                    ],
                })
            )
            .mockResolvedValueOnce(
                buildResponse({
                    ...FLAT_USERNAME_REQUIRED_RESPONSE,
                    continuationToken: "ct-profile-next",
                    attributes: [{ attributeId: "surname", required: true }],
                })
            )
            .mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-complete",
                    state: "continue",
                })
            );

        const startResult = await app.signUpV2({
            username: "user@contoso.com",
            correlationId: "corr-1",
        });
        if (!startResult.isState("codeRequired")) {
            throw new Error("Expected email verification first.");
        }
        const verifyResult = await startResult.state.submitCode("12345678");
        if (!verifyResult.isState("attributesRequired")) {
            throw new Error("Expected profile collection.");
        }
        const result = await verifyResult.state.submitAttributes({
            username: "test-user",
            givenName: "Test",
        });

        expect(result.isPasswordRequired()).toBe(true);
        if (!result.isPasswordRequired()) {
            throw new Error("Expected the first password request.");
        }
        expect(result.state.requestedPasswordAttribute).toMatchObject({
            attributeId: "PaSsWoRd",
            required: true,
        });
        expect(result.state).not.toHaveProperty("attributes");
        expect(result.error).toBeUndefined();
        expect(fetch).toHaveBeenCalledTimes(4);

        const profileResult = await result.state.submitPassword(
            "valid-password"
        );
        if (!profileResult.isState("attributesRequired")) {
            throw new Error("Expected remaining profile collection.");
        }
        const continuationResult = await profileResult.state.submitAttributes({
            surname: "User",
        });
        expect(continuationResult.isState("signInContinuation")).toBe(true);
        if (!continuationResult.isState("signInContinuation")) {
            throw new Error("Expected explicit sign-in continuation.");
        }
        expect(
            continuationResult.state["stateParameters"].continuationState.signUp
        ).toEqual({
            purpose: "newAccount",
            submittedAttributeIds: [
                "username",
                "givenName",
                "password",
                "surname",
            ],
        });

        const requests = (fetch as jest.Mock).mock.calls;
        expect(requests).toHaveLength(6);
        expect(JSON.parse(requests[3][1].body)).toEqual({
            continuationToken:
                FLAT_USERNAME_REQUIRED_RESPONSE.continuationToken,
            attributes: { username: "test-user", givenName: "Test" },
        });
        expect(JSON.parse(requests[4][1].body)).toEqual({
            continuationToken:
                PASSWORD_AND_PROFILE_REQUIRED_RESPONSE.continuationToken,
            attributes: { password: "valid-password" },
        });
        expect(JSON.parse(requests[5][1].body)).toEqual({
            continuationToken: "ct-profile-next",
            attributes: { surname: "User" },
        });
    });

    it.each([
        [false, false, false],
        [false, true, false],
        [false, false, true],
        [true, false, true],
        [true, true, true],
    ])(
        "handles repeated profile collection (initial password %s, empty submission %s, upfront profiles %s)",
        async (initialPassword, empty, upfrontProfiles) => {
            const claims = JSON.stringify({
                id_token: { auth_time: { essential: true } },
            });
            const initialResponse = initialPassword
                ? PASSWORD_AND_PROFILE_REQUIRED_RESPONSE
                : FLAT_USERNAME_REQUIRED_RESPONSE;
            const attributes = [{ attributeId: "surname", required: true }];
            const nextResponse = {
                ...FLAT_USERNAME_REQUIRED_RESPONSE,
                continuationToken: "ct-next",
                attributes,
                _links: {
                    submitAttributes: {
                        href: "/tenant/api/v0.1/signup/next",
                    },
                },
            };
            const fetchMock = (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(buildResponse(START_RESPONSE))
                .mockResolvedValueOnce(buildResponse(initialResponse));
            if (initialPassword && upfrontProfiles) {
                fetchMock.mockResolvedValueOnce(
                    buildResponse({
                        continuationToken: "ct-password",
                        state: "interactionRequired",
                        action: "collectAttributes",
                        attributes: [
                            {
                                attributeId: "password",
                                inputType: "password",
                                required: true,
                            },
                        ],
                        _links: {
                            submitAttributes: {
                                href: "/tenant/api/v0.1/signup/submitpassword",
                            },
                        },
                    })
                );
            }
            fetchMock.mockResolvedValueOnce(buildResponse(nextResponse));
            if (empty) {
                fetchMock.mockResolvedValueOnce(
                    buildResponse(
                        {
                            error: {
                                code: "invalidRequest",
                                message:
                                    "AADSTS1002027: Some of the collected attributes were invalid.",
                                correlationId: "corr-empty-attributes",
                                innerError: {
                                    code: "attributeValidationError",
                                    details: [
                                        {
                                            attributeIds: ["surname"],
                                            code: "attributeRequired",
                                            message: "This field is required.",
                                        },
                                    ],
                                },
                            },
                        },
                        400
                    )
                );
            } else {
                fetchMock.mockResolvedValueOnce(
                    buildResponse({
                        continuationToken: "ct-final",
                        state: "continue",
                    })
                );
                fetchMock
                    .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
                    .mockResolvedValueOnce(
                        buildResponse(TestServerTokenResponse)
                    );
            }

            const profile = { username: "test-user", givenName: "Test" };
            const startResult = await app.signUpV2({
                username: "user@contoso.com",
                scopes: ["User.Read"],
                claims,
                correlationId: "corr-1",
                attributes: upfrontProfiles ? profile : undefined,
            });
            if (!startResult.isState("codeRequired")) {
                throw new Error("Expected email verification first.");
            }
            const verifyResult = await startResult.state.submitCode("12345678");
            const collectionResult = verifyResult.isPasswordRequired()
                ? await verifyResult.state.submitPassword("initial-password")
                : verifyResult.isState("attributesRequired")
                ? upfrontProfiles
                    ? verifyResult
                    : await verifyResult.state.submitAttributes(profile)
                : undefined;
            if (
                !collectionResult ||
                !collectionResult.isState("attributesRequired")
            ) {
                throw new Error("Expected another successful collection.");
            }
            expect(collectionResult.isPasswordRequired()).toBe(false);
            expect(collectionResult.state.attributes).toEqual(attributes);
            expect(collectionResult.error).toBeUndefined();
            expect(collectionResult.data).toBeUndefined();
            expect(collectionResult.scenario).toBe("signUp");
            expect(
                collectionResult.state["stateParameters"].continuationState
            ).toEqual({
                continuationToken: "ct-next",
                scenario: "signUp",
                scopes: ["User.Read", "openid", "profile", "offline_access"],
                links: {
                    submitAttributes: nextResponse._links.submitAttributes.href,
                },
                signUp: {
                    purpose: "newAccount",
                    submittedAttributeIds: [
                        ...Object.keys(profile),
                        ...(initialPassword ? ["password"] : []),
                    ],
                },
            });
            expect(
                collectionResult.state["stateParameters"]
            ).not.toHaveProperty("password");
            expect(profile).toEqual({
                username: "test-user",
                givenName: "Test",
            });
            const nextAttributes: customAuth.UserAccountAttributes = empty
                ? {}
                : { surname: "User" };
            const continuationResult =
                await collectionResult.state.submitAttributes(nextAttributes);
            if (empty) {
                expect(continuationResult.isFailed()).toBe(true);
                expect(continuationResult.state).toBeInstanceOf(FailedStateV2);
                expect(continuationResult.error?.requiredAttributes).toEqual([
                    "surname",
                ]);
                expect(continuationResult.error?.innerErrorCode).toBe(
                    "attributeValidationError"
                );
                expect(
                    collectionResult.state["stateParameters"].continuationState
                        .signUp?.submittedAttributeIds
                ).toEqual([
                    ...Object.keys(profile),
                    ...(initialPassword ? ["password"] : []),
                ]);
                expect(fetch).toHaveBeenCalledTimes(initialPassword ? 6 : 5);
                expect(
                    JSON.parse(
                        (fetch as jest.Mock).mock.calls[
                            initialPassword ? 5 : 4
                        ][1].body
                    )
                ).toEqual({
                    continuationToken: "ct-next",
                    attributes: {},
                });
                expect(app.getAllAccounts()).toHaveLength(0);
                return;
            }
            if (!continuationResult.isState("signInContinuation")) {
                throw new Error("Expected explicit sign-in continuation.");
            }
            expect(
                continuationResult.state["stateParameters"].continuationState
                    .signUp
            ).toEqual({
                purpose: "newAccount",
                submittedAttributeIds: [
                    ...Object.keys(profile),
                    ...(initialPassword ? ["password"] : []),
                    ...Object.keys(nextAttributes),
                ],
            });
            expect(continuationResult.data).toBeUndefined();
            expect(fetch).toHaveBeenCalledTimes(initialPassword ? 6 : 5);
            expect(app.getAllAccounts()).toHaveLength(0);

            const requests = (fetch as jest.Mock).mock.calls;
            expect((requests[0][1].body as URLSearchParams).get("claims")).toBe(
                claims
            );
            expect(
                (requests[0][1].body as URLSearchParams)
                    .get("scope")
                    ?.split(" ")
            ).toEqual(["User.Read", "openid", "profile", "offline_access"]);
            expect(JSON.parse(requests[3][1].body)).toEqual({
                continuationToken: initialResponse.continuationToken,
                attributes: profile,
            });
            if (initialPassword) {
                expect(JSON.parse(requests[4][1].body)).toEqual({
                    continuationToken: "ct-password",
                    attributes: {
                        password: "initial-password",
                    },
                });
            }
            const nextAttributesRequestIndex = initialPassword ? 5 : 4;
            expect(String(requests[nextAttributesRequestIndex][0])).toContain(
                "/signup/next"
            );
            expect(
                JSON.parse(requests[nextAttributesRequestIndex][1].body)
            ).toEqual({
                continuationToken: "ct-next",
                attributes: nextAttributes,
            });
            expect(requests[3][1].headers["client-request-id"]).toBe("corr-1");
            expect(
                requests[nextAttributesRequestIndex][1].headers[
                    "client-request-id"
                ]
            ).toBe("corr-1");

            const completedResult = await continuationResult.state.signIn();
            expect(completedResult.isState("completed")).toBe(true);
            expect(completedResult.data).toBeInstanceOf(CustomAuthAccountData);
            expect(fetch).toHaveBeenCalledTimes(initialPassword ? 8 : 7);
            expect(
                (
                    requests[initialPassword ? 6 : 5][1].body as URLSearchParams
                ).get("continuation_token")
            ).toBe("ct-final");
        }
    );

    it.each(["PaSsWoRd", "givenName", "surname"])(
        "fails instead of prompting for %s again after password and profile collection",
        async (attributeId) => {
            const nextAttributesResponse = {
                ...FLAT_USERNAME_REQUIRED_RESPONSE,
                continuationToken: "ct-profile",
                attributes: [{ attributeId: "surname", required: true }],
                _links: {
                    submitAttributes: { href: "/signup/profile" },
                },
            };
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(buildResponse(START_RESPONSE))
                .mockResolvedValueOnce(
                    buildResponse(PASSWORD_AND_PROFILE_REQUIRED_RESPONSE)
                )
                .mockResolvedValueOnce(
                    buildResponse({
                        continuationToken: "ct-password",
                        state: "interactionRequired",
                        action: "collectAttributes",
                        attributes: [
                            {
                                attributeId: "password",
                                inputType: "password",
                                required: true,
                            },
                        ],
                        _links: {
                            submitAttributes: {
                                href: "/signup/password",
                            },
                        },
                    })
                )
                .mockResolvedValueOnce(buildResponse(nextAttributesResponse))
                .mockResolvedValueOnce(
                    buildResponse({
                        ...nextAttributesResponse,
                        continuationToken: "ct-repeat",
                        attributes: [
                            { attributeId },
                            { attributeId: "city", required: true },
                        ],
                    })
                );

            const startResult = await app.signUpV2({
                username: "user@contoso.com",
                correlationId: "corr-1",
                attributes: { givenName: "Test" },
            });
            if (!startResult.isState("codeRequired")) {
                throw new Error("Expected email verification first.");
            }
            const verifyResult = await startResult.state.submitCode("12345678");
            if (!verifyResult.isPasswordRequired()) {
                throw new Error("Expected password collection.");
            }
            const profileResult = await verifyResult.state.submitPassword(
                "valid-password"
            );
            if (!profileResult.isState("attributesRequired")) {
                throw new Error("Expected new profile attributes.");
            }
            const result = await profileResult.state.submitAttributes({
                surname: "User",
            });

            expect(result.isFailed()).toBe(true);
            expect(result.state).toBeInstanceOf(FailedStateV2);
            expect(result.isPasswordRequired()).toBe(false);
            expect(result.error?.errorData).toBeInstanceOf(CustomAuthError);
            expect(result.error?.errorData).not.toBeInstanceOf(
                CustomAuthApiError
            );
            expect(result.error?.errorData).toMatchObject({
                error: UNSUPPORTED_FLOW_TRANSITION,
                correlationId: "corr-1",
            });
            expect(result.error?.isInvalidInput()).toBe(false);
            expect(result.scenario).toBe("signUp");
            expect(fetch).toHaveBeenCalledTimes(6);
            expect(app.getAllAccounts()).toHaveLength(0);
        }
    );

    it.each<{
        name: string;
        attributes: UserAccountAttributes;
        requiredAttributes: string[];
        invalidAttributes: string[];
        invalidPassword: boolean;
        details: AttributeValidationDetailV2[];
    }>([
        {
            name: "invalid and missing profile values",
            attributes: { city: "Redmond" },
            requiredAttributes: ["jobTitle"],
            invalidAttributes: ["city"],
            invalidPassword: false,
            details: [
                {
                    attributeIds: ["jobTitle"],
                    code: "attributeRequired",
                    message: "Attribute 'jobTitle' is required.",
                },
                {
                    attributeIds: ["city"],
                    code: "attributeValidationFailed",
                    message: "Enter a valid value.",
                },
            ],
        },
        {
            name: "an empty required attribute",
            attributes: { givenName: "" },
            requiredAttributes: ["givenName"],
            invalidAttributes: [],
            invalidPassword: false,
            details: [
                {
                    attributeIds: ["givenName"],
                    code: "attributeRequired",
                    message: "This field is required.",
                },
            ],
        },
        {
            name: "an empty attribute object",
            attributes: {},
            requiredAttributes: ["password", "username", "givenName"],
            invalidAttributes: [],
            invalidPassword: true,
            details: [
                {
                    attributeIds: ["password"],
                    code: "attributeRequired",
                    message: "This field is required.",
                },
                {
                    attributeIds: ["username"],
                    code: "attributeRequired",
                    message: "This field is required.",
                },
                {
                    attributeIds: ["givenName"],
                    code: "attributeRequired",
                    message: "This field is required.",
                },
            ],
        },
    ])(
        "IT-SU-13: preserves terminal validation errors for $name",
        async ({
            attributes,
            requiredAttributes,
            invalidAttributes,
            invalidPassword,
            details,
        }) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(buildResponse(START_RESPONSE))
                .mockResolvedValueOnce(
                    buildResponse({
                        continuationToken: "ct-profile",
                        state: "interactionRequired",
                        action: "collectAttributes",
                        attributes: [
                            {
                                attributeId: "jobTitle",
                                inputType: "text",
                                required: true,
                            },
                            {
                                attributeId: "city",
                                inputType: "text",
                                required: false,
                            },
                        ],
                        _links: {
                            submitAttributes: {
                                href: "/tenant/api/v0.1/signup/submitattributes",
                            },
                        },
                    })
                )
                .mockResolvedValueOnce(
                    buildResponse(
                        {
                            error: {
                                code: "invalidRequest",
                                message:
                                    "AADSTS1002027: Some of the collected attributes were invalid.",
                                correlationId: "corr-attributes",
                                innerError: {
                                    code: "attributeValidationError",
                                    details,
                                },
                            },
                        },
                        400
                    )
                );

            const startResult = await app.signUpV2({
                username: "user@contoso.com",
            });
            if (!startResult.isState("codeRequired")) {
                throw new Error("Expected challenge verification state.");
            }

            const verifyResult = await startResult.state.submitCode("12345678");
            expect(verifyResult.state).toBeInstanceOf(
                AttributesRequiredStateV2
            );
            if (!verifyResult.isState("attributesRequired")) {
                throw new Error("Expected attributes required state.");
            }
            expect(verifyResult.state.attributes).toEqual([
                {
                    attributeId: "jobTitle",
                    inputType: "text",
                    required: true,
                },
                {
                    attributeId: "city",
                    inputType: "text",
                    required: false,
                },
            ]);

            const submitResult = await verifyResult.state.submitAttributes(
                attributes
            );
            expect(submitResult.isFailed()).toBe(true);
            expect(submitResult.state).toBeInstanceOf(FailedStateV2);
            expect(submitResult.isState("attributesRequired")).toBe(false);
            expect(submitResult.isPasswordRequired()).toBe(false);
            expect(submitResult.error).toBeInstanceOf(AuthFlowErrorV2);
            expect(submitResult.error?.isInvalidAttributes()).toBe(
                !invalidPassword
            );
            expect(submitResult.error?.isInvalidPassword()).toBe(
                invalidPassword
            );
            expect(submitResult.error?.requiredAttributes).toEqual(
                requiredAttributes
            );
            expect(submitResult.error?.invalidAttributes).toEqual(
                invalidAttributes
            );
            expect(submitResult.error?.correlationId).toBe("corr-attributes");
            expect(submitResult.error?.errorData).toMatchObject({
                error: "invalidRequest",
                errorDescription:
                    "AADSTS1002027: Some of the collected attributes were invalid.",
                innerErrorCode: "attributeValidationError",
                attributeValidationDetails: details,
            });

            expect(
                JSON.parse((fetch as jest.Mock).mock.calls[3][1].body)
            ).toEqual({
                continuationToken: "ct-profile",
                attributes,
            });
            expect(
                verifyResult.state["stateParameters"].continuationState.signUp
            ).toEqual({
                purpose: "newAccount",
                pendingProfileAttributes: {},
                submittedAttributeIds: [],
            });

            expect(fetch).toHaveBeenCalledTimes(4);
        }
    );

    it("returns sign-in continuation when code verification completes sign-up", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-verify",
                    state: "continue",
                })
            );

        const startResult = await app.signUpV2({
            username: "user@contoso.com",
        });

        if (!startResult.isState("codeRequired")) {
            throw new Error("Expected challenge verification state.");
        }

        const verifyResult = await startResult.state.submitCode("12345678");

        expect(verifyResult.isState("signInContinuation")).toBe(true);
        expect(verifyResult.state).toBeInstanceOf(SignInContinuationStateV2);
        expect(verifyResult.scenario).toBe("signUp");
        if (verifyResult.isState("signInContinuation")) {
            expect(
                verifyResult.state["stateParameters"].continuationState
            ).toEqual({
                continuationToken: "ct-verify",
                scenario: "signUp",
                scopes: ["openid", "profile", "offline_access"],
                links: {},
                signUp: {
                    purpose: "newAccount",
                    pendingProfileAttributes: {},
                    submittedAttributeIds: [],
                },
            });
        }
    });

    it("automatically submits retained upfront attributes once after verification", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-attributes",
                    state: "interactionRequired",
                    action: "collectAttributes",
                    attributes: [
                        {
                            attributeId: "givenName",
                            inputType: "text",
                            required: true,
                        },
                        {
                            attributeId: "username",
                            inputType: "text",
                            required: true,
                        },
                    ],
                    _links: {
                        submitAttributes: {
                            href: "/tenant/api/v0.1/signup/submitattributes",
                        },
                    },
                })
            )
            .mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-complete",
                    state: "continue",
                })
            )
            .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

        const runtimeInputs = {
            username: "user@contoso.com",
            password: "valid-password",
            scopes: ["User.Read"],
            attributes: {
                givenName: "Test",
                username: "test-user",
            },
        };
        const startResult = await app.signUpV2(runtimeInputs);
        if (!startResult.isState("codeRequired")) {
            throw new Error("Expected challenge verification state.");
        }

        const verifyResult = await startResult.state.submitCode("12345678");
        if (!verifyResult.isState("signInContinuation")) {
            throw new Error("Expected sign-in continuation state.");
        }

        const completedResult = await verifyResult.state.signIn();

        expect(completedResult.isState("completed")).toBe(true);
        expect(completedResult.state).toBeInstanceOf(CompletedStateV2);
        expect(completedResult.data).toBeInstanceOf(CustomAuthAccountData);
        expect(JSON.parse((fetch as jest.Mock).mock.calls[3][1].body)).toEqual({
            continuationToken: "ct-attributes",
            attributes: {
                givenName: "Test",
                username: "test-user",
            },
        });
        expect(fetch).toHaveBeenCalledTimes(6);
    });

    it("completes sign-up after deferred password and required attributes", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-password",
                    state: "interactionRequired",
                    action: "collectAttributes",
                    attributes: [
                        {
                            attributeId: "password",
                            inputType: "password",
                            required: true,
                        },
                        {
                            attributeId: "givenName",
                            inputType: "text",
                            required: true,
                        },
                        {
                            attributeId: "username",
                            inputType: "text",
                            required: true,
                        },
                    ],
                    _links: {
                        submitAttributes: {
                            href: "/tenant/api/v0.1/signup/submitattributes",
                        },
                    },
                })
            )
            .mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-password-only",
                    state: "interactionRequired",
                    action: "collectAttributes",
                    attributes: [
                        {
                            attributeId: "password",
                            inputType: "password",
                            required: true,
                        },
                    ],
                    _links: {
                        submitAttributes: {
                            href: "/tenant/api/v0.1/signup/submitpassword",
                        },
                    },
                })
            )
            .mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-complete",
                    state: "continue",
                })
            )
            .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

        const startResult = await app.signUpV2({
            username: "user@contoso.com",
            attributes: {
                displayName: "Test User",
                givenName: "Test",
                username: "test-user",
            },
            scopes: ["User.Read"],
        });
        if (!startResult.isState("codeRequired")) {
            throw new Error("Expected challenge verification state.");
        }

        const verifyResult = await startResult.state.submitCode("12345678");
        if (!verifyResult.isState("passwordRequired")) {
            throw new Error("Expected password required state.");
        }

        const passwordResult = await verifyResult.state.submitPassword(
            "valid-password"
        );
        if (!passwordResult.isState("signInContinuation")) {
            throw new Error("Expected sign-in continuation state.");
        }

        const completedResult = await passwordResult.state.signIn();

        expect(completedResult.isState("completed")).toBe(true);
        expect(completedResult.state).toBeInstanceOf(CompletedStateV2);
        expect(completedResult.data).toBeInstanceOf(CustomAuthAccountData);
        expect(JSON.parse((fetch as jest.Mock).mock.calls[3][1].body)).toEqual({
            continuationToken: "ct-password",
            attributes: {
                displayName: "Test User",
                givenName: "Test",
                username: "test-user",
            },
        });
        expect(JSON.parse((fetch as jest.Mock).mock.calls[4][1].body)).toEqual({
            continuationToken: "ct-password-only",
            attributes: {
                password: "valid-password",
            },
        });
        expect(fetch).toHaveBeenCalledTimes(7);
    });

    it.each([
        {
            name: "a password policy violation",
            response: PASSWORD_POLICY_ERROR_RESPONSE,
            invalidPassword: true,
        },
        {
            name: "a weak password",
            response: WEAK_PASSWORD_ERROR_RESPONSE,
            invalidPassword: true,
        },
        {
            name: "an invalid continuation token",
            response: {
                error: {
                    code: "invalidRequest",
                    message:
                        "AADSTS90100: continuationToken parameter is empty or not valid.",
                    correlationId: "corr-invalid-continuation",
                },
            },
            invalidPassword: false,
        },
    ])(
        "IT-SU-14: distinguishes password collection from $name",
        async ({ response, invalidPassword }) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(buildResponse(START_RESPONSE))
                .mockResolvedValueOnce(
                    buildResponse({
                        continuationToken: "ct-password",
                        state: "interactionRequired",
                        action: "collectAttributes",
                        attributes: [
                            {
                                attributeId: "password",
                                inputType: "password",
                                required: true,
                            },
                        ],
                        _links: {
                            submitAttributes: {
                                href: "/tenant/api/v0.1/signup/submitattributes",
                            },
                        },
                    })
                )
                .mockResolvedValueOnce(
                    buildResponse({
                        continuationToken: "ct-password-only",
                        state: "interactionRequired",
                        action: "collectAttributes",
                        attributes: [
                            {
                                attributeId: "password",
                                inputType: "password",
                                required: true,
                            },
                        ],
                        _links: {
                            submitAttributes: {
                                href: "/tenant/api/v0.1/signup/submitpassword",
                            },
                        },
                    })
                )
                .mockResolvedValueOnce(buildResponse(response, 400));

            const startResult = await app.signUpV2({
                username: "user@contoso.com",
                attributes: { displayName: "Test User" },
            });
            if (!startResult.isState("codeRequired")) {
                throw new Error("Expected challenge verification state.");
            }

            const verifyResult = await startResult.state.submitCode("12345678");
            expect(verifyResult.isState("passwordRequired")).toBe(true);
            expect(verifyResult.error).toBeUndefined();
            if (!verifyResult.isState("passwordRequired")) {
                throw new Error("Expected password required state.");
            }

            const passwordResult = await verifyResult.state.submitPassword(
                "weak"
            );

            expect(passwordResult.isFailed()).toBe(true);
            expect(passwordResult.error?.isInvalidPassword()).toBe(
                invalidPassword
            );
            expect(passwordResult.error?.correlationId).toBe(
                response.error.correlationId
            );
            expect(
                JSON.parse((fetch as jest.Mock).mock.calls[3][1].body)
            ).toEqual({
                continuationToken: "ct-password",
                attributes: {
                    displayName: "Test User",
                },
            });
            expect(
                JSON.parse((fetch as jest.Mock).mock.calls[4][1].body)
            ).toEqual({
                continuationToken: "ct-password-only",
                attributes: {
                    password: "weak",
                },
            });
        }
    );
});

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { CustomAuthFlowScenarioV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthFlowScenarioV2.js";
import { CustomAuthApiError } from "../../../../../../src/custom_auth/core/error/CustomAuthApiError.js";
import { CodeRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/CodeRequiredStateV2.js";
import { CompletedStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/CompletedStateV2.js";
import { AttributesRequiredStateV2 } from "../../../../../../src/custom_auth/sign_up/auth_flow/v2/state/AttributesRequiredStateV2.js";
import { SignUpPasswordRequiredStateV2 } from "../../../../../../src/custom_auth/sign_up/auth_flow/v2/state/SignUpPasswordRequiredStateV2.js";
import { SignInContinuationStateV2 } from "../../../../../../src/custom_auth/sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";
import { SignUpStateTransitionHandlerV2 } from "../../../../../../src/custom_auth/sign_up/auth_flow/v2/state/SignUpStateTransitionHandlerV2.js";
import { AuthMethodSelectionRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/AuthMethodSelectionRequiredStateV2.js";
import { SignInStateTransitionHandlerV2 } from "../../../../../../src/custom_auth/sign_in/auth_flow/v2/state/SignInStateTransitionHandlerV2.js";
import { FlowInteractionClientV2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import {
    FLOW_ATTRIBUTES_REQUIRED_V2,
    FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2,
    FLOW_COMPLETED_V2,
    FLOW_MFA_REQUIRED_V2,
    FLOW_SIGN_UP_PASSWORD_REQUIRED_V2,
    FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2,
} from "../../../../../../src/custom_auth/core/interaction_client/v2/result/FlowActionResultV2.js";
import { CustomAuthAccountData } from "../../../../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { CustomAuthSilentCacheClient } from "../../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import type { AuthenticationResult } from "../../../../../../src/response/AuthenticationResult.js";
import { getDefaultLogger } from "../../../../test_resources/TestModules.js";
import { AuthMethodRegistrationRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/AuthMethodRegistrationRequiredStateV2.js";

describe("CodeRequiredStateV2", () => {
    const correlationId = "test-correlation-id";
    const scopes = ["openid", "profile", "offline_access"];
    const flowClient = {
        submitCode: jest.fn(),
        resendCode: jest.fn(),
    } as unknown as jest.Mocked<FlowInteractionClientV2>;
    const signInStateTransitionHandler = new SignInStateTransitionHandlerV2();
    const signUpStateTransitionHandler = new SignUpStateTransitionHandlerV2();

    const buildState = (): CodeRequiredStateV2 =>
        new CodeRequiredStateV2({
            correlationId,
            logger: getDefaultLogger(),
            config: {
                auth: { clientId: "test-client-id" },
                customAuth: { challengeTypes: ["oob"] },
            } as unknown as CustomAuthBrowserConfiguration,
            flowClient,
            cacheClient: {} as CustomAuthSilentCacheClient,
            signInStateTransitionHandler,
            continuationState: {
                continuationToken: "ct-mfa-challenge",
                scenario: CustomAuthFlowScenarioV2.SignIn,
                scopes,
                links: {
                    verify: "/mfa/verify",
                },
            },
            method: {
                id: "email-mfa",
                type: "email",
                hint: "u***@contoso.com",
                challengeHref: "/mfa/challenge",
            },
            sentTo: "u***@contoso.com",
            channel: "email",
            codeLength: 6,
        });

    const buildSignUpState = (): CodeRequiredStateV2 =>
        new CodeRequiredStateV2({
            correlationId,
            logger: getDefaultLogger(),
            config: {
                auth: { clientId: "test-client-id" },
                customAuth: { challengeTypes: ["oob"] },
            } as unknown as CustomAuthBrowserConfiguration,
            flowClient,
            cacheClient: {} as CustomAuthSilentCacheClient,
            signUpStateTransitionHandler,
            continuationState: {
                continuationToken: "ct-sign-up-challenge",
                scenario: CustomAuthFlowScenarioV2.SignUp,
                scopes,
                links: {
                    verify: "/signup/verify",
                },
            },
            sentTo: "user@contoso.com",
            channel: "email",
            codeLength: 8,
        });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns completed sign-in after submitting a first-factor code", async () => {
        flowClient.submitCode.mockResolvedValue({
            type: FLOW_COMPLETED_V2,
            correlationId,
            authenticationResult: {
                account: {
                    homeAccountId: "uid.utid",
                },
            } as unknown as AuthenticationResult,
        });

        const result = await buildState().submitCode("123456");

        expect(flowClient.submitCode).toHaveBeenCalledWith({
            correlationId,
            continuationState: {
                continuationToken: "ct-mfa-challenge",
                scenario: CustomAuthFlowScenarioV2.SignIn,
                scopes,
                links: {
                    verify: "/mfa/verify",
                },
            },
            code: "123456",
        });
        expect(result.isState("completed")).toBe(true);
        expect(result.state).toBeInstanceOf(CompletedStateV2);
        expect(result.data).toBeInstanceOf(CustomAuthAccountData);
    });

    it("submits a wrong-length first-factor code and surfaces the server error", async () => {
        flowClient.submitCode.mockRejectedValue(
            new CustomAuthApiError(
                "invalidGrant",
                "AADSTS50181: Unable to validate the otp.",
                correlationId,
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

        const result = await buildState().submitCode("12345");

        expect(flowClient.submitCode).toHaveBeenCalledWith(
            expect.objectContaining({
                code: "12345",
            })
        );
        expect(result.isFailed()).toBe(true);
        expect(result.error?.isInvalidCode()).toBe(true);
    });

    it("submits an empty first-factor code and surfaces the server error", async () => {
        flowClient.submitCode.mockRejectedValue(
            new CustomAuthApiError(
                "invalidGrant",
                "AADSTS50181: Unable to validate the otp.",
                correlationId,
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

        const result = await buildState().submitCode("");

        expect(flowClient.submitCode).toHaveBeenCalledWith(
            expect.objectContaining({
                code: "",
            })
        );
        expect(result.isFailed()).toBe(true);
        expect(result.error?.isInvalidCode()).toBe(true);
    });

    it("returns method selection after submitting a first-factor code", async () => {
        flowClient.submitCode.mockResolvedValue({
            type: FLOW_MFA_REQUIRED_V2,
            correlationId,
            continuationState: {
                continuationToken: "ct-mfa",
                scenario: CustomAuthFlowScenarioV2.SignIn,
                scopes,
                links: {},
            },
            methods: [
                {
                    id: "sms-mfa",
                    type: "sms",
                    challengeHref: "/mfa/sms/challenge",
                },
            ],
        });

        const result = await buildState().submitCode("123456");

        expect(result.isState("authMethodSelectionRequired")).toBe(true);
        expect(result.state).toBeInstanceOf(AuthMethodSelectionRequiredStateV2);
    });

    it("returns registration-required after submitting a sign-in code", async () => {
        flowClient.submitCode.mockResolvedValue({
            type: FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2,
            correlationId,
            continuationState: {
                continuationToken: "ct-enroll",
                scenario: CustomAuthFlowScenarioV2.SignIn,
                scopes,
                links: {},
            },
            methods: [
                {
                    type: "phone",
                    channels: ["sms"],
                    enrollHref: "/enroll/phone",
                },
            ],
        });

        const result = await buildState().submitCode("123456");

        expect(result.isState("authMethodRegistrationRequired")).toBe(true);
        expect(result.state).toBeInstanceOf(
            AuthMethodRegistrationRequiredStateV2
        );
    });

    it("returns code-required when resending a sign-up code", async () => {
        flowClient.resendCode.mockResolvedValue({
            type: "FlowCodeRequiredResultV2",
            correlationId,
            continuationState: {
                continuationToken: "ct-sign-up-resend",
                scenario: CustomAuthFlowScenarioV2.SignUp,
                scopes,
                links: {
                    verify: "/signup/verify-new",
                    resend: "/signup/resend-new",
                },
                signUp: {
                    passwordWasSupplied: false,
                },
            },
            sentTo: "user@contoso.com",
            channel: "email",
            codeLength: 8,
        });

        const result = await buildSignUpState().resendCode();

        expect(result.isState("codeRequired")).toBe(true);
        expect(result.state).toBeInstanceOf(CodeRequiredStateV2);
        expect(result.state).toMatchObject({
            sentTo: "user@contoso.com",
            channel: "email",
            codeLength: 8,
        });
    });

    it("returns attributes required after verifying a sign-up code", async () => {
        flowClient.submitCode.mockResolvedValue({
            type: FLOW_ATTRIBUTES_REQUIRED_V2,
            correlationId,
            continuationState: {
                continuationToken: "ct-sign-up-verify",
                scenario: CustomAuthFlowScenarioV2.SignUp,
                scopes,
                links: {
                    submitAttributes: "/signup/submitattributes",
                },
            },
            attributes: [
                {
                    attributeId: "password",
                    inputType: "password",
                    required: true,
                    confirmationInput: "retype",
                },
            ],
        });

        const result = await buildSignUpState().submitCode("12345678");

        expect(result.isState("attributesRequired")).toBe(true);
        expect(result.state).toBeInstanceOf(AttributesRequiredStateV2);
    });

    it("identifies an existing account from a sign-up verification error", async () => {
        flowClient.submitCode.mockRejectedValue(
            new CustomAuthApiError(
                "invalidRequest",
                "AADSTS1003037: An account may already exist.",
                correlationId,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                [
                    {
                        attributeIds: ["email"],
                        code: "userAlreadyExists",
                        message:
                            "An account with this identifier already exists.",
                    },
                ]
            )
        );

        const result = await buildSignUpState().submitCode("12345678");

        expect(result.isFailed()).toBe(true);
        expect(result.error?.isUserAlreadyExists()).toBe(true);
    });

    it("returns password required after verifying a sign-up code", async () => {
        const requiredPasswordAttribute = {
            attributeId: "password",
            inputType: "password",
            required: true,
            confirmationInput: "retype",
        };
        flowClient.submitCode.mockResolvedValue({
            type: FLOW_SIGN_UP_PASSWORD_REQUIRED_V2,
            correlationId,
            continuationState: {
                continuationToken: "ct-sign-up-verify",
                scenario: CustomAuthFlowScenarioV2.SignUp,
                scopes,
                links: {
                    submitAttributes: "/signup/submitattributes",
                },
                signUp: {
                    passwordWasSupplied: false,
                },
            },
            attributes: [],
            requiredPasswordAttribute,
        });

        const result = await buildSignUpState().submitCode("12345678");

        expect(result.isState("passwordRequired")).toBe(true);
        expect(result.state).toBeInstanceOf(SignUpPasswordRequiredStateV2);
        if (result.isState("passwordRequired")) {
            expect(result.state.requiredPasswordAttribute).toEqual(
                requiredPasswordAttribute
            );
        }
    });

    it("returns sign-in continuation after completed sign-up verification", async () => {
        flowClient.submitCode.mockResolvedValue({
            type: FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2,
            correlationId,
            continuationState: {
                continuationToken: "ct-sign-up-verify",
                scenario: CustomAuthFlowScenarioV2.SignUp,
                scopes,
                links: {},
            },
        });

        const result = await buildSignUpState().submitCode("12345678");

        expect(result.isState("signInContinuation")).toBe(true);
        expect(result.state).toBeInstanceOf(SignInContinuationStateV2);
    });
});

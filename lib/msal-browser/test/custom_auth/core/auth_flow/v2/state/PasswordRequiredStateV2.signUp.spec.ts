/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { CustomAuthFlowScenarioV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthFlowScenarioV2.js";
import { AuthMethodRegistrationRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/AuthMethodRegistrationRequiredStateV2.js";
import { CodeRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/CodeRequiredStateV2.js";
import { FlowInteractionClientV2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import {
    FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2,
    FLOW_CODE_REQUIRED_V2,
    FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2,
} from "../../../../../../src/custom_auth/core/interaction_client/v2/result/FlowActionResultV2.js";
import { CustomAuthSilentCacheClient } from "../../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { PasswordRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/PasswordRequiredStateV2.js";
import type { PasswordRequiredStateParametersV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/CustomAuthStateParametersV2.js";
import { UnexpectedError } from "../../../../../../src/custom_auth/core/error/UnexpectedError.js";
import { SignUpStateTransitionHandlerV2 } from "../../../../../../src/custom_auth/sign_up/auth_flow/v2/state/SignUpStateTransitionHandlerV2.js";
import { SignInContinuationStateV2 } from "../../../../../../src/custom_auth/sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";
import { getDefaultLogger } from "../../../../test_resources/TestModules.js";

describe("PasswordRequiredStateV2 sign-up", () => {
    const correlationId = "test-correlation-id";
    const scopes = ["openid", "profile", "offline_access"];
    const flowClient = {
        submitSignUpAttributes: jest.fn(),
        submitSignInPassword: jest.fn(),
    } as unknown as jest.Mocked<FlowInteractionClientV2>;
    const continuationState = {
        continuationToken: "ct-password",
        scenario: CustomAuthFlowScenarioV2.SignUp,
        scopes,
        links: {
            submitAttributes: "/signup/submitattributes",
        },
        signUp: {
            passwordWasSupplied: false,
        },
    };

    const buildState = (
        overrides: Partial<PasswordRequiredStateParametersV2> = {}
    ): PasswordRequiredStateV2 =>
        new PasswordRequiredStateV2({
            correlationId,
            logger: getDefaultLogger(),
            config: {
                auth: { clientId: "test-client-id" },
                customAuth: { challengeTypes: ["oob"] },
            } as unknown as CustomAuthBrowserConfiguration,
            flowClient,
            cacheClient: {} as CustomAuthSilentCacheClient,
            signUpStateTransitionHandler: new SignUpStateTransitionHandlerV2(),
            continuationState,
            attributes: [
                {
                    attributeId: "givenName",
                    inputType: "text",
                    required: true,
                },
            ],
            requiredPasswordAttribute: {
                attributeId: "password",
                inputType: "password",
                required: true,
            },
            ...overrides,
        });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("submits password and profile attributes together", async () => {
        flowClient.submitSignUpAttributes.mockResolvedValue({
            type: FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2,
            correlationId,
            continuationState: {
                continuationToken: "ct-complete",
                scenario: CustomAuthFlowScenarioV2.SignUp,
                scopes,
                links: {},
            },
        });

        const attributes = {
            givenName: "Test",
            username: "test-user",
            password: "wrong-password",
        };
        const result = await buildState().submitPassword(
            "valid-password",
            attributes
        );

        expect(flowClient.submitSignUpAttributes).toHaveBeenCalledWith({
            correlationId,
            continuationState,
            attributes: {
                givenName: "Test",
                username: "test-user",
                password: "valid-password",
            },
        });
        expect(result.isState("signInContinuation")).toBe(true);
        expect(result.state).toBeInstanceOf(SignInContinuationStateV2);
        expect(result.scenario).toBe(CustomAuthFlowScenarioV2.SignUp);
        expect(result.data).toBeUndefined();
        expect(attributes.password).toBe("wrong-password");
        expect(flowClient.submitSignInPassword).not.toHaveBeenCalled();
    });

    it("rejects an empty password before submitting attributes", async () => {
        const result = await buildState().submitPassword("");

        expect(result.isFailed()).toBe(true);
        expect(result.error?.isInvalidInput()).toBe(true);
        expect(flowClient.submitSignUpAttributes).not.toHaveBeenCalled();
    });

    it("returns another code-verification state when requested", async () => {
        flowClient.submitSignUpAttributes.mockResolvedValue({
            type: FLOW_CODE_REQUIRED_V2,
            correlationId,
            continuationState: {
                continuationToken: "ct-challenge",
                scenario: CustomAuthFlowScenarioV2.SignUp,
                scopes,
                links: {
                    verify: "/signup/verify",
                    resend: "/signup/resend",
                },
            },
            sentTo: "u***@contoso.com",
            channel: "email",
            codeLength: 8,
        });

        const result = await buildState().submitPassword("valid-password");

        expect(result.isState("codeRequired")).toBe(true);
        expect(result.state).toBeInstanceOf(CodeRequiredStateV2);
    });

    it("returns registration when deferred password submission requires enrollment", async () => {
        flowClient.submitSignUpAttributes.mockResolvedValue({
            type: FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2,
            correlationId,
            continuationState: {
                ...continuationState,
                continuationToken: "ct-enroll",
                links: {},
            },
            methods: [
                {
                    type: "email",
                    channels: [],
                    enrollHref: "/signup/methods/email",
                },
            ],
        });

        const result = await buildState().submitPassword("valid-password");

        expect(result.isState("authMethodRegistrationRequired")).toBe(true);
        expect(result.state).toBeInstanceOf(
            AuthMethodRegistrationRequiredStateV2
        );
        expect(result.state).toMatchObject({
            methods: [
                {
                    type: "email",
                    channels: [],
                    enrollHref: "/signup/methods/email",
                },
            ],
        });
    });

    it("returns a failed result for an unsupported transition", async () => {
        flowClient.submitSignUpAttributes.mockResolvedValue({
            type: "unsupported" as typeof FLOW_CODE_REQUIRED_V2,
            correlationId,
            continuationState,
            sentTo: "",
            channel: "",
            codeLength: 0,
        });

        const result = await buildState().submitPassword("valid-password");

        expect(result.isFailed()).toBe(true);
    });

    it("fails before networking when the sign-up transition handler is missing", async () => {
        const result = await buildState({
            signUpStateTransitionHandler: undefined,
        }).submitPassword("valid-password");

        expect(result.isFailed()).toBe(true);
        expect(result.scenario).toBe(CustomAuthFlowScenarioV2.SignUp);
        expect(result.error?.errorData).toBeInstanceOf(UnexpectedError);
        expect(result.error?.correlationId).toBe(correlationId);
        expect(flowClient.submitSignUpAttributes).not.toHaveBeenCalled();
        expect(flowClient.submitSignInPassword).not.toHaveBeenCalled();
    });

    it("wraps asynchronous sign-up submission failures", async () => {
        flowClient.submitSignUpAttributes.mockRejectedValueOnce(
            new Error("Sign-up password submission failed.")
        );

        const result = await buildState().submitPassword("valid-password");

        expect(result.isFailed()).toBe(true);
        expect(result.scenario).toBe(CustomAuthFlowScenarioV2.SignUp);
        expect(result.error?.correlationId).toBe(correlationId);
        expect(flowClient.submitSignInPassword).not.toHaveBeenCalled();
    });
});

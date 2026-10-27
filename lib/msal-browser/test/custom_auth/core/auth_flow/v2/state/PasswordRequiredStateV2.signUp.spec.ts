/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { CustomAuthFlowScenarioV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthFlowScenarioV2.js";
import { AuthMethodRegistrationRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/AuthMethodRegistrationRequiredStateV2.js";
import { AttributesRequiredStateV2 } from "../../../../../../src/custom_auth/sign_up/auth_flow/v2/state/AttributesRequiredStateV2.js";
import { FlowInteractionClientV2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import {
    FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2,
    FLOW_ATTRIBUTES_REQUIRED_V2,
    FLOW_CODE_REQUIRED_V2,
    FLOW_COMPLETED_V2,
    FLOW_MFA_REQUIRED_V2,
    FLOW_SIGN_UP_PASSWORD_REQUIRED_V2,
    FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2,
} from "../../../../../../src/custom_auth/core/interaction_client/v2/result/FlowActionResultV2.js";
import { CustomAuthSilentCacheClient } from "../../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { PasswordRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/PasswordRequiredStateV2.js";
import type { PasswordRequiredStateParametersV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/CustomAuthStateParametersV2.js";
import { SignUpStateTransitionHandlerV2 } from "../../../../../../src/custom_auth/sign_up/auth_flow/v2/state/SignUpStateTransitionHandlerV2.js";
import { SignInContinuationStateV2 } from "../../../../../../src/custom_auth/sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";
import { getDefaultLogger } from "../../../../test_resources/TestModules.js";
import { CustomAuthError } from "../../../../../../src/custom_auth/core/error/CustomAuthError.js";
import { UnexpectedError } from "../../../../../../src/custom_auth/core/error/UnexpectedError.js";

describe("PasswordRequiredStateV2 sign-up", () => {
    const correlationId = "test-correlation-id";
    const scopes = ["openid", "profile", "offline_access"];
    const submitSignUpAttributes = jest.fn();
    const flowClient = {
        submitSignUpAttributes,
        submitSignInPassword: jest.fn(),
    } as unknown as jest.Mocked<FlowInteractionClientV2>;
    const continuationState = {
        continuationToken: "ct-password",
        scenario: CustomAuthFlowScenarioV2.SignUp,
        scopes,
        links: {
            submitAttributes: "/signup/submitattributes",
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

        const state = buildState();
        const attributes = {
            givenName: "Test",
            username: "test-user",
            password: "wrong-password",
        };
        const result = await state.submitPassword("valid-password", attributes);

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
        expect(flowClient.submitSignInPassword).not.toHaveBeenCalled();
        expect(attributes.password).toBe("wrong-password");
        expect(state["stateParameters"]).not.toHaveProperty("password");
        expect(state.attributes).toEqual([
            { attributeId: "givenName", inputType: "text", required: true },
        ]);
        expect(state.requiredPasswordAttribute).toEqual({
            attributeId: "password",
            inputType: "password",
            required: true,
        });
    });

    it("rejects an empty password before submitting attributes", async () => {
        const result = await buildState().submitPassword("");

        expect(result.isFailed()).toBe(true);
        expect(result.error?.isInvalidInput()).toBe(true);
        expect(flowClient.submitSignUpAttributes).not.toHaveBeenCalled();
    });

    it.each(["attributesRequired", "passwordRequired"] as const)(
        "returns fresh %s metadata after password submission",
        async (type) => {
            const attributes = [
                { attributeId: "surname", inputType: "text", required: true },
            ];
            const requiredPasswordAttribute = {
                attributeId: "password",
                inputType: "password",
                required: true,
            };
            const nextContinuationState = {
                ...continuationState,
                continuationToken: "ct-next",
                links: { submitAttributes: "/signup/next" },
            };
            flowClient.submitSignUpAttributes.mockResolvedValue({
                correlationId,
                continuationState: nextContinuationState,
                attributes,
                ...(type === "attributesRequired"
                    ? { type: FLOW_ATTRIBUTES_REQUIRED_V2 }
                    : {
                          type: FLOW_SIGN_UP_PASSWORD_REQUIRED_V2,
                          requiredPasswordAttribute,
                      }),
            });

            const result = await buildState().submitPassword("valid-password");

            if (!result.isState(type)) {
                throw new Error(`Expected ${type}.`);
            }
            expect(result.state).toBeInstanceOf(
                type === "attributesRequired"
                    ? AttributesRequiredStateV2
                    : PasswordRequiredStateV2
            );
            expect(result.state.attributes).toEqual(attributes);
            expect(result.state["stateParameters"].continuationState).toEqual(
                nextContinuationState
            );
            expect(
                result.state["stateParameters"].signUpStateTransitionHandler
            ).toBeInstanceOf(SignUpStateTransitionHandlerV2);
            if (result.isPasswordRequired()) {
                expect(result.state.requiredPasswordAttribute).toEqual(
                    requiredPasswordAttribute
                );
            }
            expect(result.error).toBeUndefined();
            expect(result.data).toBeUndefined();
            expect(result.scenario).toBe(CustomAuthFlowScenarioV2.SignUp);
        }
    );

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
        expect(flowClient.submitSignUpAttributes).toHaveBeenCalledWith({
            correlationId,
            continuationState,
            attributes: { password: "valid-password" },
        });
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

    it.each([
        FLOW_CODE_REQUIRED_V2,
        FLOW_MFA_REQUIRED_V2,
        FLOW_COMPLETED_V2,
        "unsupported",
    ])(
        "rejects a result outside the sign-up submission contract: %s",
        async (type) => {
            submitSignUpAttributes.mockResolvedValueOnce({
                type,
                correlationId,
                continuationState,
                methods: [],
            });

            const result = await buildState().submitPassword("valid-password");

            expect(result.isFailed()).toBe(true);
            expect(result.scenario).toBe(CustomAuthFlowScenarioV2.SignUp);
            expect(result.data).toBeUndefined();
            expect(result.error?.errorData.error).toBe(
                "unsupported_flow_transition"
            );
            expect(result.error?.correlationId).toBe(correlationId);
            expect(flowClient.submitSignInPassword).not.toHaveBeenCalled();
        }
    );

    it("wraps asynchronous sign-up submission failures in the public result", async () => {
        const error = new CustomAuthError(
            "submission_failed",
            "Sign-up password submission failed.",
            correlationId
        );
        flowClient.submitSignUpAttributes.mockRejectedValueOnce(error);

        const result = await buildState().submitPassword("valid-password");

        expect(result.isFailed()).toBe(true);
        expect(result.scenario).toBe(CustomAuthFlowScenarioV2.SignUp);
        expect(result.error?.errorData).toBe(error);
        expect(result.error?.correlationId).toBe(correlationId);
    });

    it("fails without a sign-up transition handler before making a request", async () => {
        const result = await buildState({
            signUpStateTransitionHandler: undefined,
        }).submitPassword("valid-password");

        expect(result.isFailed()).toBe(true);
        expect(result.scenario).toBe(CustomAuthFlowScenarioV2.SignUp);
        expect(result.error?.errorData).toBeInstanceOf(UnexpectedError);
        expect(result.error?.errorData).toMatchObject({
            error: "unexpected_error",
            errorDescription: "Sign-up state transition handler is missing.",
            correlationId,
        });
        expect(flowClient.submitSignUpAttributes).not.toHaveBeenCalled();
        expect(flowClient.submitSignInPassword).not.toHaveBeenCalled();
    });
});

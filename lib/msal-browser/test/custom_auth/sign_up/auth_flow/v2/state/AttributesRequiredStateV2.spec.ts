/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { CustomAuthFlowScenarioV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthFlowScenarioV2.js";
import { CustomAuthApiError } from "../../../../../../src/custom_auth/core/error/CustomAuthApiError.js";
import { AuthMethodRegistrationRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/AuthMethodRegistrationRequiredStateV2.js";
import { PasswordRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/PasswordRequiredStateV2.js";
import { FlowInteractionClientV2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import {
    FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2,
    FLOW_ATTRIBUTES_REQUIRED_V2,
    FLOW_CODE_REQUIRED_V2,
    FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2,
    FLOW_SIGN_UP_PASSWORD_REQUIRED_V2,
} from "../../../../../../src/custom_auth/core/interaction_client/v2/result/FlowActionResultV2.js";
import { CustomAuthSilentCacheClient } from "../../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { AttributesRequiredStateV2 } from "../../../../../../src/custom_auth/sign_up/auth_flow/v2/state/AttributesRequiredStateV2.js";
import { SignUpStateTransitionHandlerV2 } from "../../../../../../src/custom_auth/sign_up/auth_flow/v2/state/SignUpStateTransitionHandlerV2.js";
import { SignInContinuationStateV2 } from "../../../../../../src/custom_auth/sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";
import { getDefaultLogger } from "../../../../test_resources/TestModules.js";

describe("AttributesRequiredStateV2", () => {
    const correlationId = "test-correlation-id";
    const scopes = ["openid", "profile", "offline_access"];
    const submitSignUpAttributes = jest.fn();
    const flowClient = {
        submitSignUpAttributes,
    } as unknown as jest.Mocked<FlowInteractionClientV2>;
    const continuationState = {
        continuationToken: "ct-attributes",
        scenario: CustomAuthFlowScenarioV2.SignUp,
        scopes,
        links: {
            submitAttributes: "/signup/submitattributes",
        },
    };

    const buildState = (): AttributesRequiredStateV2 =>
        new AttributesRequiredStateV2({
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
        });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("submits the requested attributes and returns sign-in continuation", async () => {
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

        const result = await buildState().submitAttributes({
            givenName: "Test",
            username: "test-user",
        });

        expect(flowClient.submitSignUpAttributes).toHaveBeenCalledWith({
            correlationId,
            continuationState,
            attributes: {
                givenName: "Test",
                username: "test-user",
            },
        });
        expect(result.isState("signInContinuation")).toBe(true);
        expect(result.state).toBeInstanceOf(SignInContinuationStateV2);
    });

    it.each(["attributesRequired", "passwordRequired"] as const)(
        "returns fresh %s metadata and preserves the handler after attribute submission",
        async (type) => {
            const attributes = [{ attributeId: "surname", required: true }];
            const requiredPasswordAttribute = {
                attributeId: "password",
                required: true,
            };
            const nextContinuationState = {
                ...continuationState,
                continuationToken: "ct-next",
                links: { submitAttributes: "/signup/next" },
            };
            flowClient.submitSignUpAttributes.mockResolvedValue({
                ...(type === "attributesRequired"
                    ? { type: FLOW_ATTRIBUTES_REQUIRED_V2 }
                    : {
                          type: FLOW_SIGN_UP_PASSWORD_REQUIRED_V2,
                          requiredPasswordAttribute,
                      }),
                correlationId,
                continuationState: nextContinuationState,
                attributes,
            });

            const state = buildState();
            const result = await state.submitAttributes({ givenName: "Test" });

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
            ).toBe(state["stateParameters"].signUpStateTransitionHandler);
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

    it("returns registration when later attribute submission requires enrollment", async () => {
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

        const result = await buildState().submitAttributes({
            givenName: "Test",
        });

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

    it("identifies an existing account from an attribute-submission error", async () => {
        flowClient.submitSignUpAttributes.mockRejectedValue(
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

        const result = await buildState().submitAttributes({
            givenName: "Test",
        });

        expect(result.isFailed()).toBe(true);
        expect(result.error?.isUserAlreadyExists()).toBe(true);
    });

    it.each([FLOW_CODE_REQUIRED_V2, "unsupported"])(
        "returns a failed result for unsupported transition %s",
        async (type) => {
            submitSignUpAttributes.mockResolvedValueOnce({
                type,
                correlationId,
                continuationState,
            });

            const result = await buildState().submitAttributes({
                givenName: "Test",
            });

            expect(result.isFailed()).toBe(true);
        }
    );
});

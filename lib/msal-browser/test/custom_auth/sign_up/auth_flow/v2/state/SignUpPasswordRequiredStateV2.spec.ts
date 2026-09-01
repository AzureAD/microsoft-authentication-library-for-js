/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { CustomAuthFlowScenarioV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthFlowScenarioV2.js";
import { ChallengeVerificationRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/ChallengeVerificationRequiredStateV2.js";
import { FlowInteractionClientV2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import {
    FLOW_CODE_REQUIRED_V2,
    FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2,
} from "../../../../../../src/custom_auth/core/interaction_client/v2/result/FlowActionResultV2.js";
import { CustomAuthSilentCacheClient } from "../../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { SignUpPasswordRequiredStateV2 } from "../../../../../../src/custom_auth/sign_up/auth_flow/v2/state/SignUpPasswordRequiredStateV2.js";
import { SignInContinuationStateV2 } from "../../../../../../src/custom_auth/sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";
import { getDefaultLogger } from "../../../../test_resources/TestModules.js";

describe("SignUpPasswordRequiredStateV2", () => {
    const correlationId = "test-correlation-id";
    const flowClient = {
        submitSignUpAttributes: jest.fn(),
    } as unknown as jest.Mocked<FlowInteractionClientV2>;
    const continuationState = {
        continuationToken: "ct-password",
        scenario: CustomAuthFlowScenarioV2.SignUp,
        links: {
            submitAttributes: "/signup/submitattributes",
        },
        signUp: {
            passwordWasSupplied: false,
        },
    };

    const buildState = (): SignUpPasswordRequiredStateV2 =>
        new SignUpPasswordRequiredStateV2({
            correlationId,
            logger: getDefaultLogger(),
            config: {
                auth: { clientId: "test-client-id" },
                customAuth: { challengeTypes: ["oob"] },
            } as unknown as CustomAuthBrowserConfiguration,
            flowClient,
            cacheClient: {} as CustomAuthSilentCacheClient,
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
                links: {},
            },
        });

        const result = await buildState().submitPassword("P@ssword1!", {
            givenName: "Test",
            username: "test-user",
            password: "wrong-password",
        });

        expect(flowClient.submitSignUpAttributes).toHaveBeenCalledWith({
            correlationId,
            continuationState,
            attributes: {
                givenName: "Test",
                username: "test-user",
                password: "P@ssword1!",
            },
        });
        expect(result.isState("signInContinuation")).toBe(true);
        expect(result.state).toBeInstanceOf(SignInContinuationStateV2);
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
                links: {
                    verify: "/signup/verify",
                    resend: "/signup/resend",
                },
            },
            sentTo: "u***@contoso.com",
            channel: "email",
            codeLength: 8,
        });

        const result = await buildState().submitPassword("P@ssword1!");

        expect(result.isState("challengeVerificationRequired")).toBe(true);
        expect(result.state).toBeInstanceOf(
            ChallengeVerificationRequiredStateV2
        );
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

        const result = await buildState().submitPassword("P@ssword1!");

        expect(result.isFailed()).toBe(true);
    });
});

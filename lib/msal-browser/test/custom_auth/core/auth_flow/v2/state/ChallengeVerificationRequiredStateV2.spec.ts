/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { CustomAuthFlowScenarioV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthFlowScenarioV2.js";
import { ChallengeVerificationRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/ChallengeVerificationRequiredStateV2.js";
import { CompletedStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/CompletedStateV2.js";
import { AttributesRequiredStateV2 } from "../../../../../../src/custom_auth/sign_up/auth_flow/v2/state/AttributesRequiredStateV2.js";
import { SignUpPasswordRequiredStateV2 } from "../../../../../../src/custom_auth/sign_up/auth_flow/v2/state/SignUpPasswordRequiredStateV2.js";
import { SignInContinuationStateV2 } from "../../../../../../src/custom_auth/sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";
import { FlowInteractionClientV2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import {
    FLOW_ATTRIBUTES_REQUIRED_V2,
    FLOW_COMPLETED_V2,
    FLOW_SIGN_UP_PASSWORD_REQUIRED_V2,
    FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2,
} from "../../../../../../src/custom_auth/core/interaction_client/v2/result/FlowActionResultV2.js";
import { CustomAuthAccountData } from "../../../../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { CustomAuthSilentCacheClient } from "../../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import type { AuthenticationResult } from "../../../../../../src/response/AuthenticationResult.js";
import { getDefaultLogger } from "../../../../test_resources/TestModules.js";

describe("ChallengeVerificationRequiredStateV2", () => {
    const correlationId = "test-correlation-id";
    const flowClient = {
        submitCode: jest.fn(),
    } as unknown as jest.Mocked<FlowInteractionClientV2>;

    const buildState = (): ChallengeVerificationRequiredStateV2 =>
        new ChallengeVerificationRequiredStateV2({
            correlationId,
            logger: getDefaultLogger(),
            config: {
                auth: { clientId: "test-client-id" },
                customAuth: { challengeTypes: ["oob"] },
            } as unknown as CustomAuthBrowserConfiguration,
            flowClient,
            cacheClient: {} as CustomAuthSilentCacheClient,
            continuationState: {
                continuationToken: "ct-mfa-challenge",
                scenario: CustomAuthFlowScenarioV2.SignIn,
                links: {
                    verify: "/mfa/verify",
                },
                tokenRequest: {
                    scopes: ["User.Read"],
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

    const buildSignUpState = (): ChallengeVerificationRequiredStateV2 =>
        new ChallengeVerificationRequiredStateV2({
            correlationId,
            logger: getDefaultLogger(),
            config: {
                auth: { clientId: "test-client-id" },
                customAuth: { challengeTypes: ["oob"] },
            } as unknown as CustomAuthBrowserConfiguration,
            flowClient,
            cacheClient: {} as CustomAuthSilentCacheClient,
            continuationState: {
                continuationToken: "ct-sign-up-challenge",
                scenario: CustomAuthFlowScenarioV2.SignUp,
                links: {
                    verify: "/signup/verify",
                },
                tokenRequest: {
                    scopes: ["User.Read"],
                },
            },
            sentTo: "user@contoso.com",
            channel: "email",
            codeLength: 8,
        });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns completed sign-in after verifying an MFA code", async () => {
        flowClient.submitCode.mockResolvedValue({
            type: FLOW_COMPLETED_V2,
            correlationId,
            authenticationResult: {
                account: {
                    homeAccountId: "uid.utid",
                },
            } as unknown as AuthenticationResult,
        });

        const result = await buildState().verifyChallenge("123456");

        expect(flowClient.submitCode).toHaveBeenCalledWith({
            correlationId,
            continuationState: {
                continuationToken: "ct-mfa-challenge",
                scenario: CustomAuthFlowScenarioV2.SignIn,
                links: {
                    verify: "/mfa/verify",
                },
                tokenRequest: {
                    scopes: ["User.Read"],
                },
            },
            code: "123456",
        });
        expect(result.isState("completed")).toBe(true);
        expect(result.state).toBeInstanceOf(CompletedStateV2);
        expect(result.data).toBeInstanceOf(CustomAuthAccountData);
    });

    it("returns attributes required after verifying a sign-up code", async () => {
        flowClient.submitCode.mockResolvedValue({
            type: FLOW_ATTRIBUTES_REQUIRED_V2,
            correlationId,
            continuationState: {
                continuationToken: "ct-sign-up-verify",
                scenario: CustomAuthFlowScenarioV2.SignUp,
                links: {
                    submitAttributes: "/signup/submitattributes",
                },
                tokenRequest: {
                    scopes: ["User.Read"],
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

        const result = await buildSignUpState().verifyChallenge("12345678");

        expect(result.isState("attributesRequired")).toBe(true);
        expect(result.state).toBeInstanceOf(AttributesRequiredStateV2);
        if (result.isState("attributesRequired")) {
            expect(result.state.attributes).toEqual([
                {
                    attributeId: "password",
                    inputType: "password",
                    required: true,
                    confirmationInput: "retype",
                },
            ]);
        }
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

        const result = await buildSignUpState().verifyChallenge("12345678");

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
                links: {},
                tokenRequest: {
                    scopes: ["User.Read"],
                },
            },
        });

        const result = await buildSignUpState().verifyChallenge("12345678");

        expect(result.isState("signInContinuation")).toBe(true);
        expect(result.state).toBeInstanceOf(SignInContinuationStateV2);
    });
});

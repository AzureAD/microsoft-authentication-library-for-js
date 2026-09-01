/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { AuthenticationMethodV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/AuthenticationMethodV2.js";
import { CustomAuthFlowScenarioV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthFlowScenarioV2.js";
import { ChallengeVerificationRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/ChallengeVerificationRequiredStateV2.js";
import { MFARequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/MFARequiredStateV2.js";
import { FlowInteractionClientV2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import { FLOW_CODE_REQUIRED_V2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/result/FlowActionResultV2.js";
import { CustomAuthSilentCacheClient } from "../../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { getDefaultLogger } from "../../../../test_resources/TestModules.js";

describe("MFARequiredStateV2", () => {
    const correlationId = "test-correlation-id";
    const methods: readonly AuthenticationMethodV2[] = [
        {
            id: "email-mfa",
            type: "email",
            hint: "u***@contoso.com",
            challengeHref: "/mfa/email/challenge",
        },
    ];
    const flowClient = {
        requestChallenge: jest.fn(),
    } as unknown as jest.Mocked<FlowInteractionClientV2>;

    const buildState = (): MFARequiredStateV2 =>
        new MFARequiredStateV2({
            correlationId,
            logger: getDefaultLogger(),
            config: {
                auth: { clientId: "test-client-id" },
                customAuth: { challengeTypes: ["oob"] },
            } as unknown as CustomAuthBrowserConfiguration,
            flowClient,
            cacheClient: {} as CustomAuthSilentCacheClient,
            continuationState: {
                continuationToken: "ct-mfa",
                scenario: CustomAuthFlowScenarioV2.SignIn,
                links: {},
                tokenRequest: {
                    scopes: ["User.Read"],
                },
            },
            methods,
        });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("exposes the registered methods", () => {
        const state = buildState();

        expect(state.stateType).toBe("mfaRequired");
        expect(state.methods).toBe(methods);
    });

    it("requests a code challenge using the server-provided method", async () => {
        flowClient.requestChallenge.mockResolvedValue({
            type: FLOW_CODE_REQUIRED_V2,
            correlationId,
            continuationState: {
                continuationToken: "ct-challenge",
                scenario: CustomAuthFlowScenarioV2.SignIn,
                links: {
                    challenge: "/mfa/email/challenge",
                    verify: "/mfa/email/verify",
                },
                tokenRequest: {
                    scopes: ["User.Read"],
                },
            },
            channel: "email",
            sentTo: "u***@contoso.com",
            codeLength: 6,
        });

        const result = await buildState().requestChallenge({
            ...methods[0],
            challengeHref: "https://attacker.example/challenge",
        });

        expect(flowClient.requestChallenge).toHaveBeenCalledWith({
            correlationId,
            continuationState: {
                continuationToken: "ct-mfa",
                scenario: CustomAuthFlowScenarioV2.SignIn,
                links: { challenge: "/mfa/email/challenge" },
                tokenRequest: {
                    scopes: ["User.Read"],
                },
            },
        });
        expect(result.isState("challengeVerificationRequired")).toBe(true);
        expect(result.state).toBeInstanceOf(
            ChallengeVerificationRequiredStateV2
        );
    });

    it("rejects a method not returned by the server", async () => {
        const result = await buildState().requestChallenge({
            id: "unknown",
            type: "email",
            challengeHref: "/unknown",
        });

        expect(result.isFailed()).toBe(true);
        expect(result.error?.isInvalidInput()).toBe(true);
        expect(flowClient.requestChallenge).not.toHaveBeenCalled();
    });
});

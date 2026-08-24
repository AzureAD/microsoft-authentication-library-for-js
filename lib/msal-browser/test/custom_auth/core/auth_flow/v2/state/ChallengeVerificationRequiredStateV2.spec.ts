/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { CustomAuthFlowScenarioV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthFlowScenarioV2.js";
import { ChallengeVerificationRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/ChallengeVerificationRequiredStateV2.js";
import { CompletedStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/CompletedStateV2.js";
import { FlowInteractionClientV2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import { FLOW_COMPLETED_V2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/result/FlowActionResultV2.js";
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
                    claims: '{"access_token":{}}',
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
                    claims: '{"access_token":{}}',
                },
            },
            code: "123456",
        });
        expect(result.isState("completed")).toBe(true);
        expect(result.state).toBeInstanceOf(CompletedStateV2);
        expect(result.data).toBeInstanceOf(CustomAuthAccountData);
    });
});

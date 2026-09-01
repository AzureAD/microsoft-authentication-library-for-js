/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { CustomAuthFlowScenarioV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthFlowScenarioV2.js";
import { FlowInteractionClientV2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import { CustomAuthSilentCacheClient } from "../../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { SignInContinuationStateV2 } from "../../../../../../src/custom_auth/sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";
import { getDefaultLogger } from "../../../../test_resources/TestModules.js";

describe("SignInContinuationStateV2", () => {
    const correlationId = "test-correlation-id";
    const flowClient = {
        signInWithContinuation: jest.fn(),
    } as unknown as jest.Mocked<FlowInteractionClientV2>;

    const buildState = (): SignInContinuationStateV2 =>
        new SignInContinuationStateV2({
            correlationId,
            logger: getDefaultLogger(),
            config: {
                auth: { clientId: "test-client-id" },
                customAuth: { challengeTypes: ["oob"] },
            } as unknown as CustomAuthBrowserConfiguration,
            flowClient,
            cacheClient: {} as CustomAuthSilentCacheClient,
            continuationState: {
                continuationToken: "ct-complete",
                scenario: CustomAuthFlowScenarioV2.PasswordReset,
                links: {},
            },
        });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("rejects malformed claims before token completion", async () => {
        const result = await buildState().signIn({
            claims: "not-json",
        });

        expect(result.isFailed()).toBe(true);
        expect(result.error?.isInvalidInput()).toBe(true);
        expect(flowClient.signInWithContinuation).not.toHaveBeenCalled();
    });
});

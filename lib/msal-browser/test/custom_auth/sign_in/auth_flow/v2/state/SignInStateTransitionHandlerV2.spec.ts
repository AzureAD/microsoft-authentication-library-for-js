/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { CustomAuthFlowScenarioV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthFlowScenarioV2.js";
import { AuthMethodSelectionRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/AuthMethodSelectionRequiredStateV2.js";
import { SignInStateTransitionHandlerV2 } from "../../../../../../src/custom_auth/sign_in/auth_flow/v2/state/SignInStateTransitionHandlerV2.js";
import { FlowInteractionClientV2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import { FLOW_MFA_REQUIRED_V2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/result/FlowActionResultV2.js";
import { CustomAuthSilentCacheClient } from "../../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { getDefaultLogger } from "../../../../test_resources/TestModules.js";

describe("SignInStateTransitionHandlerV2", () => {
    it("creates the unified selection state for an MFA transition", () => {
        const handler = new SignInStateTransitionHandlerV2();
        const method = {
            id: "sms-mfa",
            type: "sms",
            challengeHref: "/mfa/sms/challenge",
        };
        const continuationState = {
            continuationToken: "ct-mfa",
            scenario: CustomAuthFlowScenarioV2.SignIn,
            links: {},
        };

        const result = handler.handleMfaRequired(
            {
                type: FLOW_MFA_REQUIRED_V2,
                correlationId: "test-correlation-id",
                continuationState,
                methods: [method],
            },
            {
                correlationId: "test-correlation-id",
                logger: getDefaultLogger(),
                config: {
                    auth: { clientId: "test-client-id" },
                    customAuth: { challengeTypes: ["oob"] },
                } as unknown as CustomAuthBrowserConfiguration,
                flowClient: {} as FlowInteractionClientV2,
                cacheClient: {} as CustomAuthSilentCacheClient,
                continuationState,
            }
        );

        expect(result.state).toBeInstanceOf(AuthMethodSelectionRequiredStateV2);
        expect(result.isState("authMethodSelectionRequired")).toBe(true);
        if (result.isState("authMethodSelectionRequired")) {
            expect(result.state.methods).toEqual([method]);
        }
    });
});

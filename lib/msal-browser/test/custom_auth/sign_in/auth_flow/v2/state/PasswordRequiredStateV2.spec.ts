/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { CustomAuthFlowScenarioV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthFlowScenarioV2.js";
import { MFARequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/MFARequiredStateV2.js";
import { FlowInteractionClientV2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import { FLOW_MFA_REQUIRED_V2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/result/FlowActionResultV2.js";
import { CustomAuthSilentCacheClient } from "../../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { PasswordRequiredStateV2 } from "../../../../../../src/custom_auth/sign_in/auth_flow/v2/state/PasswordRequiredStateV2.js";
import { getDefaultLogger } from "../../../../test_resources/TestModules.js";

describe("PasswordRequiredStateV2", () => {
    const correlationId = "test-correlation-id";
    const flowClient = {
        submitSignInPassword: jest.fn(),
    } as unknown as jest.Mocked<FlowInteractionClientV2>;

    const buildState = (): PasswordRequiredStateV2 =>
        new PasswordRequiredStateV2({
            correlationId,
            logger: getDefaultLogger(),
            config: {
                auth: { clientId: "test-client-id" },
                customAuth: { challengeTypes: ["oob"] },
            } as unknown as CustomAuthBrowserConfiguration,
            flowClient,
            cacheClient: {} as CustomAuthSilentCacheClient,
            continuationState: {
                continuationToken: "ct-password",
                scenario: CustomAuthFlowScenarioV2.SignIn,
                links: {
                    verify: "/password/verify",
                },
                tokenRequest: {
                    scopes: ["User.Read"],
                },
            },
        });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns MFA-required when password verification requires a second factor", async () => {
        flowClient.submitSignInPassword.mockResolvedValue({
            type: FLOW_MFA_REQUIRED_V2,
            correlationId,
            continuationState: {
                continuationToken: "ct-mfa",
                scenario: CustomAuthFlowScenarioV2.SignIn,
                links: {},
                tokenRequest: {
                    scopes: ["User.Read"],
                },
            },
            methods: [
                {
                    id: "email-mfa",
                    type: "email",
                    hint: "u***@contoso.com",
                    challengeHref: "/mfa/email/challenge",
                },
            ],
        });

        const result = await buildState().submitPassword("P@ssword1!");

        expect(flowClient.submitSignInPassword).toHaveBeenCalledWith({
            correlationId,
            continuationState: {
                continuationToken: "ct-password",
                scenario: CustomAuthFlowScenarioV2.SignIn,
                links: {
                    verify: "/password/verify",
                },
                tokenRequest: {
                    scopes: ["User.Read"],
                },
            },
            password: "P@ssword1!",
        });
        expect(result.isState("mfaRequired")).toBe(true);
        expect(result.state).toBeInstanceOf(MFARequiredStateV2);

        if (result.isState("mfaRequired")) {
            expect(result.state.methods).toEqual([
                {
                    id: "email-mfa",
                    type: "email",
                    hint: "u***@contoso.com",
                    challengeHref: "/mfa/email/challenge",
                },
            ]);
        }
    });
});

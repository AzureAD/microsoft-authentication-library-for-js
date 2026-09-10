/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { CustomAuthFlowScenarioV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthFlowScenarioV2.js";
import { CompletedStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/CompletedStateV2.js";
import { MFAVerificationRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/MFAVerificationRequiredStateV2.js";
import { FlowInteractionClientV2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import {
    FLOW_CODE_REQUIRED_V2,
    FLOW_COMPLETED_V2,
} from "../../../../../../src/custom_auth/core/interaction_client/v2/result/FlowActionResultV2.js";
import { CustomAuthAccountData } from "../../../../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { CustomAuthSilentCacheClient } from "../../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import type { AuthenticationResult } from "../../../../../../src/response/AuthenticationResult.js";
import { getDefaultLogger } from "../../../../test_resources/TestModules.js";

describe("MFAVerificationRequiredStateV2", () => {
    const correlationId = "test-correlation-id";
    const flowClient = {
        submitCode: jest.fn(),
        resendCode: jest.fn(),
    } as unknown as jest.Mocked<FlowInteractionClientV2>;

    const buildState = (): MFAVerificationRequiredStateV2 =>
        new MFAVerificationRequiredStateV2({
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
                    resend: "/mfa/resend",
                },
                tokenRequest: {
                    scopes: ["User.Read"],
                },
            },
            method: {
                id: "sms-mfa",
                type: "sms",
                hint: "+1******1234",
                challengeHref: "/mfa/challenge",
            },
            sentTo: "+1******1234",
            channel: "sms",
            codeLength: 6,
        });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("submits an MFA challenge and completes sign-in", async () => {
        flowClient.submitCode.mockResolvedValue({
            type: FLOW_COMPLETED_V2,
            correlationId,
            authenticationResult: {
                account: {
                    homeAccountId: "uid.utid",
                },
            } as unknown as AuthenticationResult,
        });

        const result = await buildState().submitChallenge("123456");

        expect(flowClient.submitCode).toHaveBeenCalledWith({
            correlationId,
            continuationState: {
                continuationToken: "ct-mfa-challenge",
                scenario: CustomAuthFlowScenarioV2.SignIn,
                links: {
                    verify: "/mfa/verify",
                    resend: "/mfa/resend",
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

    it("resends an MFA challenge and remains in MFA verification", async () => {
        flowClient.resendCode.mockResolvedValue({
            type: FLOW_CODE_REQUIRED_V2,
            correlationId,
            continuationState: {
                continuationToken: "ct-mfa-resend",
                scenario: CustomAuthFlowScenarioV2.SignIn,
                links: {
                    verify: "/mfa/verify",
                    resend: "/mfa/resend",
                },
                tokenRequest: {
                    scopes: ["User.Read"],
                },
            },
            sentTo: "+1******5678",
            channel: "sms",
            codeLength: 6,
        });

        const result = await buildState().resendChallenge();

        expect(result.isState("mfaVerificationRequired")).toBe(true);
        expect(result.state).toBeInstanceOf(
            MFAVerificationRequiredStateV2
        );
        if (result.isState("mfaVerificationRequired")) {
            expect(result.state.method?.type).toBe("sms");
            expect(result.state.sentTo).toBe("+1******5678");
        }
    });
});

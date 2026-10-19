/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { CustomAuthFlowScenarioV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthFlowScenarioV2.js";
import { CustomAuthApiError } from "../../../../../../src/custom_auth/core/error/CustomAuthApiError.js";
import { FlowInteractionClientV2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import { CustomAuthSilentCacheClient } from "../../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { NewPasswordRequiredStateV2 } from "../../../../../../src/custom_auth/reset_password/auth_flow/v2/state/NewPasswordRequiredStateV2.js";
import { getDefaultLogger } from "../../../../test_resources/TestModules.js";

describe("NewPasswordRequiredStateV2", () => {
    const correlationId = "test-correlation-id";
    const flowClient = {
        submitNewPassword: jest.fn(),
    } as unknown as jest.Mocked<FlowInteractionClientV2>;

    const buildState = (): NewPasswordRequiredStateV2 =>
        new NewPasswordRequiredStateV2({
            correlationId,
            logger: getDefaultLogger(),
            config: {
                auth: { clientId: "test-client-id" },
                customAuth: { challengeTypes: ["oob"] },
            } as unknown as CustomAuthBrowserConfiguration,
            flowClient,
            cacheClient: {} as CustomAuthSilentCacheClient,
            continuationState: {
                continuationToken: "ct-verify",
                scenario: CustomAuthFlowScenarioV2.PasswordReset,
                scopes: ["openid", "profile", "offline_access"],
                links: {
                    update: "/password-reset/update",
                },
            },
        });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("surfaces an invalid-password response while awaiting a valid password", async () => {
        flowClient.submitNewPassword.mockRejectedValue(
            new CustomAuthApiError(
                "invalidRequest",
                "AADSTS120002: New password doesn't meet complexity requirements.",
                correlationId,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                "passwordTooWeak"
            )
        );

        const result = await buildState().submitNewPassword("weak");

        expect(flowClient.submitNewPassword).toHaveBeenCalledWith({
            correlationId,
            continuationState: {
                continuationToken: "ct-verify",
                scenario: CustomAuthFlowScenarioV2.PasswordReset,
                scopes: ["openid", "profile", "offline_access"],
                links: {
                    update: "/password-reset/update",
                },
            },
            newPassword: "weak",
        });
        expect(result.isFailed()).toBe(true);
        expect(result.error?.isInvalidPassword()).toBe(true);
    });
});

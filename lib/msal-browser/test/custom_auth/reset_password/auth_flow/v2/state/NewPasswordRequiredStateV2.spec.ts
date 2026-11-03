/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { CustomAuthFlowScenarioV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthFlowScenarioV2.js";
import { CustomAuthApiError } from "../../../../../../src/custom_auth/core/error/CustomAuthApiError.js";
import { FlowInteractionClientV2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import { AuthMethodRegistrationRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/AuthMethodRegistrationRequiredStateV2.js";
import {
    FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2,
    FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2,
} from "../../../../../../src/custom_auth/core/interaction_client/v2/result/FlowActionResultV2.js";
import { UNSUPPORTED_FLOW_TRANSITION } from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/ErrorCodesV2.js";
import { SignInContinuationStateV2 } from "../../../../../../src/custom_auth/sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";
import { CustomAuthSilentCacheClient } from "../../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { NewPasswordRequiredStateV2 } from "../../../../../../src/custom_auth/reset_password/auth_flow/v2/state/NewPasswordRequiredStateV2.js";
import { getDefaultLogger } from "../../../../test_resources/TestModules.js";

describe("NewPasswordRequiredStateV2", () => {
    const correlationId = "test-correlation-id";
    const submitNewPasswordMock = jest.fn();
    const flowClient = {
        submitNewPassword: submitNewPasswordMock,
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

    it("exposes registration when the password update requires enrollment", async () => {
        flowClient.submitNewPassword.mockResolvedValue({
            type: FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2,
            correlationId,
            methods: [{ type: "email", enrollHref: "/enroll/email" }],
            continuationState: {
                continuationToken: "ct-enroll",
                scenario: CustomAuthFlowScenarioV2.PasswordReset,
                scopes: ["openid"],
                links: {},
            },
        });

        const result = await buildState().submitNewPassword("new-password");

        expect(result.isState("authMethodRegistrationRequired")).toBe(true);
        expect(result.state).toBeInstanceOf(
            AuthMethodRegistrationRequiredStateV2
        );
        if (result.isState("authMethodRegistrationRequired")) {
            expect(result.state.methods).toEqual([
                { type: "email", enrollHref: "/enroll/email" },
            ]);
        }
        expect(result.scenario).toBe(CustomAuthFlowScenarioV2.PasswordReset);
    });

    it("returns sign-in continuation for a supported password submission result", async () => {
        flowClient.submitNewPassword.mockResolvedValue({
            type: FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2,
            correlationId,
            continuationState: {
                continuationToken: "ct-complete",
                scenario: CustomAuthFlowScenarioV2.PasswordReset,
                scopes: ["openid"],
                links: {},
            },
        });

        const result = await buildState().submitNewPassword("new-password");

        expect(result.isFailed()).toBe(false);
        expect(result.state).toBeInstanceOf(SignInContinuationStateV2);
        expect(result.scenario).toBe(CustomAuthFlowScenarioV2.PasswordReset);
    });

    it.each(["UnexpectedFlowResultV2", "FlowCompletedResultV2"])(
        "rejects unsupported password submission result %s instead of returning sign-in continuation",
        async (type) => {
            submitNewPasswordMock.mockResolvedValue({
                type,
                correlationId,
                continuationState: {
                    continuationToken: "ct-unexpected",
                    scenario: CustomAuthFlowScenarioV2.PasswordReset,
                    scopes: ["openid"],
                    links: {},
                },
            });

            const result = await buildState().submitNewPassword("new-password");

            expect(result.isFailed()).toBe(true);
            expect(result.isState("failed")).toBe(true);
            expect(result.error?.errorData).toMatchObject({
                error: UNSUPPORTED_FLOW_TRANSITION,
            });
            expect(result.error?.errorDescription).toBe(
                `Password submission result type '${type}' is not supported.`
            );
            expect(result.error?.correlationId).toBe(correlationId);
            expect(result.scenario).toBe(
                CustomAuthFlowScenarioV2.PasswordReset
            );
        }
    );

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

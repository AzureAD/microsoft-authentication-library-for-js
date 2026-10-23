/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { AuthenticationMethodRegistrationV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/AuthenticationMethodRegistrationV2.js";
import { CustomAuthFlowScenarioV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthFlowScenarioV2.js";
import { CompletedStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/CompletedStateV2.js";
import { AuthMethodVerificationRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/AuthMethodVerificationRequiredStateV2.js";
import { FlowInteractionClientV2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import {
    FLOW_AUTH_METHOD_VERIFICATION_REQUIRED_V2,
    FLOW_COMPLETED_V2,
} from "../../../../../../src/custom_auth/core/interaction_client/v2/result/FlowActionResultV2.js";
import { CustomAuthAccountData } from "../../../../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { CustomAuthSilentCacheClient } from "../../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import type { AuthenticationResult } from "../../../../../../src/response/AuthenticationResult.js";
import { getDefaultLogger } from "../../../../test_resources/TestModules.js";

describe("AuthMethodVerificationRequiredStateV2", () => {
    const correlationId = "test-correlation-id";
    const method: AuthenticationMethodRegistrationV2 = {
        type: "email",
        enrollHref: "/enroll/email",
    };
    const flowClient = {
        verifyAuthMethodRegistration: jest.fn(),
        resendAuthMethodRegistrationChallenge: jest.fn(),
    } as unknown as jest.Mocked<FlowInteractionClientV2>;
    const continuationState = {
        continuationToken: "ct-activate",
        scenario: CustomAuthFlowScenarioV2.SignIn,
        scopes: ["openid", "profile", "offline_access"],
        links: {
            activate: "/activate/email",
            resend: "/resend/email",
        },
    };

    const buildState = () =>
        new AuthMethodVerificationRequiredStateV2({
            correlationId,
            logger: getDefaultLogger(),
            config: {
                auth: { clientId: "test-client-id" },
                customAuth: { challengeTypes: ["oob"] },
            } as unknown as CustomAuthBrowserConfiguration,
            flowClient,
            cacheClient: {} as CustomAuthSilentCacheClient,
            continuationState,
            method,
            sentTo: "u***@contoso.com",
            codeLength: 6,
        });

    beforeEach(() => {
        jest.clearAllMocks();
        flowClient.verifyAuthMethodRegistration.mockResolvedValue({
            type: FLOW_COMPLETED_V2,
            correlationId,
            authenticationResult: {
                account: {
                    homeAccountId: "uid.utid",
                },
            } as unknown as AuthenticationResult,
        });
        flowClient.resendAuthMethodRegistrationChallenge.mockResolvedValue({
            type: FLOW_AUTH_METHOD_VERIFICATION_REQUIRED_V2,
            correlationId,
            continuationState: {
                ...continuationState,
                continuationToken: "ct-resend",
            },
            sentTo: "u***@contoso.com",
            codeLength: 8,
        });
    });

    it("submits the activation challenge and completes sign-in", async () => {
        const result = await buildState().submitChallenge("123456");

        expect(flowClient.verifyAuthMethodRegistration).toHaveBeenCalledWith({
            correlationId,
            continuationState,
            code: "123456",
        });
        expect(result.isState("completed")).toBe(true);
        expect(result.state).toBeInstanceOf(CompletedStateV2);
        expect(result.data).toBeInstanceOf(CustomAuthAccountData);
    });

    it("rejects a null activation challenge", async () => {
        const result = await buildState().submitChallenge(
            null as unknown as string
        );

        expect(result.isFailed()).toBe(true);
        expect(result.error?.isInvalidInput()).toBe(true);
        expect(flowClient.verifyAuthMethodRegistration).not.toHaveBeenCalled();
    });

    it("passes a wrong-length challenge to the server", async () => {
        const result = await buildState().submitChallenge("12345");

        expect(flowClient.verifyAuthMethodRegistration).toHaveBeenCalledWith(
            expect.objectContaining({
                code: "12345",
            })
        );
        expect(result.isState("completed")).toBe(true);
    });

    it("resends and remains in registration verification", async () => {
        const result = await buildState().resendChallenge();

        expect(
            flowClient.resendAuthMethodRegistrationChallenge
        ).toHaveBeenCalledWith({
            correlationId,
            continuationState,
        });
        expect(result.isState("authMethodVerificationRequired")).toBe(true);
        expect(result.state).toBeInstanceOf(
            AuthMethodVerificationRequiredStateV2
        );
        expect(
            (result.state as AuthMethodVerificationRequiredStateV2).method
        ).toBe(method);
        expect(
            (result.state as AuthMethodVerificationRequiredStateV2).codeLength
        ).toBe(8);
    });

    it("wraps activation failures", async () => {
        flowClient.verifyAuthMethodRegistration.mockRejectedValue(
            new Error("failed")
        );

        const result = await buildState().submitChallenge("123456");

        expect(result.isFailed()).toBe(true);
        expect(result.error).toBeDefined();
    });

    it("wraps resend failures", async () => {
        flowClient.resendAuthMethodRegistrationChallenge.mockRejectedValue(
            new Error("failed")
        );

        const result = await buildState().resendChallenge();

        expect(result.isFailed()).toBe(true);
        expect(result.error).toBeDefined();
    });
});

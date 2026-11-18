/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { AuthenticationMethodRegistrationV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/AuthenticationMethodRegistrationV2.js";
import { CustomAuthFlowScenarioV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthFlowScenarioV2.js";
import { AuthMethodRegistrationRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/AuthMethodRegistrationRequiredStateV2.js";
import { AuthMethodVerificationRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/AuthMethodVerificationRequiredStateV2.js";
import { FlowInteractionClientV2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import { FLOW_AUTH_METHOD_VERIFICATION_REQUIRED_V2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/result/FlowActionResultV2.js";
import { CustomAuthSilentCacheClient } from "../../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { getDefaultLogger } from "../../../../test_resources/TestModules.js";

describe("AuthMethodRegistrationRequiredStateV2", () => {
    const correlationId = "test-correlation-id";
    const methods: AuthenticationMethodRegistrationV2[] = [
        {
            type: "email",
            enrollHref: "/enroll/email",
        },
        {
            type: "phone",
            channels: ["sms"],
            enrollHref: "/enroll/sms",
        },
    ];
    const flowClient = {
        registerAuthMethod: jest.fn(),
    } as unknown as jest.Mocked<FlowInteractionClientV2>;
    const continuationState = {
        continuationToken: "ct-enroll",
        scenario: CustomAuthFlowScenarioV2.SignIn,
        scopes: ["openid", "profile", "offline_access"],
        links: {},
    };

    const buildState = () =>
        new AuthMethodRegistrationRequiredStateV2({
            correlationId,
            logger: getDefaultLogger(),
            config: {
                auth: { clientId: "test-client-id" },
                customAuth: { challengeTypes: ["oob"] },
            } as unknown as CustomAuthBrowserConfiguration,
            flowClient,
            cacheClient: {} as CustomAuthSilentCacheClient,
            continuationState,
            methods,
        });

    beforeEach(() => {
        jest.clearAllMocks();
        flowClient.registerAuthMethod.mockResolvedValue({
            type: FLOW_AUTH_METHOD_VERIFICATION_REQUIRED_V2,
            correlationId,
            continuationState: {
                ...continuationState,
                continuationToken: "ct-activate",
            },
            sentTo: "u***@contoso.com",
            codeLength: 6,
        });
    });

    it("selects an offered method and requests activation with its contact value", async () => {
        const result = await buildState().selectAuthMethod(
            methods[0],
            "user@contoso.com"
        );

        expect(flowClient.registerAuthMethod).toHaveBeenCalledWith({
            correlationId,
            continuationState,
            method: methods[0],
            verificationContact: "user@contoso.com",
        });
        expect(result.isState("authMethodVerificationRequired")).toBe(true);
        expect(result.state).toBeInstanceOf(
            AuthMethodVerificationRequiredStateV2
        );
        const verificationState =
            result.state as AuthMethodVerificationRequiredStateV2;
        expect(verificationState.type).toBe("email");
        expect(verificationState).not.toHaveProperty("method");
    });

    it("uses the canonical offered method selected by type", async () => {
        const result = await buildState().selectAuthMethod(
            {
                type: methods[0].type,
                enrollHref: "/enroll/attacker",
            },
            "user@contoso.com"
        );

        expect(result.isState("authMethodVerificationRequired")).toBe(true);
        expect(flowClient.registerAuthMethod).toHaveBeenCalledWith({
            correlationId,
            continuationState,
            method: methods[0],
            verificationContact: "user@contoso.com",
        });
    });

    it("rejects a method type that was not offered", async () => {
        const result = await buildState().selectAuthMethod(
            {
                type: "push",
                enrollHref: "/enroll/attacker",
            },
            "user@contoso.com"
        );

        expect(result.isFailed()).toBe(true);
        expect(result.error?.isInvalidInput()).toBe(true);
        expect(flowClient.registerAuthMethod).not.toHaveBeenCalled();
    });

    it.each(["", "   "])("rejects blank contact '%s'", async (contact) => {
        const result = await buildState().selectAuthMethod(methods[0], contact);

        expect(result.isFailed()).toBe(true);
        expect(result.error?.isInvalidInput()).toBe(true);
        expect(flowClient.registerAuthMethod).not.toHaveBeenCalled();
    });

    it("wraps interaction-client failures", async () => {
        flowClient.registerAuthMethod.mockRejectedValue(new Error("failed"));

        const result = await buildState().selectAuthMethod(
            methods[0],
            "user@contoso.com"
        );

        expect(result.isFailed()).toBe(true);
        expect(result.error).toBeDefined();
    });
});

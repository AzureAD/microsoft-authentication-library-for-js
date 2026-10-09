/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { AuthenticationMethodV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/AuthenticationMethodV2.js";
import { CustomAuthFlowScenarioV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthFlowScenarioV2.js";
import { AuthMethodSelectionRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/AuthMethodSelectionRequiredStateV2.js";
import { CodeRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/CodeRequiredStateV2.js";
import { AuthMethodSelectionRequiredStateParametersV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/CustomAuthStateParametersV2.js";
import { MFAVerificationRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/MFAVerificationRequiredStateV2.js";
import { FlowInteractionClientV2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import {
    FLOW_CODE_REQUIRED_V2,
    FLOW_PASSWORD_REQUIRED_V2,
} from "../../../../../../src/custom_auth/core/interaction_client/v2/result/FlowActionResultV2.js";
import { AuthenticationFactorV2 } from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/result/BaseResultsV2.js";
import { CustomAuthSilentCacheClient } from "../../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { getDefaultLogger } from "../../../../test_resources/TestModules.js";

describe("AuthMethodSelectionRequiredStateV2", () => {
    const correlationId = "test-correlation-id";
    const flowClient = {
        requestChallenge: jest.fn(),
    } as unknown as jest.Mocked<FlowInteractionClientV2>;

    const buildState = (
        methods: readonly AuthenticationMethodV2[],
        authenticationFactor: AuthenticationFactorV2
    ): AuthMethodSelectionRequiredStateV2 => {
        const stateParameters: AuthMethodSelectionRequiredStateParametersV2 = {
            correlationId,
            logger: getDefaultLogger(),
            config: {
                auth: { clientId: "test-client-id" },
                customAuth: { challengeTypes: ["oob"] },
            } as unknown as CustomAuthBrowserConfiguration,
            flowClient,
            cacheClient: {} as CustomAuthSilentCacheClient,
            continuationState: {
                continuationToken: "ct-selection",
                scenario: CustomAuthFlowScenarioV2.SignIn,
                links: {},
                tokenRequest: {
                    scopes: ["User.Read"],
                },
            },
            methods,
            authenticationFactor,
        };

        return new AuthMethodSelectionRequiredStateV2(stateParameters);
    };

    beforeEach(() => {
        jest.clearAllMocks();
        flowClient.requestChallenge.mockResolvedValue({
            type: FLOW_CODE_REQUIRED_V2,
            correlationId,
            continuationState: {
                continuationToken: "ct-challenge",
                scenario: CustomAuthFlowScenarioV2.SignIn,
                links: {
                    challenge: "/method/challenge",
                    verify: "/method/verify",
                },
                tokenRequest: {
                    scopes: ["User.Read"],
                },
            },
            channel: "email",
            sentTo: "u***@contoso.com",
            codeLength: 6,
        });
    });

    it("routes multiple single-factor methods to primary verification", async () => {
        const methods: AuthenticationMethodV2[] = [
            {
                id: "email-primary",
                type: "email",
                hint: "u***@contoso.com",
                challengeHref: "/methods/email-primary/challenge",
            },
            {
                id: "sms-primary",
                type: "sms",
                hint: "+*** *******11",
                challengeHref: "/methods/sms-primary/challenge",
            },
        ];

        const result = await buildState(
            methods,
            AuthenticationFactorV2.SINGLE_FACTOR
        ).selectAuthMethod(methods[0]);

        expect(result.state).toBeInstanceOf(CodeRequiredStateV2);
        expect(result.state.stateType).toBe("codeRequired");
    });

    it("routes one multi-factor method to MFA verification", async () => {
        const methods: AuthenticationMethodV2[] = [
            {
                id: "email-mfa",
                type: "email",
                hint: "u***@contoso.com",
                challengeHref: "/methods/email-mfa/challenge",
            },
        ];

        const result = await buildState(
            methods,
            AuthenticationFactorV2.MULTI_FACTOR
        ).selectAuthMethod(methods[0]);

        expect(result.state).toBeInstanceOf(MFAVerificationRequiredStateV2);
        expect(result.state.stateType).toBe("mfaVerificationRequired");
    });

    it("rejects a method that was not returned by the server", async () => {
        const result = await buildState(
            [
                {
                    id: "email-primary",
                    type: "email",
                    challengeHref: "/methods/email-primary/challenge",
                },
            ],
            AuthenticationFactorV2.SINGLE_FACTOR
        ).selectAuthMethod({
            id: "unknown",
            type: "email",
            challengeHref: "/methods/unknown/challenge",
        });

        expect(result.isFailed()).toBe(true);
        expect(result.error?.isInvalidInput()).toBe(true);
        expect(flowClient.requestChallenge).not.toHaveBeenCalled();
    });

    it("uses the server-provided challenge URL for a matching method ID", async () => {
        const serverMethod: AuthenticationMethodV2 = {
            id: "email-primary",
            type: "email",
            challengeHref: "/methods/email-primary/challenge",
        };

        await buildState(
            [serverMethod],
            AuthenticationFactorV2.SINGLE_FACTOR
        ).selectAuthMethod({
            ...serverMethod,
            challengeHref: "https://attacker.example/challenge",
        });

        expect(flowClient.requestChallenge).toHaveBeenCalledWith({
            correlationId,
            continuationState: {
                continuationToken: "ct-selection",
                scenario: CustomAuthFlowScenarioV2.SignIn,
                links: {
                    challenge: serverMethod.challengeHref,
                },
                tokenRequest: {
                    scopes: ["User.Read"],
                },
            },
        });
    });

    it("describes the expected and returned challenges for an unsupported transition", async () => {
        const methods: AuthenticationMethodV2[] = [
            {
                id: "email-mfa",
                type: "email",
                challengeHref: "/methods/email-mfa/challenge",
            },
        ];
        flowClient.requestChallenge.mockResolvedValue({
            type: FLOW_PASSWORD_REQUIRED_V2,
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
        });

        const result = await buildState(
            methods,
            AuthenticationFactorV2.MULTI_FACTOR
        ).selectAuthMethod(methods[0]);

        expect(result.isFailed()).toBe(true);
        expect(result.error?.errorDescription).toBe(
            "Authentication method selection expected a code challenge for multi-factor authentication, but the server returned a password challenge."
        );
    });
});

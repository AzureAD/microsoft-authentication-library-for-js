/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { CustomAuthFlowScenarioV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthFlowScenarioV2.js";
import { AuthMethodSelectionRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/AuthMethodSelectionRequiredStateV2.js";
import { CompletedStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/CompletedStateV2.js";
import { FlowInteractionClientV2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import {
    FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2,
    FLOW_COMPLETED_V2,
    FLOW_MFA_REQUIRED_V2,
} from "../../../../../../src/custom_auth/core/interaction_client/v2/result/FlowActionResultV2.js";
import { CustomAuthAccountData } from "../../../../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { CustomAuthSilentCacheClient } from "../../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { PasswordRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/PasswordRequiredStateV2.js";
import type { PasswordRequiredStateParametersV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/CustomAuthStateParametersV2.js";
import type { AuthenticationResult } from "../../../../../../src/response/AuthenticationResult.js";
import { getDefaultLogger } from "../../../../test_resources/TestModules.js";
import { AuthMethodRegistrationRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/AuthMethodRegistrationRequiredStateV2.js";

describe("PasswordRequiredStateV2 sign-in", () => {
    const correlationId = "test-correlation-id";
    const scopes = ["openid", "profile", "offline_access"];
    const flowClient = {
        submitSignInPassword: jest.fn(),
        submitSignUpAttributes: jest.fn(),
    } as unknown as jest.Mocked<FlowInteractionClientV2>;

    const buildState = (
        overrides: Partial<PasswordRequiredStateParametersV2> = {}
    ): PasswordRequiredStateV2 =>
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
                scopes,
                links: {
                    verify: "/password/verify",
                },
            },
            ...overrides,
        });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("completes sign-in after password verification", async () => {
        flowClient.submitSignInPassword.mockResolvedValue({
            type: FLOW_COMPLETED_V2,
            correlationId,
            authenticationResult: {
                account: {
                    homeAccountId: "uid.utid",
                },
            } as unknown as AuthenticationResult,
        });

        const result = await buildState().submitPassword("valid-password");

        expect(result.isState("completed")).toBe(true);
        expect(result.state).toBeInstanceOf(CompletedStateV2);
        expect(result.data).toBeInstanceOf(CustomAuthAccountData);
    });

    it("returns method selection when password verification requires a second factor", async () => {
        flowClient.submitSignInPassword.mockResolvedValue({
            type: FLOW_MFA_REQUIRED_V2,
            correlationId,
            continuationState: {
                continuationToken: "ct-mfa",
                scenario: CustomAuthFlowScenarioV2.SignIn,
                scopes,
                links: {},
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

        const result = await buildState().submitPassword("valid-password");

        expect(flowClient.submitSignInPassword).toHaveBeenCalledWith({
            correlationId,
            continuationState: {
                continuationToken: "ct-password",
                scenario: CustomAuthFlowScenarioV2.SignIn,
                scopes,
                links: {
                    verify: "/password/verify",
                },
            },
            password: "valid-password",
        });
        expect(result.isState("authMethodSelectionRequired")).toBe(true);
        expect(result.state).toBeInstanceOf(AuthMethodSelectionRequiredStateV2);

        if (result.isState("authMethodSelectionRequired")) {
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

    it("returns registration-required after password verification", async () => {
        flowClient.submitSignInPassword.mockResolvedValue({
            type: FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2,
            correlationId,
            continuationState: {
                continuationToken: "ct-enroll",
                scenario: CustomAuthFlowScenarioV2.SignIn,
                scopes,
                links: {},
            },
            methods: [
                {
                    type: "phone",
                    channels: ["sms"],
                    enrollHref: "/enroll/phone",
                },
            ],
        });

        const result = await buildState().submitPassword("valid-password");

        expect(result.isState("authMethodRegistrationRequired")).toBe(true);
        expect(result.state).toBeInstanceOf(
            AuthMethodRegistrationRequiredStateV2
        );
    });

    it("rejects an empty password without submitting it", async () => {
        const result = await buildState().submitPassword("");

        expect(result.isFailed()).toBe(true);
        expect(result.error?.isInvalidInput()).toBe(true);
        expect(flowClient.submitSignInPassword).not.toHaveBeenCalled();
    });

    it("does not submit sign-up attributes during sign-in", async () => {
        flowClient.submitSignInPassword.mockResolvedValue({
            type: FLOW_COMPLETED_V2,
            correlationId,
            authenticationResult: {
                account: { homeAccountId: "uid.utid" },
            } as AuthenticationResult,
        });
        const state = buildState();

        const result = await state.submitPassword("valid-password", {
            givenName: "Ignored",
        });

        expect(result.isState("completed")).toBe(true);
        expect(state.attributes).toEqual([]);
        expect(state.requiredPasswordAttribute).toBeUndefined();
        expect(flowClient.submitSignInPassword).toHaveBeenCalledWith({
            correlationId,
            continuationState: state["stateParameters"].continuationState,
            password: "valid-password",
        });
        expect(flowClient.submitSignUpAttributes).not.toHaveBeenCalled();
    });

    it.each([
        CustomAuthFlowScenarioV2.Unknown,
        CustomAuthFlowScenarioV2.PasswordReset,
    ])("rejects password submission for the %s scenario", async (scenario) => {
        const result = await buildState({
            continuationState: {
                continuationToken: "ct-unsupported",
                scenario,
                scopes,
                links: {},
            },
        }).submitPassword("valid-password");

        expect(result.isFailed()).toBe(true);
        expect(result.scenario).toBe(scenario);
        expect(result.error?.errorData.error).toBe(
            "unsupported_flow_transition"
        );
        expect(flowClient.submitSignInPassword).not.toHaveBeenCalled();
        expect(flowClient.submitSignUpAttributes).not.toHaveBeenCalled();
    });

    it("wraps asynchronous sign-in submission failures", async () => {
        const error = new Error("Password submission failed.");
        flowClient.submitSignInPassword.mockRejectedValueOnce(error);

        const result = await buildState().submitPassword("valid-password");

        expect(result.isFailed()).toBe(true);
        expect(result.scenario).toBe(CustomAuthFlowScenarioV2.SignIn);
        expect(result.error?.correlationId).toBe(correlationId);
        expect(flowClient.submitSignUpAttributes).not.toHaveBeenCalled();
    });
});

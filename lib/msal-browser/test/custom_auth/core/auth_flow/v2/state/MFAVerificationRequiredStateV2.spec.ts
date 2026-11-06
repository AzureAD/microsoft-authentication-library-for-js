/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { CustomAuthFlowScenarioV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/CustomAuthFlowScenarioV2.js";
import { CustomAuthApiError } from "../../../../../../src/custom_auth/core/error/CustomAuthApiError.js";
import { CompletedStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/CompletedStateV2.js";
import { MFAVerificationRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/MFAVerificationRequiredStateV2.js";
import { FlowInteractionClientV2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import {
    FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2,
    FLOW_CODE_REQUIRED_V2,
    FLOW_COMPLETED_V2,
} from "../../../../../../src/custom_auth/core/interaction_client/v2/result/FlowActionResultV2.js";
import { CustomAuthAccountData } from "../../../../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { CustomAuthSilentCacheClient } from "../../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import type { AuthenticationResult } from "../../../../../../src/response/AuthenticationResult.js";
import { getDefaultLogger } from "../../../../test_resources/TestModules.js";
import { AuthenticationFactorV2 } from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/result/BaseResultsV2.js";

describe("MFAVerificationRequiredStateV2", () => {
    const correlationId = "test-correlation-id";
    const scopes = ["openid", "profile", "offline_access"];
    const invalidCodeError = () =>
        new CustomAuthApiError(
            "invalidGrant",
            "Invalid code.",
            correlationId,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            "invalidOneTimeCode"
        );
    const flowClient = {
        submitCode: jest.fn(),
        resendCode: jest.fn(),
    } as unknown as jest.Mocked<FlowInteractionClientV2>;

    const buildState = (
        logger = getDefaultLogger()
    ): MFAVerificationRequiredStateV2 =>
        new MFAVerificationRequiredStateV2({
            correlationId,
            logger,
            config: {
                auth: { clientId: "test-client-id" },
                customAuth: { challengeTypes: ["oob"] },
            } as unknown as CustomAuthBrowserConfiguration,
            flowClient,
            cacheClient: {} as CustomAuthSilentCacheClient,
            continuationState: {
                continuationToken: "ct-mfa-challenge",
                scenario: CustomAuthFlowScenarioV2.SignIn,
                scopes,
                links: {
                    verify: "/mfa/verify",
                    resend: "/mfa/resend",
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
            authenticationFactor: AuthenticationFactorV2.MULTI_FACTOR,
            continuationState: {
                continuationToken: "ct-mfa-challenge",
                scenario: CustomAuthFlowScenarioV2.SignIn,
                scopes,
                links: {
                    verify: "/mfa/verify",
                    resend: "/mfa/resend",
                },
            },
            code: "123456",
        });
        expect(result.isState("completed")).toBe(true);
        expect(result.state).toBeInstanceOf(CompletedStateV2);
        expect(result.data).toBeInstanceOf(CustomAuthAccountData);
    });

    it("submits a wrong-length MFA challenge and surfaces the server result", async () => {
        flowClient.submitCode.mockResolvedValue({
            type: FLOW_COMPLETED_V2,
            correlationId,
            authenticationResult: {
                account: {
                    homeAccountId: "uid.utid",
                },
            } as unknown as AuthenticationResult,
        });

        const result = await buildState().submitChallenge("12345");

        expect(flowClient.submitCode).toHaveBeenCalledWith(
            expect.objectContaining({
                code: "12345",
            })
        );
        expect(result.isState("completed")).toBe(true);
    });

    it("logs the raw rejection and classifies it at the public boundary", async () => {
        const errorData = invalidCodeError();
        const logger = getDefaultLogger();
        const logError = jest.spyOn(logger, "errorPii");
        flowClient.submitCode.mockRejectedValue(errorData);

        const result = await buildState(logger).submitChallenge("123456");

        expect(logError).toHaveBeenCalledWith(
            `Failed to submit V2 MFA challenge. Error: '${errorData}'.`,
            correlationId
        );
        expect(result.isFailed()).toBe(true);
        expect(result.error?.errorData).toBe(errorData);
        expect(result.error?.isInvalidChallenge()).toBe(true);
        expect(result.error?.isInvalidCode()).toBe(false);
    });

    it("does not classify a resend failure as a rejected challenge", async () => {
        const errorData = invalidCodeError();
        flowClient.resendCode.mockRejectedValue(errorData);

        const result = await buildState().resendChallenge();

        expect(result.isFailed()).toBe(true);
        expect(result.error?.errorData).toBe(errorData);
        expect(result.error?.isInvalidChallenge()).toBe(false);
    });

    it("fails MFA completion when the account is missing", async () => {
        flowClient.submitCode.mockResolvedValue({
            type: FLOW_COMPLETED_V2,
            correlationId,
            authenticationResult: {
                account: undefined,
            } as unknown as AuthenticationResult,
        });

        const result = await buildState().submitChallenge("123456");

        expect(result.isFailed()).toBe(true);
        expect(result.data).toBeUndefined();
        expect(result.error).toBeDefined();
    });

    it("rejects enrollment after MFA verification without returning account data", async () => {
        flowClient.submitCode.mockResolvedValue({
            type: FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2,
            correlationId,
            continuationState: {
                continuationToken: "ct-enroll",
                scenario: CustomAuthFlowScenarioV2.PasswordReset,
                scopes,
                links: {},
            },
            methods: [
                {
                    type: "email",
                    enrollHref: "/enroll/email",
                },
            ],
        });

        const result = await buildState().submitChallenge("123456");

        expect(result.isFailed()).toBe(true);
        expect(result.error).toBeDefined();
        expect(result.data).toBeUndefined();
    });

    it("resends an MFA challenge and remains in MFA verification", async () => {
        flowClient.resendCode.mockResolvedValue({
            type: FLOW_CODE_REQUIRED_V2,
            correlationId,
            continuationState: {
                continuationToken: "ct-mfa-resend",
                scenario: CustomAuthFlowScenarioV2.SignIn,
                scopes,
                links: {
                    verify: "/mfa/verify",
                    resend: "/mfa/resend",
                },
            },
            sentTo: "+1******5678",
            channel: "sms",
            codeLength: 6,
        });

        const result = await buildState().resendChallenge();

        expect(flowClient.resendCode).toHaveBeenCalledWith(
            expect.objectContaining({
                authenticationFactor: AuthenticationFactorV2.MULTI_FACTOR,
            })
        );
        expect(result.isState("mfaVerificationRequired")).toBe(true);
        expect(result.isState("codeRequired")).toBe(false);
        expect(result.state).toBeInstanceOf(MFAVerificationRequiredStateV2);
        if (result.isState("mfaVerificationRequired")) {
            expect(result.state.method?.type).toBe("sms");
            expect(result.state.sentTo).toBe("+1******5678");
        }
    });
});

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { AuthenticationResult } from "../../../../../../src/response/AuthenticationResult.js";
import type { CustomAuthBrowserConfiguration } from "../../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { CustomAuthApiError } from "../../../../../../src/custom_auth/core/error/CustomAuthApiError.js";
import { ExistingAccountCodeRequiredStateV2 } from "../../../../../../src/custom_auth/sign_up/auth_flow/v2/state/ExistingAccountCodeRequiredStateV2.js";
import { ExistingAccountPasswordRequiredStateV2 } from "../../../../../../src/custom_auth/sign_up/auth_flow/v2/state/ExistingAccountPasswordRequiredStateV2.js";
import { AuthMethodSelectionRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/AuthMethodSelectionRequiredStateV2.js";
import { MFAVerificationRequiredStateV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/MFAVerificationRequiredStateV2.js";
import { SignInStateTransitionHandlerV2 } from "../../../../../../src/custom_auth/sign_in/auth_flow/v2/state/SignInStateTransitionHandlerV2.js";
import { AuthenticationFactorV2 } from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/result/BaseResultsV2.js";
import type { FlowInteractionClientV2 } from "../../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import {
    FLOW_CODE_REQUIRED_V2,
    FLOW_COMPLETED_V2,
    FLOW_MFA_REQUIRED_V2,
    FLOW_PASSWORD_REQUIRED_V2,
} from "../../../../../../src/custom_auth/core/interaction_client/v2/result/FlowActionResultV2.js";
import type { CustomAuthSilentCacheClient } from "../../../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { getDefaultLogger } from "../../../../test_resources/TestModules.js";

describe("existing-account sign-up states", () => {
    const correlationId = "test-correlation-id";
    const continuationState = {
        continuationToken: "ct-existing",
        scenario: "signUp" as const,
        scopes: ["openid", "profile", "offline_access"],
        links: {
            verify: "/existing/verify",
            resend: "/existing/resend",
        },
        signUp: {
            purpose: "existingAccount" as const,
        },
    };
    const flowClient = {
        submitCode: jest.fn(),
        resendCode: jest.fn(),
        submitSignInPassword: jest.fn(),
        submitSignUpAttributes: jest.fn(),
        requestChallenge: jest.fn(),
    } as unknown as jest.Mocked<FlowInteractionClientV2>;
    const commonParameters = {
        correlationId,
        logger: getDefaultLogger(),
        config: {
            auth: { clientId: "test-client-id" },
            customAuth: { challengeTypes: ["oob"] },
        } as unknown as CustomAuthBrowserConfiguration,
        flowClient,
        cacheClient: {} as CustomAuthSilentCacheClient,
        continuationState,
        signInStateTransitionHandler: new SignInStateTransitionHandlerV2(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const methods = ["email", "password"].map((type) => ({
        id: `${type}-1`,
        type,
        challengeHref: `/existing/${type}/challenge`,
    }));

    it.each(["email", "password"] as const)(
        "maps a selected %s challenge to its existing-account state",
        async (methodType) => {
            const method = methods[methodType === "email" ? 0 : 1];
            const freshContinuation = {
                ...continuationState,
                continuationToken: "ct-selected",
            };
            flowClient.requestChallenge.mockResolvedValue({
                type:
                    methodType === "email"
                        ? FLOW_CODE_REQUIRED_V2
                        : FLOW_PASSWORD_REQUIRED_V2,
                correlationId,
                continuationState: freshContinuation,
                channel: methodType,
                sentTo: "e***@contoso.com",
                codeLength: 8,
            });
            const state = new AuthMethodSelectionRequiredStateV2({
                ...commonParameters,
                methods,
                authenticationFactor: AuthenticationFactorV2.SINGLE_FACTOR,
            });

            const result = await state.selectAuthMethod(method);

            expect(
                result.isState(
                    methodType === "email"
                        ? "existingAccountCodeRequired"
                        : "existingAccountPasswordRequired"
                )
            ).toBe(true);
            expect(flowClient.requestChallenge).toHaveBeenCalledWith({
                correlationId,
                continuationState: {
                    ...continuationState,
                    links: {
                        ...continuationState.links,
                        challenge: method.challengeHref,
                    },
                },
            });
            if (result.isState("existingAccountCodeRequired")) {
                expect(result.state).toMatchObject({
                    channel: "email",
                    sentTo: "e***@contoso.com",
                    codeLength: 8,
                });
            }
        }
    );

    it("rejects an unoffered method without requesting its challenge", async () => {
        const state = new AuthMethodSelectionRequiredStateV2({
            ...commonParameters,
            methods,
            authenticationFactor: AuthenticationFactorV2.SINGLE_FACTOR,
        });

        const result = await state.selectAuthMethod({
            id: "unknown",
            type: "email",
            challengeHref: "/unknown/challenge",
        });

        expect(result.isFailed()).toBe(true);
        expect(flowClient.requestChallenge).not.toHaveBeenCalled();
    });

    it("allows retry after a selected challenge request fails", async () => {
        flowClient.requestChallenge
            .mockRejectedValueOnce(
                new CustomAuthApiError(
                    "invalid_grant",
                    "The challenge request failed.",
                    correlationId
                )
            )
            .mockResolvedValueOnce({
                type: FLOW_CODE_REQUIRED_V2,
                correlationId,
                continuationState,
                channel: "email",
                codeLength: 8,
            });
        const state = new AuthMethodSelectionRequiredStateV2({
            ...commonParameters,
            methods,
            authenticationFactor: AuthenticationFactorV2.SINGLE_FACTOR,
        });

        const failed = await state.selectAuthMethod(methods[0]);
        const retried = await state.selectAuthMethod(methods[0]);

        expect(failed.isFailed()).toBe(true);
        expect(retried.isState("existingAccountCodeRequired")).toBe(true);
    });

    it.each([
        AuthenticationFactorV2.SINGLE_FACTOR,
        AuthenticationFactorV2.MULTI_FACTOR,
    ])(
        "uses %s context to distinguish existing-account credentials from SMS MFA",
        async (authenticationFactor) => {
            const method = {
                id: "sms-1",
                type: "sms",
                challengeHref: "/mfa/sms/challenge",
            };
            flowClient.requestChallenge.mockResolvedValue({
                type: FLOW_CODE_REQUIRED_V2,
                correlationId,
                continuationState,
                channel: "sms",
                codeLength: 6,
            });
            const state = new AuthMethodSelectionRequiredStateV2({
                ...commonParameters,
                methods: [method],
                authenticationFactor,
            });

            const result = await state.selectAuthMethod(method);

            if (authenticationFactor === AuthenticationFactorV2.MULTI_FACTOR) {
                expect(result.state).toBeInstanceOf(
                    MFAVerificationRequiredStateV2
                );
            } else {
                expect(result.isFailed()).toBe(true);
            }
        }
    );

    it("continues selected existing-account credentials into shared MFA selection", async () => {
        const mfaMethod = {
            id: "sms-mfa",
            type: "sms",
            challengeHref: "/mfa/sms/challenge",
        };
        const mfaContinuationState = {
            ...continuationState,
            continuationToken: "ct-mfa",
        };
        flowClient.requestChallenge
            .mockResolvedValueOnce({
                type: FLOW_CODE_REQUIRED_V2,
                correlationId,
                continuationState,
                channel: "email",
                codeLength: 8,
            })
            .mockResolvedValueOnce({
                type: FLOW_CODE_REQUIRED_V2,
                correlationId,
                continuationState: mfaContinuationState,
                channel: "sms",
                codeLength: 6,
            });
        flowClient.submitCode.mockResolvedValueOnce({
            type: FLOW_MFA_REQUIRED_V2,
            correlationId,
            continuationState: mfaContinuationState,
            methods: [mfaMethod],
        });
        const state = new AuthMethodSelectionRequiredStateV2({
            ...commonParameters,
            methods,
            authenticationFactor: AuthenticationFactorV2.SINGLE_FACTOR,
        });

        const selected = await state.selectAuthMethod(methods[0]);
        if (!selected.isState("existingAccountCodeRequired")) {
            throw new Error("Expected existing-account email verification.");
        }

        const verification = await selected.state.submitCode("12345678");
        if (!verification.isState("authMethodSelectionRequired")) {
            throw new Error("Expected shared MFA method selection.");
        }
        expect(verification.state).toBeInstanceOf(
            AuthMethodSelectionRequiredStateV2
        );
        expect(verification.state.methods).toEqual([mfaMethod]);

        const mfa = await verification.state.selectAuthMethod(mfaMethod);

        expect(mfa.state).toBeInstanceOf(MFAVerificationRequiredStateV2);
    });

    it("allows retry after a bad existing-account code", async () => {
        flowClient.submitCode
            .mockRejectedValueOnce(
                new CustomAuthApiError(
                    "invalid_grant",
                    "The code is incorrect.",
                    correlationId
                )
            )
            .mockResolvedValueOnce({
                type: FLOW_COMPLETED_V2,
                correlationId,
                authenticationResult: {
                    account: { homeAccountId: "uid.utid" },
                } as unknown as AuthenticationResult,
            });
        const state = new ExistingAccountCodeRequiredStateV2({
            ...commonParameters,
            method: {
                id: "email-1",
                type: "email",
                challengeHref: "/email/challenge",
            },
            channel: "email",
            sentTo: "e***@contoso.com",
            codeLength: 6,
        });

        const failed = await state.submitCode("000000");
        const completed = await state.submitCode("123456");

        expect(failed.isFailed()).toBe(true);
        expect(completed.isState("completed")).toBe(true);
        expect(flowClient.submitCode).toHaveBeenNthCalledWith(2, {
            correlationId,
            continuationState,
            code: "123456",
        });
    });

    it("returns the same purpose-specific state after resend", async () => {
        flowClient.resendCode.mockResolvedValue({
            type: FLOW_CODE_REQUIRED_V2,
            correlationId,
            continuationState: {
                ...continuationState,
                continuationToken: "ct-fresh",
                links: {
                    verify: "/existing/verify-fresh",
                    resend: "/existing/resend-fresh",
                },
            },
            channel: "email",
            sentTo: "f***@contoso.com",
            codeLength: 8,
        });
        const state = new ExistingAccountCodeRequiredStateV2({
            ...commonParameters,
            channel: "email",
            sentTo: "e***@contoso.com",
            codeLength: 6,
        });

        const result = await state.resendCode();

        expect(result.isState("existingAccountCodeRequired")).toBe(true);
        if (result.isState("existingAccountCodeRequired")) {
            expect(result.state).toMatchObject({
                channel: "email",
                sentTo: "f***@contoso.com",
                codeLength: 8,
            });
        }
    });

    it("verifies the existing password without submitting sign-up attributes and allows retry", async () => {
        flowClient.submitSignInPassword
            .mockRejectedValueOnce(
                new CustomAuthApiError(
                    "invalid_grant",
                    "The password is incorrect.",
                    correlationId
                )
            )
            .mockResolvedValueOnce({
                type: FLOW_COMPLETED_V2,
                correlationId,
                authenticationResult: {
                    account: { homeAccountId: "uid.utid" },
                } as unknown as AuthenticationResult,
            });
        const state = new ExistingAccountPasswordRequiredStateV2(
            commonParameters
        );

        const failed = await state.submitPassword("wrong-password");
        const completed = await state.submitPassword("valid-password");

        expect(failed.isFailed()).toBe(true);
        expect(completed.isState("completed")).toBe(true);
        expect(flowClient.submitSignInPassword).toHaveBeenNthCalledWith(2, {
            correlationId,
            continuationState,
            password: "valid-password",
        });
        expect(flowClient.submitSignUpAttributes).not.toHaveBeenCalled();
    });
});

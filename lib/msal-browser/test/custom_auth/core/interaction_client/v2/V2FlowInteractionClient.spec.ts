/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StubbedNetworkModule } from "@azure/msal-common/browser";
import { V2FlowInteractionClient } from "../../../../../src/custom_auth/core/interaction_client/v2/V2FlowInteractionClient.js";
import {
    V2_FLOW_CODE_REQUIRED,
    V2_FLOW_PASSWORD_REQUIRED,
    V2_FLOW_SIGN_IN_AFTER_RESET_REQUIRED,
    V2_FLOW_COMPLETED,
    V2FlowCodeRequiredResult,
    V2FlowPasswordRequiredResult,
    V2FlowSignInAfterResetRequiredResult,
    V2FlowCompletedResult,
} from "../../../../../src/custom_auth/core/interaction_client/v2/result/V2FlowActionResult.js";
import { V2FlowContinuationState } from "../../../../../src/custom_auth/core/interaction_client/v2/V2FlowContinuationState.js";
import { CustomAuthAuthority } from "../../../../../src/custom_auth/core/CustomAuthAuthority.js";
import { CustomAuthV2ApiClient } from "../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/CustomAuthV2ApiClient.js";
import { RESET_PASSWORD_TIMEOUT } from "../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/V2ApiClientConstants.js";
import { buildConfiguration } from "../../../../../src/config/Configuration.js";
import { customAuthConfig } from "../../../test_resources/CustomAuthConfig.js";
import {
    getDefaultBrowserCacheManager,
    getDefaultCrypto,
    getDefaultEventHandler,
    getDefaultLogger,
    getDefaultNavigationClient,
    getDefaultPerformanceClient,
} from "../../../test_resources/TestModules.js";

describe("V2FlowInteractionClient", () => {
    let client: V2FlowInteractionClient;
    let apiClient: jest.Mocked<
        Pick<
            CustomAuthV2ApiClient,
            | "resetPasswordStart"
            | "requestChallenge"
            | "verifyCode"
            | "submitNewPassword"
            | "poll"
            | "completeWithTokens"
        >
    >;

    const correlationId = "corr-123";

    beforeEach(() => {
        const clientId = customAuthConfig.auth.clientId;
        const config = buildConfiguration(
            { auth: { clientId: clientId } },
            false
        );
        const logger = getDefaultLogger();
        const performanceClient = getDefaultPerformanceClient(clientId);
        const eventHandler = getDefaultEventHandler();
        const crypto = getDefaultCrypto(clientId, logger, performanceClient);
        const cacheManager = getDefaultBrowserCacheManager(
            clientId,
            logger,
            performanceClient,
            eventHandler,
            undefined,
            config.cache
        );

        const authority = new CustomAuthAuthority(
            customAuthConfig.auth.authority ?? "",
            config,
            StubbedNetworkModule,
            cacheManager,
            logger,
            performanceClient,
            customAuthConfig.customAuth.authApiProxyUrl
        );

        apiClient = {
            resetPasswordStart: jest.fn(),
            requestChallenge: jest.fn(),
            verifyCode: jest.fn(),
            submitNewPassword: jest.fn(),
            poll: jest.fn(),
            completeWithTokens: jest.fn(),
        } as unknown as jest.Mocked<
            Pick<
                CustomAuthV2ApiClient,
                | "resetPasswordStart"
                | "requestChallenge"
                | "verifyCode"
                | "submitNewPassword"
                | "poll"
                | "completeWithTokens"
            >
        >;

        client = new V2FlowInteractionClient(
            config,
            cacheManager,
            crypto,
            logger,
            eventHandler,
            getDefaultNavigationClient(),
            performanceClient,
            authority,
            apiClient as unknown as CustomAuthV2ApiClient
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    describe("resetPassword", () => {
        it("runs entry + challenge and returns a code-required result", async () => {
            apiClient.resetPasswordStart.mockResolvedValue({
                continuationToken: "ct-start",
                challengeHref: "https://endpoint/challenge",
            });
            apiClient.requestChallenge.mockResolvedValue({
                continuationToken: "ct-challenge",
                verifyHref: "https://endpoint/verify",
                resendHref: "https://endpoint/resend",
                codeLength: 6,
                hint: "u***@contoso.com",
                channel: "email",
            });

            const result = await client.resetPassword({
                correlationId,
                username: "user@contoso.com",
            });

            expect(apiClient.resetPasswordStart).toHaveBeenCalledWith(
                "user@contoso.com",
                expect.objectContaining({ correlationId })
            );
            expect(apiClient.requestChallenge).toHaveBeenCalledWith(
                "https://endpoint/challenge",
                { continuationToken: "ct-start" },
                expect.objectContaining({ correlationId })
            );

            expect(result.type).toBe(V2_FLOW_CODE_REQUIRED);

            const codeRequired = result as V2FlowCodeRequiredResult;
            expect(codeRequired.correlationId).toBe(correlationId);
            expect(codeRequired.codeLength).toBe(6);
            expect(codeRequired.sentTo).toBe("u***@contoso.com");
            expect(codeRequired.channel).toBe("email");
            expect(codeRequired.continuationState).toEqual({
                correlationId,
                continuationToken: "ct-challenge",
                scenario: "resetPassword",
                links: {
                    verify: "https://endpoint/verify",
                    resend: "https://endpoint/resend",
                },
            });
        });
    });

    describe("submitCode", () => {
        const continuationState: V2FlowContinuationState = {
            correlationId,
            continuationToken: "ct-challenge",
            scenario: "resetPassword",
            links: {
                verify: "https://endpoint/verify",
                resend: "https://endpoint/resend",
            },
        };

        it("verifies the code and returns a password-required result", async () => {
            apiClient.verifyCode.mockResolvedValue({
                nextAction: "update",
                continuationToken: "ct-verify",
                updateHref: "https://endpoint/update",
            });

            const result = await client.submitCode({
                correlationId,
                continuationState,
                code: "123456",
            });

            expect(apiClient.verifyCode).toHaveBeenCalledWith(
                "https://endpoint/verify",
                { continuationToken: "ct-challenge", otp: "123456" },
                expect.objectContaining({ correlationId })
            );

            expect(result.type).toBe(V2_FLOW_PASSWORD_REQUIRED);

            const passwordRequired = result as V2FlowPasswordRequiredResult;
            expect(passwordRequired.correlationId).toBe(correlationId);
            expect(passwordRequired.continuationState).toEqual({
                correlationId,
                continuationToken: "ct-verify",
                scenario: "resetPassword",
                links: { update: "https://endpoint/update" },
            });
        });

        it("throws when the continuation is missing the verify link", async () => {
            await expect(
                client.submitCode({
                    correlationId,
                    continuationState: {
                        ...continuationState,
                        links: {},
                    },
                    code: "123456",
                })
            ).rejects.toThrow();

            expect(apiClient.verifyCode).not.toHaveBeenCalled();
        });
    });

    describe("resendCode", () => {
        const continuationState: V2FlowContinuationState = {
            correlationId,
            continuationToken: "ct-challenge",
            scenario: "resetPassword",
            links: {
                verify: "https://endpoint/verify",
                resend: "https://endpoint/resend",
            },
        };

        it("re-requests the challenge and returns a code-required result", async () => {
            apiClient.requestChallenge.mockResolvedValue({
                continuationToken: "ct-challenge-2",
                verifyHref: "https://endpoint/verify-2",
                resendHref: "https://endpoint/resend-2",
                codeLength: 8,
                hint: "u***@contoso.com",
                channel: "email",
            });

            const result = await client.resendCode({
                correlationId,
                continuationState,
            });

            expect(apiClient.requestChallenge).toHaveBeenCalledWith(
                "https://endpoint/resend",
                { continuationToken: "ct-challenge" },
                expect.objectContaining({ correlationId })
            );

            expect(result.type).toBe(V2_FLOW_CODE_REQUIRED);

            const codeRequired = result as V2FlowCodeRequiredResult;
            expect(codeRequired.correlationId).toBe(correlationId);
            expect(codeRequired.codeLength).toBe(8);
            expect(codeRequired.sentTo).toBe("u***@contoso.com");
            expect(codeRequired.channel).toBe("email");
            expect(codeRequired.continuationState).toEqual({
                correlationId,
                continuationToken: "ct-challenge-2",
                scenario: "resetPassword",
                links: {
                    verify: "https://endpoint/verify-2",
                    resend: "https://endpoint/resend-2",
                },
            });
        });

        it("throws when the continuation is missing the resend link", async () => {
            await expect(
                client.resendCode({
                    correlationId,
                    continuationState: {
                        ...continuationState,
                        links: {},
                    },
                })
            ).rejects.toThrow();

            expect(apiClient.requestChallenge).not.toHaveBeenCalled();
        });
    });

    describe("submitPassword", () => {
        const continuationState: V2FlowContinuationState = {
            correlationId,
            continuationToken: "ct-verify",
            scenario: "resetPassword",
            links: { update: "https://endpoint/update" },
        };

        it("submits the password, polls once, and returns sign-in-after-reset", async () => {
            apiClient.submitNewPassword.mockResolvedValue({
                continuationToken: "ct-update",
                pollHref: "https://endpoint/poll",
            });
            apiClient.poll.mockResolvedValue({
                continuationToken: "ct-complete",
                isCompleted: true,
                continueHref: "https://endpoint/continue",
            });

            const result = await client.submitPassword({
                correlationId,
                continuationState,
                newPassword: "P@ssw0rd!",
            });

            expect(apiClient.submitNewPassword).toHaveBeenCalledWith(
                "https://endpoint/update",
                {
                    continuationToken: "ct-verify",
                    newPassword: "P@ssw0rd!",
                },
                expect.objectContaining({ correlationId })
            );
            expect(apiClient.poll).toHaveBeenCalledTimes(1);
            expect(apiClient.poll).toHaveBeenCalledWith(
                "https://endpoint/poll",
                { continuationToken: "ct-update" },
                expect.objectContaining({ correlationId })
            );

            expect(result.type).toBe(V2_FLOW_SIGN_IN_AFTER_RESET_REQUIRED);

            const signInRequired =
                result as V2FlowSignInAfterResetRequiredResult;
            expect(signInRequired.correlationId).toBe(correlationId);
            expect(signInRequired.continuationState).toEqual({
                correlationId,
                continuationToken: "ct-complete",
                scenario: "resetPassword",
                links: { continue: "https://endpoint/continue" },
            });
        });

        it("re-polls with the refreshed token until the reset completes", async () => {
            jest.useFakeTimers();
            apiClient.submitNewPassword.mockResolvedValue({
                continuationToken: "ct-update",
                pollHref: "https://endpoint/poll",
            });
            apiClient.poll
                .mockResolvedValueOnce({
                    continuationToken: "ct-poll-1",
                    isCompleted: false,
                })
                .mockResolvedValueOnce({
                    continuationToken: "ct-complete",
                    isCompleted: true,
                    continueHref: "https://endpoint/continue",
                });

            const promise = client.submitPassword({
                correlationId,
                continuationState,
                newPassword: "P@ssw0rd!",
            });

            // Advance past the 1.5s inter-attempt delay so the second poll runs.
            await jest.advanceTimersByTimeAsync(1500);
            const result = await promise;

            expect(apiClient.poll).toHaveBeenCalledTimes(2);
            // The second poll presents the token returned by the first poll.
            expect(apiClient.poll).toHaveBeenLastCalledWith(
                "https://endpoint/poll",
                { continuationToken: "ct-poll-1" },
                expect.objectContaining({ correlationId })
            );
            expect(result.type).toBe(V2_FLOW_SIGN_IN_AFTER_RESET_REQUIRED);
        });

        it("throws a timeout error when polling never completes", async () => {
            jest.useFakeTimers();
            apiClient.submitNewPassword.mockResolvedValue({
                continuationToken: "ct-update",
                pollHref: "https://endpoint/poll",
            });
            apiClient.poll.mockResolvedValue({
                continuationToken: "ct-poll",
                isCompleted: false,
            });

            const promise = client.submitPassword({
                correlationId,
                continuationState,
                newPassword: "P@ssw0rd!",
            });
            const assertion = expect(promise).rejects.toMatchObject({
                code: RESET_PASSWORD_TIMEOUT,
            });

            // Drive all inter-attempt delays (4 gaps across 5 attempts).
            await jest.advanceTimersByTimeAsync(1500 * 5);
            await assertion;

            expect(apiClient.poll).toHaveBeenCalledTimes(5);
        });

        it("throws when the continuation is missing the update link", async () => {
            await expect(
                client.submitPassword({
                    correlationId,
                    continuationState: {
                        ...continuationState,
                        links: {},
                    },
                    newPassword: "P@ssw0rd!",
                })
            ).rejects.toThrow();

            expect(apiClient.submitNewPassword).not.toHaveBeenCalled();
        });
    });

    describe("signInAfterReset", () => {
        const continuationState: V2FlowContinuationState = {
            correlationId,
            continuationToken: "ct-complete",
            scenario: "resetPassword",
            links: { continue: "https://endpoint/continue" },
        };

        const tokenResponse = {
            token_type: "Bearer",
            expires_in: 3600,
            access_token: "at",
            refresh_token: "rt",
            scope: "openid profile offline_access",
            id_token: "id",
            client_info: "ci",
        };

        // The account/cache building is msal-common's concern; stub the shared handler so the test
        // covers only this client's wiring (redeem -> handle -> completed envelope).
        const fakeAuthResult = { account: { homeAccountId: "uid.utid" } };

        it("redeems the continuation and returns a completed result with default scopes", async () => {
            apiClient.completeWithTokens.mockResolvedValue(tokenResponse);
            const handleSpy = jest
                .spyOn(
                    client as unknown as {
                        handleTokenResponse: (...args: unknown[]) => Promise<unknown>;
                    },
                    "handleTokenResponse"
                )
                .mockResolvedValue(fakeAuthResult);

            const result = await client.signInAfterReset({
                correlationId,
                continuationState,
            });

            expect(apiClient.completeWithTokens).toHaveBeenCalledWith(
                "ct-complete",
                ["openid", "profile", "offline_access"],
                expect.objectContaining({ correlationId }),
                undefined
            );
            expect(handleSpy).toHaveBeenCalledWith(
                tokenResponse,
                ["openid", "profile", "offline_access"],
                correlationId,
                expect.any(Number)
            );

            expect(result.type).toBe(V2_FLOW_COMPLETED);
            const completed = result as V2FlowCompletedResult;
            expect(completed.correlationId).toBe(correlationId);
            expect(completed.authenticationResult).toBe(fakeAuthResult);
        });

        it("forwards caller-supplied scopes and claims", async () => {
            apiClient.completeWithTokens.mockResolvedValue(tokenResponse);
            jest.spyOn(
                client as unknown as {
                    handleTokenResponse: (...args: unknown[]) => Promise<unknown>;
                },
                "handleTokenResponse"
            ).mockResolvedValue(fakeAuthResult);

            await client.signInAfterReset({
                correlationId,
                continuationState,
                scopes: ["User.Read"],
                claims: '{"id_token":{}}',
            });

            expect(apiClient.completeWithTokens).toHaveBeenCalledWith(
                "ct-complete",
                ["User.Read"],
                expect.objectContaining({ correlationId }),
                '{"id_token":{}}'
            );
        });
    });
});


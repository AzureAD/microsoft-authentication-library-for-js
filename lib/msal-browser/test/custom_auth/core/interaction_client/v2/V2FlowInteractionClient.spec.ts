/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StubbedNetworkModule } from "@azure/msal-common/browser";
import { V2FlowInteractionClient } from "../../../../../src/custom_auth/core/interaction_client/v2/V2FlowInteractionClient.js";
import {
    V2_FLOW_METHOD_SELECTION_REQUIRED,
    V2_FLOW_CODE_REQUIRED,
    V2_FLOW_PASSWORD_REQUIRED,
    V2_FLOW_SIGN_IN_CONTINUATION_REQUIRED,
    V2_FLOW_COMPLETED,
    V2FlowMethodSelectionRequiredResult,
    V2FlowCodeRequiredResult,
    V2FlowPasswordRequiredResult,
    V2FlowSignInContinuationRequiredResult,
    V2FlowCompletedResult,
} from "../../../../../src/custom_auth/core/interaction_client/v2/result/V2FlowActionResult.js";
import { V2FlowContinuationState } from "../../../../../src/custom_auth/core/interaction_client/v2/V2FlowContinuationState.js";
import { CustomAuthAuthority } from "../../../../../src/custom_auth/core/CustomAuthAuthority.js";
import { CustomAuthV2ApiClient } from "../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/CustomAuthV2ApiClient.js";
import { RESET_PASSWORD_TIMEOUT } from "../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/V2ErrorCodes.js";
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
            | "verifyChallenge"
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
            verifyChallenge: jest.fn(),
            submitNewPassword: jest.fn(),
            poll: jest.fn(),
            completeWithTokens: jest.fn(),
        } as unknown as jest.Mocked<
            Pick<
                CustomAuthV2ApiClient,
                | "resetPasswordStart"
                | "requestChallenge"
                | "verifyChallenge"
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
        it("runs the entry and returns a method-selection result without sending a challenge", async () => {
            apiClient.resetPasswordStart.mockResolvedValue({
                continuationToken: "ct-start",
                methods: [
                    {
                        id: "email",
                        type: "email",
                        hint: "u***@contoso.com",
                        challengeHref: "https://endpoint/challenge",
                    },
                ],
            });

            const result = await client.resetPassword({
                correlationId,
                username: "user@contoso.com",
            });

            expect(apiClient.resetPasswordStart).toHaveBeenCalledWith(
                "user@contoso.com",
                expect.objectContaining({ correlationId })
            );
            expect(apiClient.requestChallenge).not.toHaveBeenCalled();

            expect(result.type).toBe(V2_FLOW_METHOD_SELECTION_REQUIRED);

            const methodSelection =
                result as V2FlowMethodSelectionRequiredResult;
            expect(methodSelection.correlationId).toBe(correlationId);
            expect(methodSelection.methods).toEqual([
                {
                    id: "email",
                    type: "email",
                    hint: "u***@contoso.com",
                    challengeHref: "https://endpoint/challenge",
                },
            ]);
            expect(methodSelection.continuationState).toEqual({
                continuationToken: "ct-start",
                scenario: "passwordReset",
                links: {},
            });
        });
    });

    describe("requestChallenge", () => {
        const continuationState: V2FlowContinuationState = {
            continuationToken: "ct-start",
            scenario: "passwordReset",
            links: { challenge: "https://endpoint/challenge" },
        };

        it("posts the selected method's challenge href and returns a code-required result", async () => {
            apiClient.requestChallenge.mockResolvedValue({
                continuationToken: "ct-challenge",
                verifyHref: "https://endpoint/verify",
                resendHref: "https://endpoint/resend",
                codeLength: 6,
                hint: "u***@contoso.com",
                channel: "email",
            });

            const result = await client.requestChallenge({
                correlationId,
                continuationState,
            });

            expect(apiClient.requestChallenge).toHaveBeenCalledWith(
                "https://endpoint/challenge",
                { continuationToken: "ct-start" },
                expect.objectContaining({ correlationId })
            );

            expect(result.type).toBe(V2_FLOW_CODE_REQUIRED);

            const codeRequired = result as V2FlowCodeRequiredResult;
            expect(codeRequired.codeLength).toBe(6);
            expect(codeRequired.sentTo).toBe("u***@contoso.com");
            expect(codeRequired.channel).toBe("email");
            expect(codeRequired.continuationState).toEqual({
                continuationToken: "ct-challenge",
                scenario: "passwordReset",
                links: {
                    verify: "https://endpoint/verify",
                    resend: "https://endpoint/resend",
                },
            });
        });

        it("throws when the continuation is missing the challenge link", async () => {
            await expect(
                client.requestChallenge({
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

    describe("submitCode", () => {
        const continuationState: V2FlowContinuationState = {
            continuationToken: "ct-challenge",
            scenario: "passwordReset",
            links: {
                verify: "https://endpoint/verify",
                resend: "https://endpoint/resend",
            },
        };

        it("verifies the code and returns a password-required result", async () => {
            apiClient.verifyChallenge.mockResolvedValue({
                nextAction: "update",
                continuationToken: "ct-verify",
                updateHref: "https://endpoint/update",
            });

            const result = await client.submitCode({
                correlationId,
                continuationState,
                code: "123456",
            });

            expect(apiClient.verifyChallenge).toHaveBeenCalledWith(
                "https://endpoint/verify",
                { continuationToken: "ct-challenge", otp: "123456" },
                expect.objectContaining({ correlationId })
            );

            expect(result.type).toBe(V2_FLOW_PASSWORD_REQUIRED);

            const passwordRequired = result as V2FlowPasswordRequiredResult;
            expect(passwordRequired.correlationId).toBe(correlationId);
            expect(passwordRequired.continuationState).toEqual({
                continuationToken: "ct-verify",
                scenario: "passwordReset",
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

            expect(apiClient.verifyChallenge).not.toHaveBeenCalled();
        });
    });

    describe("resendCode", () => {
        const continuationState: V2FlowContinuationState = {
            continuationToken: "ct-challenge",
            scenario: "passwordReset",
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
                continuationToken: "ct-challenge-2",
                scenario: "passwordReset",
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
            continuationToken: "ct-verify",
            scenario: "passwordReset",
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

            expect(result.type).toBe(V2_FLOW_SIGN_IN_CONTINUATION_REQUIRED);

            const signInRequired =
                result as V2FlowSignInContinuationRequiredResult;
            expect(signInRequired.correlationId).toBe(correlationId);
            expect(signInRequired.continuationState).toEqual({
                continuationToken: "ct-complete",
                scenario: "passwordReset",
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
            expect(result.type).toBe(V2_FLOW_SIGN_IN_CONTINUATION_REQUIRED);
        });

        it("follows a relocated poll href returned by an in-progress response", async () => {
            jest.useFakeTimers();
            apiClient.submitNewPassword.mockResolvedValue({
                continuationToken: "ct-update",
                pollHref: "https://endpoint/poll",
            });
            apiClient.poll
                .mockResolvedValueOnce({
                    continuationToken: "ct-poll-1",
                    isCompleted: false,
                    pollHref: "https://endpoint/poll-relocated",
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

            await jest.advanceTimersByTimeAsync(1500);
            const result = await promise;

            expect(apiClient.poll).toHaveBeenCalledTimes(2);
            // First poll targets the update-supplied href.
            expect(apiClient.poll).toHaveBeenNthCalledWith(
                1,
                "https://endpoint/poll",
                { continuationToken: "ct-update" },
                expect.objectContaining({ correlationId })
            );
            // Second poll targets the relocated href with the refreshed token.
            expect(apiClient.poll).toHaveBeenNthCalledWith(
                2,
                "https://endpoint/poll-relocated",
                { continuationToken: "ct-poll-1" },
                expect.objectContaining({ correlationId })
            );
            expect(result.type).toBe(V2_FLOW_SIGN_IN_CONTINUATION_REQUIRED);
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
                error: RESET_PASSWORD_TIMEOUT,
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

    describe("signInWithContinuation", () => {
        const continuationState: V2FlowContinuationState = {
            continuationToken: "ct-complete",
            scenario: "passwordReset",
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
                        handleTokenResponse: (
                            ...args: unknown[]
                        ) => Promise<unknown>;
                    },
                    "handleTokenResponse"
                )
                .mockResolvedValue(fakeAuthResult);

            const result = await client.signInWithContinuation({
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

        it("unions caller-supplied scopes with the default OIDC scopes and forwards claims", async () => {
            apiClient.completeWithTokens.mockResolvedValue(tokenResponse);
            jest.spyOn(
                client as unknown as {
                    handleTokenResponse: (
                        ...args: unknown[]
                    ) => Promise<unknown>;
                },
                "handleTokenResponse"
            ).mockResolvedValue(fakeAuthResult);

            await client.signInWithContinuation({
                correlationId,
                continuationState,
                scopes: ["User.Read"],
                claims: '{"id_token":{}}',
            });

            expect(apiClient.completeWithTokens).toHaveBeenCalledWith(
                "ct-complete",
                ["User.Read", "openid", "profile", "offline_access"],
                expect.objectContaining({ correlationId }),
                '{"id_token":{}}'
            );
        });

        it("does not duplicate default OIDC scopes the caller already supplied", async () => {
            apiClient.completeWithTokens.mockResolvedValue(tokenResponse);
            jest.spyOn(
                client as unknown as {
                    handleTokenResponse: (
                        ...args: unknown[]
                    ) => Promise<unknown>;
                },
                "handleTokenResponse"
            ).mockResolvedValue(fakeAuthResult);

            await client.signInWithContinuation({
                correlationId,
                continuationState,
                scopes: ["User.Read", "OpenID", "offline_access"],
            });

            expect(apiClient.completeWithTokens).toHaveBeenCalledWith(
                "ct-complete",
                ["User.Read", "OpenID", "offline_access", "profile"],
                expect.objectContaining({ correlationId }),
                undefined
            );
        });
    });
});

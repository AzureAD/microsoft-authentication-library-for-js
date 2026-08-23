/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger, StubbedNetworkModule } from "@azure/msal-common/browser";
import { FlowInteractionClientV2 } from "../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import {
    FLOW_METHOD_SELECTION_REQUIRED_V2,
    FLOW_CODE_REQUIRED_V2,
    FLOW_PASSWORD_REQUIRED_V2,
    FLOW_MFA_REQUIRED_V2,
    FLOW_NEW_PASSWORD_REQUIRED_V2,
    FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2,
    FLOW_COMPLETED_V2,
    FlowMethodSelectionRequiredResultV2,
    FlowCodeRequiredResultV2,
    FlowPasswordRequiredResultV2,
    FlowMFARequiredResultV2,
    FlowNewPasswordRequiredResultV2,
    FlowSignInContinuationRequiredResultV2,
    FlowCompletedResultV2,
} from "../../../../../src/custom_auth/core/interaction_client/v2/result/FlowActionResultV2.js";
import { FlowContinuationStateV2 } from "../../../../../src/custom_auth/core/interaction_client/v2/FlowContinuationStateV2.js";
import { CustomAuthAuthority } from "../../../../../src/custom_auth/core/CustomAuthAuthority.js";
import { CustomAuthApiClientV2 } from "../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/CustomAuthApiClientV2.js";
import { RESET_PASSWORD_TIMEOUT } from "../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/ErrorCodesV2.js";
import {
    RESET_PASSWORD_UNSUPPORTED,
    SIGN_IN_UNSUPPORTED,
    UNEXPECTED_AUTHENTICATION_FACTOR,
} from "../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/ErrorCodesV2.js";
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

describe("FlowInteractionClientV2", () => {
    let client: FlowInteractionClientV2;
    let logger: Logger;
    let apiClient: jest.Mocked<
        Pick<
            CustomAuthApiClientV2,
            | "authorizeChallengeStart"
            | "resetPasswordStart"
            | "signInStart"
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
        logger = getDefaultLogger();
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
            authorizeChallengeStart: jest.fn(),
            resetPasswordStart: jest.fn(),
            signInStart: jest.fn(),
            requestChallenge: jest.fn(),
            verifyChallenge: jest.fn(),
            submitNewPassword: jest.fn(),
            poll: jest.fn(),
            completeWithTokens: jest.fn(),
        } as unknown as jest.Mocked<
            Pick<
                CustomAuthApiClientV2,
                | "authorizeChallengeStart"
                | "resetPasswordStart"
                | "signInStart"
                | "requestChallenge"
                | "verifyChallenge"
                | "submitNewPassword"
                | "poll"
                | "completeWithTokens"
            >
        >;

        client = new FlowInteractionClientV2(
            config,
            cacheManager,
            crypto,
            logger,
            eventHandler,
            getDefaultNavigationClient(),
            performanceClient,
            authority,
            apiClient as unknown as CustomAuthApiClientV2
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    describe("signIn", () => {
        it("selects the first password method and returns password-required with token inputs", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
                signInHref: "https://endpoint/sign-in",
            });
            apiClient.signInStart.mockResolvedValue({
                continuationToken: "ct-sign-in",
                authenticationFactor: "singleFactor",
                methods: [
                    {
                        id: "password-1",
                        type: "password",
                        challengeHref: "https://endpoint/password/challenge",
                    },
                    {
                        id: "other-1",
                        type: "other",
                        challengeHref: "https://endpoint/other/challenge",
                    },
                ],
            });
            apiClient.requestChallenge.mockResolvedValue({
                continuationToken: "ct-challenge",
                verifyHref: "https://endpoint/password/verify",
                type: "password",
            });

            const result = await client.signIn({
                correlationId,
                username: "user@contoso.com",
                scopes: ["User.Read"],
                claims: '{"id_token":{}}',
            });

            expect(apiClient.authorizeChallengeStart).toHaveBeenCalledWith(
                expect.objectContaining({ correlationId })
            );
            expect(apiClient.signInStart).toHaveBeenCalledWith(
                "https://endpoint/sign-in",
                {
                    continuationToken: "ct-entry",
                    username: "user@contoso.com",
                },
                expect.objectContaining({ correlationId })
            );
            expect(apiClient.requestChallenge).toHaveBeenCalledWith(
                "https://endpoint/password/challenge",
                { continuationToken: "ct-sign-in" },
                expect.objectContaining({ correlationId })
            );
            expect(result.type).toBe(FLOW_PASSWORD_REQUIRED_V2);

            const passwordRequired = result as FlowPasswordRequiredResultV2;
            expect(passwordRequired.continuationState).toEqual({
                continuationToken: "ct-challenge",
                scenario: "signIn",
                links: {
                    challenge: "https://endpoint/password/challenge",
                    verify: "https://endpoint/password/verify",
                    resend: undefined,
                },
                tokenRequest: {
                    scopes: ["User.Read"],
                    claims: '{"id_token":{}}',
                },
            });
        });

        it("fails when sign-in start does not offer a password method", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
                signInHref: "https://endpoint/sign-in",
            });
            apiClient.signInStart.mockResolvedValue({
                continuationToken: "ct-sign-in",
                authenticationFactor: "singleFactor",
                methods: [
                    {
                        id: "other-1",
                        type: "other",
                        challengeHref: "https://endpoint/other/challenge",
                    },
                ],
            });

            await expect(
                client.signIn({
                    correlationId,
                    username: "user@contoso.com",
                })
            ).rejects.toMatchObject({ error: SIGN_IN_UNSUPPORTED });

            expect(apiClient.requestChallenge).not.toHaveBeenCalled();
        });

        it("returns MFA-required after automatically submitting a password", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
                signInHref: "https://endpoint/sign-in",
            });
            apiClient.signInStart.mockResolvedValue({
                continuationToken: "ct-sign-in",
                authenticationFactor: "singleFactor",
                methods: [
                    {
                        id: "password-1",
                        type: "password",
                        challengeHref: "https://endpoint/password/challenge",
                    },
                ],
            });
            apiClient.requestChallenge.mockResolvedValue({
                continuationToken: "ct-password",
                verifyHref: "https://endpoint/password/verify",
                type: "password",
            });
            apiClient.verifyChallenge.mockResolvedValue({
                nextAction: "challenge",
                continuationToken: "ct-mfa",
                authenticationFactor: "multiFactor",
                methods: [
                    {
                        id: "email-mfa",
                        type: "email",
                        hint: "u***@contoso.com",
                        challengeHref: "https://endpoint/mfa/challenge",
                    },
                ],
            });

            const result = await client.signIn({
                correlationId,
                username: "user@contoso.com",
                password: "P@ssword1!",
                scopes: ["User.Read"],
                claims: '{"access_token":{}}',
            });

            expect(result.type).toBe(FLOW_MFA_REQUIRED_V2);
            expect(apiClient.completeWithTokens).not.toHaveBeenCalled();

            const mfaRequired = result as FlowMFARequiredResultV2;
            expect(mfaRequired.methods).toEqual([
                {
                    id: "email-mfa",
                    type: "email",
                    hint: "u***@contoso.com",
                    challengeHref: "https://endpoint/mfa/challenge",
                },
            ]);
            expect(mfaRequired.continuationState).toEqual({
                continuationToken: "ct-mfa",
                scenario: "signIn",
                links: {},
                tokenRequest: {
                    scopes: ["User.Read"],
                    claims: '{"access_token":{}}',
                },
            });
        });

        it("rejects an MFA challenge with a non-MFA authentication factor", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
                signInHref: "https://endpoint/sign-in",
            });
            apiClient.signInStart.mockResolvedValue({
                continuationToken: "ct-sign-in",
                authenticationFactor: "singleFactor",
                methods: [
                    {
                        id: "password-1",
                        type: "password",
                        challengeHref: "https://endpoint/password/challenge",
                    },
                ],
            });
            apiClient.requestChallenge.mockResolvedValue({
                continuationToken: "ct-password",
                verifyHref: "https://endpoint/password/verify",
                type: "password",
            });
            apiClient.verifyChallenge.mockResolvedValue({
                nextAction: "challenge",
                continuationToken: "ct-mfa",
                authenticationFactor: "singleFactor",
                methods: [
                    {
                        id: "email-mfa",
                        type: "email",
                        challengeHref: "https://endpoint/mfa/challenge",
                    },
                ],
            });

            await expect(
                client.signIn({
                    correlationId,
                    username: "user@contoso.com",
                    password: "P@ssword1!",
                })
            ).rejects.toMatchObject({
                error: UNEXPECTED_AUTHENTICATION_FACTOR,
            });
        });

        it("rejects a missing sign-in link before calling sign-in start", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
            });

            await expect(
                client.signIn({
                    correlationId,
                    username: "user@contoso.com",
                })
            ).rejects.toMatchObject({ error: SIGN_IN_UNSUPPORTED });

            expect(apiClient.signInStart).not.toHaveBeenCalled();
        });
    });

    describe("resetPassword", () => {
        it("runs the entry and returns a method-selection result without sending a challenge", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
                resetPasswordHref: "https://endpoint/reset-password",
            });
            apiClient.resetPasswordStart.mockResolvedValue({
                continuationToken: "ct-start",
                authenticationFactor: "singleFactor",
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

            expect(apiClient.authorizeChallengeStart).toHaveBeenCalledWith(
                expect.objectContaining({ correlationId })
            );
            expect(apiClient.resetPasswordStart).toHaveBeenCalledWith(
                "https://endpoint/reset-password",
                {
                    username: "user@contoso.com",
                    continuationToken: "ct-entry",
                },
                expect.objectContaining({ correlationId })
            );
            expect(apiClient.requestChallenge).not.toHaveBeenCalled();

            expect(result.type).toBe(FLOW_METHOD_SELECTION_REQUIRED_V2);

            const methodSelection =
                result as FlowMethodSelectionRequiredResultV2;
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

        it("rejects a missing reset-password link before calling reset-password start", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
            });

            await expect(
                client.resetPassword({
                    correlationId,
                    username: "user@contoso.com",
                })
            ).rejects.toMatchObject({
                error: RESET_PASSWORD_UNSUPPORTED,
            });

            expect(apiClient.resetPasswordStart).not.toHaveBeenCalled();
        });
    });

    describe("requestChallenge", () => {
        const continuationState: FlowContinuationStateV2 = {
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
                type: "email",
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

            expect(result.type).toBe(FLOW_CODE_REQUIRED_V2);

            const codeRequired = result as FlowCodeRequiredResultV2;
            expect(codeRequired.codeLength).toBe(6);
            expect(codeRequired.sentTo).toBe("u***@contoso.com");
            expect(codeRequired.channel).toBe("email");
            expect(codeRequired.continuationState).toEqual({
                continuationToken: "ct-challenge",
                scenario: "passwordReset",
                links: {
                    challenge: "https://endpoint/challenge",
                    verify: "https://endpoint/verify",
                    resend: "https://endpoint/resend",
                },
            });
        });

        it("returns a password-required result for a password challenge", async () => {
            apiClient.requestChallenge.mockResolvedValue({
                continuationToken: "ct-challenge",
                verifyHref: "https://endpoint/verify",
                type: "password",
            });

            const result = await client.requestChallenge({
                correlationId,
                continuationState,
            });

            expect(result.type).toBe(FLOW_PASSWORD_REQUIRED_V2);

            const passwordRequired = result as FlowPasswordRequiredResultV2;
            expect(passwordRequired.continuationState).toEqual({
                continuationToken: "ct-challenge",
                scenario: "passwordReset",
                links: {
                    challenge: "https://endpoint/challenge",
                    verify: "https://endpoint/verify",
                    resend: undefined,
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
        const continuationState: FlowContinuationStateV2 = {
            continuationToken: "ct-challenge",
            scenario: "passwordReset",
            links: {
                challenge: "https://endpoint/challenge",
                verify: "https://endpoint/verify",
                resend: "https://endpoint/resend",
            },
        };

        it("verifies the code and returns a new-password-required result", async () => {
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

            expect(result.type).toBe(FLOW_NEW_PASSWORD_REQUIRED_V2);

            const newPasswordRequired =
                result as FlowNewPasswordRequiredResultV2;
            expect(newPasswordRequired.correlationId).toBe(correlationId);
            expect(newPasswordRequired.continuationState).toEqual({
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

        it("logs an error when verification returns an unexpected next action", async () => {
            const errorSpy = jest.spyOn(
                Reflect.get(client, "logger") as Logger,
                "error"
            );
            apiClient.verifyChallenge.mockResolvedValue({
                nextAction: "continue",
                continuationToken: "ct-verify",
            });

            await expect(
                client.submitCode({
                    correlationId,
                    continuationState,
                    code: "123456",
                })
            ).rejects.toThrow();

            expect(errorSpy).toHaveBeenCalledWith(
                "Verification next action 'continue' is not supported for the current flow.",
                correlationId
            );
        });
    });

    describe("resendCode", () => {
        const continuationState: FlowContinuationStateV2 = {
            continuationToken: "ct-challenge",
            scenario: "passwordReset",
            links: {
                challenge: "https://endpoint/challenge",
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
                type: "email",
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

            expect(result.type).toBe(FLOW_CODE_REQUIRED_V2);

            const codeRequired = result as FlowCodeRequiredResultV2;
            expect(codeRequired.correlationId).toBe(correlationId);
            expect(codeRequired.codeLength).toBe(8);
            expect(codeRequired.sentTo).toBe("u***@contoso.com");
            expect(codeRequired.channel).toBe("email");
            expect(codeRequired.continuationState).toEqual({
                continuationToken: "ct-challenge-2",
                scenario: "passwordReset",
                links: {
                    challenge: "https://endpoint/challenge",
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

    describe("submitNewPassword", () => {
        const continuationState: FlowContinuationStateV2 = {
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

            const result = await client.submitNewPassword({
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

            expect(result.type).toBe(FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2);

            const signInRequired =
                result as FlowSignInContinuationRequiredResultV2;
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

            const promise = client.submitNewPassword({
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
            expect(result.type).toBe(FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2);
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

            const promise = client.submitNewPassword({
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
            expect(result.type).toBe(FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2);
        });
        it("throws a timeout error when polling never completes", async () => {
            jest.useFakeTimers();
            const errorSpy = jest.spyOn(
                Reflect.get(client, "logger") as Logger,
                "error"
            );
            apiClient.submitNewPassword.mockResolvedValue({
                continuationToken: "ct-update",
                pollHref: "https://endpoint/poll",
            });
            apiClient.poll.mockResolvedValue({
                continuationToken: "ct-poll",
                isCompleted: false,
            });

            const promise = client.submitNewPassword({
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
            expect(errorSpy).toHaveBeenCalledWith(
                "The password reset did not complete within the allotted number of polling attempts.",
                correlationId
            );
        });

        it("throws when the continuation is missing the update link", async () => {
            await expect(
                client.submitNewPassword({
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
        const continuationState: FlowContinuationStateV2 = {
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
                {
                    continuationToken: "ct-complete",
                    scopes: ["openid", "profile", "offline_access"],
                    claims: undefined,
                },
                expect.objectContaining({ correlationId })
            );
            expect(handleSpy).toHaveBeenCalledWith(
                tokenResponse,
                ["openid", "profile", "offline_access"],
                correlationId,
                expect.any(Number)
            );

            expect(result.type).toBe(FLOW_COMPLETED_V2);
            const completed = result as FlowCompletedResultV2;
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
                {
                    continuationToken: "ct-complete",
                    scopes: [
                        "User.Read",
                        "openid",
                        "profile",
                        "offline_access",
                    ],
                    claims: '{"id_token":{}}',
                },
                expect.objectContaining({ correlationId })
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
                {
                    continuationToken: "ct-complete",
                    scopes: [
                        "User.Read",
                        "OpenID",
                        "offline_access",
                        "profile",
                    ],
                    claims: undefined,
                },
                expect.objectContaining({ correlationId })
            );
        });
    });
});

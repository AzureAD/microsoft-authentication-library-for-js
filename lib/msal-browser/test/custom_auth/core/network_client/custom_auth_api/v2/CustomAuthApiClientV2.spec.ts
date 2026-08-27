/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerTelemetryManager } from "@azure/msal-common/browser";
import { CustomAuthApiClientV2 } from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/CustomAuthApiClientV2.js";
import { CustomAuthError } from "../../../../../../src/custom_auth/core/error/CustomAuthError.js";
import { CustomAuthApiError } from "../../../../../../src/custom_auth/core/error/CustomAuthApiError.js";
import {
    REDIRECT_TO_WEB,
    CONTINUATION_TOKEN_MISSING,
    INVALID_HAL_RESPONSE,
    NO_AUTHENTICATION_METHODS,
    UNEXPECTED_AUTHENTICATION_FACTOR,
} from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/ErrorCodesV2.js";
import { HttpMethod } from "../../../../../../src/custom_auth/core/network_client/http_client/IHttpClient.js";

const mockTelemetryManager = {
    generateCurrentRequestHeaderValue: jest.fn(() => "cur"),
    generateLastRequestHeaderValue: jest.fn(() => "last"),
} as unknown as ServerTelemetryManager;

const CLIENT_ID = "client-id-123";
const BASE_URL =
    "https://nativeauthasampleapp.ciamlogin.com/nativeauthasampleapp.onmicrosoft.com";
const RESET_PASSWORD_HREF = "/tenant/api/v0.1/auth/resetpassword?dc=X";

const buildResponse = (
    body: unknown,
    status = 200,
    headers: Record<string, string> = { "x-ms-request-id": "corr-1" }
): Response =>
    ({
        status,
        headers: {
            get: (name: string) => headers[name] ?? null,
        },
        json: async () => body,
    } as unknown as Response);

describe("CustomAuthApiClientV2", () => {
    let mockHttpClient: { sendAsync: jest.Mock };
    let apiClient: CustomAuthApiClientV2;

    const context = {
        correlationId: "corr-1",
        telemetryManager: mockTelemetryManager,
    };

    beforeEach(() => {
        mockHttpClient = { sendAsync: jest.fn() };
        apiClient = new CustomAuthApiClientV2(
            BASE_URL,
            CLIENT_ID,
            mockHttpClient as any
        );
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe("authorizeChallengeStart", () => {
        it("returns the continuation token and flow links", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuation_token: "ct-entry",
                    reset_password: RESET_PASSWORD_HREF,
                })
            );

            await expect(
                apiClient.authorizeChallengeStart(context)
            ).resolves.toEqual({
                continuationToken: "ct-entry",
                resetPasswordHref: RESET_PASSWORD_HREF,
            });
        });

        it("throws the normalized server error when the entry has no continuation token", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse(
                    {
                        error: "invalid_request",
                        error_description: "bad client",
                    },
                    400
                )
            );

            await expect(
                apiClient.authorizeChallengeStart(context)
            ).rejects.toMatchObject({ error: "invalid_request" });
        });

        it("throws CONTINUATION_TOKEN_MISSING when the entry has neither token nor error", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({}, 400)
            );

            await expect(
                apiClient.authorizeChallengeStart(context)
            ).rejects.toMatchObject({
                error: CONTINUATION_TOKEN_MISSING,
            });
        });
    });

    describe("resetPasswordStart", () => {
        const request = {
            username: "user@test.com",
            continuationToken: "ct-entry",
        };

        it("throws NO_AUTHENTICATION_METHODS when the start response advertises no embedded methods", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-start",
                    _links: {
                        challenge: { href: "/tenant/api/v0.1/challenge" },
                    },
                })
            );

            await expect(
                apiClient.resetPasswordStart(
                    RESET_PASSWORD_HREF,
                    request,
                    context
                )
            ).rejects.toMatchObject({ error: NO_AUTHENTICATION_METHODS });
        });

        it("prefers the challenge href on an embedded method", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-start",
                    challengeContext: {
                        authenticationFactor: "singleFactor",
                    },
                    scenario: "recovery",
                    _embedded: {
                        methods: [
                            {
                                _links: {
                                    challenge: {
                                        href: "/tenant/api/v0.1/methods/email/challenge",
                                    },
                                },
                            },
                        ],
                    },
                    _links: {
                        challenge: { href: "/tenant/api/v0.1/top-level" },
                    },
                })
            );

            const result = await apiClient.resetPasswordStart(
                RESET_PASSWORD_HREF,
                request,
                context
            );

            expect(result.continuationToken).toBe("ct-start");
            expect(result.scenario).toBe("recovery");
            expect(result.authenticationFactor).toBe("singleFactor");
            expect(result.methods[0].challengeHref).toBe(
                "/tenant/api/v0.1/methods/email/challenge"
            );

            expect(mockHttpClient.sendAsync).toHaveBeenCalledTimes(1);
            const [startUrl] = mockHttpClient.sendAsync.mock.calls[0];
            expect(startUrl.href).toBe(
                "https://nativeauthasampleapp.ciamlogin.com/nativeauthasampleapp.onmicrosoft.com/api/v0.1/auth/resetpassword?dc=X"
            );
        });
    });

    describe("signInStart", () => {
        const request = {
            continuationToken: "ct-entry",
            username: "user@test.com",
        };

        it("returns the embedded authentication methods", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-start",
                    challengeContext: {
                        authenticationFactor: "singleFactor",
                    },
                    _embedded: {
                        methods: [
                            {
                                id: "password-1",
                                type: "password",
                                _links: {
                                    challenge: {
                                        href: "/tenant/api/v0.1/password/challenge",
                                    },
                                },
                            },
                        ],
                    },
                })
            );

            const result = await apiClient.signInStart(
                "/tenant/api/v0.1/signin/start",
                request,
                context
            );

            expect(result).toEqual({
                continuationToken: "ct-start",
                methods: [
                    {
                        id: "password-1",
                        type: "password",
                        hint: undefined,
                        challengeHref: "/tenant/api/v0.1/password/challenge",
                    },
                ],
                authenticationFactor: "singleFactor",
                scenario: undefined,
            });
            expect(mockHttpClient.sendAsync).toHaveBeenCalledTimes(1);

            const [startUrl, options] = mockHttpClient.sendAsync.mock.calls[0];
            expect(startUrl.href).toBe(
                "https://nativeauthasampleapp.ciamlogin.com/nativeauthasampleapp.onmicrosoft.com/api/v0.1/signin/start"
            );
            expect(options.method).toBe(HttpMethod.POST);
            expect(JSON.parse(options.body)).toEqual({
                ...request,
            });
        });

        it("returns a recognized multi-factor value", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-start",
                    challengeContext: {
                        authenticationFactor: "multiFactor",
                    },
                    _embedded: {
                        methods: [
                            {
                                id: "password-1",
                                type: "password",
                                _links: {
                                    challenge: {
                                        href: "/tenant/api/v0.1/password/challenge",
                                    },
                                },
                            },
                        ],
                    },
                })
            );

            await expect(
                apiClient.signInStart(
                    "/tenant/api/v0.1/signin/start",
                    request,
                    context
                )
            ).resolves.toMatchObject({
                authenticationFactor: "multiFactor",
            });
        });

        it.each([undefined, null, "", "unknownFactor"])(
            "rejects the authentication factor %s",
            async (authenticationFactor) => {
                mockHttpClient.sendAsync.mockResolvedValueOnce(
                    buildResponse({
                        continuationToken: "ct-start",
                        challengeContext: {
                            authenticationFactor,
                        },
                        _embedded: {
                            methods: [
                                {
                                    id: "password-1",
                                    type: "password",
                                    _links: {
                                        challenge: {
                                            href: "/tenant/api/v0.1/password/challenge",
                                        },
                                    },
                                },
                            ],
                        },
                    })
                );

                const startPromise = apiClient.signInStart(
                    "/tenant/api/v0.1/signin/start",
                    request,
                    context
                );

                await expect(startPromise).rejects.toMatchObject({
                    error: UNEXPECTED_AUTHENTICATION_FACTOR,
                });
                await expect(startPromise).rejects.toBeInstanceOf(
                    CustomAuthApiError
                );
            }
        );
    });

    describe("requestChallenge", () => {
        it("returns the verify href and challenge metadata", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-challenge",
                    type: "email",
                    codeLength: 6,
                    hint: "u***@test.com",
                    _links: {
                        verify: { href: "/tenant/api/v0.1/verify" },
                        resend: { href: "/tenant/api/v0.1/resend" },
                    },
                })
            );

            const result = await apiClient.requestChallenge(
                "/tenant/api/v0.1/challenge",
                { continuationToken: "ct-start" },
                context
            );

            expect(result).toEqual({
                continuationToken: "ct-challenge",
                type: "email",
                verifyHref: "/tenant/api/v0.1/verify",
                resendHref: "/tenant/api/v0.1/resend",
                codeLength: 6,
                hint: "u***@test.com",
            });
        });

        it("reads codeLength from the payload when not top-level", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-challenge",
                    payload: { codeLength: 8 },
                    _links: { verify: { href: "/tenant/api/v0.1/verify" } },
                })
            );

            const result = await apiClient.requestChallenge(
                "/tenant/api/v0.1/challenge",
                { continuationToken: "ct-start" },
                context
            );
            expect(result.codeLength).toBe(8);
            expect(result.codeLength).toBe(8);
        });

        it("maps a password challenge without OTP metadata", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-password",
                    id: "password-1",
                    type: "password",
                    _links: {
                        verify: { href: "/tenant/api/v0.1/password/verify" },
                        recover: {
                            href: "/tenant/api/v0.1/password/recover",
                        },
                        self: { href: "/tenant/api/v0.1/password/verify" },
                    },
                })
            );

            const result = await apiClient.requestChallenge(
                "/tenant/api/v0.1/password/challenge",
                { continuationToken: "ct-start" },
                context
            );

            expect(result).toEqual({
                continuationToken: "ct-password",
                type: "password",
                verifyHref: "/tenant/api/v0.1/password/verify",
                resendHref: undefined,
                codeLength: undefined,
                hint: undefined,
            });
        });
    });

    describe("verifyChallenge", () => {
        it("maps action:update to an update next-action", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-verify",
                    action: "update",
                    _links: { update: { href: "/tenant/api/v0.1/update" } },
                })
            );

            const result = await apiClient.verifyChallenge(
                "/tenant/api/v0.1/verify",
                { continuationToken: "ct-challenge", otp: "123456" },
                context
            );

            expect(result).toEqual({
                nextAction: "update",
                continuationToken: "ct-verify",
                updateHref: "/tenant/api/v0.1/update",
            });
        });

        it("maps state:continue to a continue next-action", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-verify",
                    state: "continue",
                })
            );

            const result = await apiClient.verifyChallenge(
                "/tenant/api/v0.1/verify",
                { continuationToken: "ct-challenge", otp: "123456" },
                context
            );

            expect(result).toEqual({
                nextAction: "continue",
                continuationToken: "ct-verify",
            });
        });

        it("maps a multi-factor challenge and its registered methods", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-mfa",
                    state: "interactionRequired",
                    action: "challenge",
                    challengeContext: {
                        authenticationFactor: "multiFactor",
                    },
                    _embedded: {
                        methods: [
                            {
                                id: "email-mfa",
                                type: "email",
                                hint: "u***@test.com",
                                _links: {
                                    challenge: {
                                        href: "/tenant/api/v0.1/mfa/challenge",
                                    },
                                },
                            },
                        ],
                    },
                })
            );

            const result = await apiClient.verifyChallenge(
                "/tenant/api/v0.1/password/verify",
                {
                    continuationToken: "ct-password",
                    password: "P@ssword1!",
                },
                context
            );

            expect(result).toEqual({
                nextAction: "challenge",
                continuationToken: "ct-mfa",
                authenticationFactor: "multiFactor",
                methods: [
                    {
                        id: "email-mfa",
                        type: "email",
                        hint: "u***@test.com",
                        challengeHref: "/tenant/api/v0.1/mfa/challenge",
                    },
                ],
            });
        });

        it("returns the single-factor value for a challenge", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-verify",
                    action: "challenge",
                    challengeContext: {
                        authenticationFactor: "singleFactor",
                    },
                    _embedded: {
                        methods: [
                            {
                                id: "email",
                                type: "email",
                                _links: {
                                    challenge: {
                                        href: "/tenant/api/v0.1/challenge",
                                    },
                                },
                            },
                        ],
                    },
                })
            );

            const result = await apiClient.verifyChallenge(
                "/tenant/api/v0.1/password/verify",
                {
                    continuationToken: "ct-password",
                    password: "P@ssword1!",
                },
                context
            );

            expect(result).toMatchObject({
                nextAction: "challenge",
                authenticationFactor: "singleFactor",
            });
        });

        it.each([undefined, null, "", "unknownFactor"])(
            "rejects challenge authentication factor %s",
            async (authenticationFactor) => {
                mockHttpClient.sendAsync.mockResolvedValueOnce(
                    buildResponse({
                        continuationToken: "ct-verify",
                        action: "challenge",
                        challengeContext: {
                            authenticationFactor,
                        },
                        _embedded: {
                            methods: [
                                {
                                    id: "email",
                                    type: "email",
                                    _links: {
                                        challenge: {
                                            href: "/tenant/api/v0.1/challenge",
                                        },
                                    },
                                },
                            ],
                        },
                    })
                );

                const verifyPromise = apiClient.verifyChallenge(
                    "/tenant/api/v0.1/password/verify",
                    {
                        continuationToken: "ct-password",
                        password: "P@ssword1!",
                    },
                    context
                );

                await expect(verifyPromise).rejects.toMatchObject({
                    error: UNEXPECTED_AUTHENTICATION_FACTOR,
                });
                await expect(verifyPromise).rejects.toBeInstanceOf(
                    CustomAuthApiError
                );
            }
        );

        it("rejects a multi-factor challenge without registered methods", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-verify",
                    action: "challenge",
                    challengeContext: {
                        authenticationFactor: "multiFactor",
                    },
                })
            );

            await expect(
                apiClient.verifyChallenge(
                    "/tenant/api/v0.1/password/verify",
                    {
                        continuationToken: "ct-password",
                        password: "P@ssword1!",
                    },
                    context
                )
            ).rejects.toMatchObject({
                error: NO_AUTHENTICATION_METHODS,
            });
        });

        it("throws INVALID_HAL_RESPONSE when verify returns no known next action", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-verify",
                    _links: { self: { href: "/tenant/api/v0.1/self" } },
                })
            );

            await expect(
                apiClient.verifyChallenge(
                    "/tenant/api/v0.1/verify",
                    { continuationToken: "ct-challenge", otp: "123456" },
                    context
                )
            ).rejects.toMatchObject({ error: INVALID_HAL_RESPONSE });
        });
    });

    describe("submitNewPassword", () => {
        it("PUTs the new password and returns the poll href", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-update",
                    _links: { poll: { href: "/tenant/api/v0.1/poll" } },
                })
            );

            const result = await apiClient.submitNewPassword(
                "/tenant/api/v0.1/update",
                { newPassword: "N3wP@ssw0rd", continuationToken: "ct-verify" },
                context
            );

            expect(result).toEqual({
                continuationToken: "ct-update",
                pollHref: "/tenant/api/v0.1/poll",
            });

            const [, options] = mockHttpClient.sendAsync.mock.calls[0];
            expect(options.method).toBe(HttpMethod.PUT);
        });
    });

    describe("poll", () => {
        it("reports completion with the continue href on state continue", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    state: "continue",
                    continuationToken: "ct-poll",
                    _links: {
                        continue: { href: "/tenant/api/v0.1/continue" },
                    },
                })
            );

            const result = await apiClient.poll(
                "/tenant/api/v0.1/poll",
                { continuationToken: "ct-update" },
                context
            );

            expect(result).toEqual({
                continuationToken: "ct-poll",
                isCompleted: true,
                continueHref: "/tenant/api/v0.1/continue",
            });
        });

        it("returns the refreshed poll href and reports not completed while in progress", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    state: "interactionRequired",
                    _links: {
                        poll: { href: "/tenant/api/v0.1/poll-next" },
                    },
                })
            );

            const result = await apiClient.poll(
                "/tenant/api/v0.1/poll",
                { continuationToken: "ct-update" },
                context
            );

            expect(result.isCompleted).toBe(false);
            expect(result.continuationToken).toBe("ct-update");
            expect(result.continueHref).toBeUndefined();
            expect(result.pollHref).toBe("/tenant/api/v0.1/poll-next");
        });
    });

    describe("web fallback and errors on HAL requests", () => {
        it("throws redirect_to_web when a HAL request requires web fallback", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({ state: "webFallbackRequired" })
            );

            await expect(
                apiClient.requestChallenge(
                    "/tenant/api/v0.1/challenge",
                    { continuationToken: "ct-start" },
                    context
                )
            ).rejects.toMatchObject({ error: REDIRECT_TO_WEB });
        });

        it("throws the normalized nested error on a failing HAL request", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse(
                    {
                        error: {
                            code: "invalid_grant",
                            message: "expired token",
                            innerError: { code: "otp_expired" },
                        },
                    },
                    400
                )
            );

            await expect(
                apiClient.verifyChallenge(
                    "/tenant/api/v0.1/verify",
                    { continuationToken: "ct-challenge", otp: "000000" },
                    context
                )
            ).rejects.toMatchObject({
                error: "invalid_grant",
                subError: "otp_expired",
            });
        });

        it("wraps a transport failure as an http_request_failed error", async () => {
            mockHttpClient.sendAsync.mockRejectedValueOnce(
                new Error("network down")
            );

            await expect(
                apiClient.requestChallenge(
                    "/tenant/api/v0.1/challenge",
                    { continuationToken: "ct-start" },
                    context
                )
            ).rejects.toBeInstanceOf(CustomAuthError);
        });

        it("throws continuation_token_missing before dispatching when the HAL request has no continuation token", async () => {
            await expect(
                apiClient.poll(
                    "/tenant/api/v0.1/poll",
                    { continuationToken: "" },
                    context
                )
            ).rejects.toMatchObject({
                error: CONTINUATION_TOKEN_MISSING,
            });

            expect(mockHttpClient.sendAsync).not.toHaveBeenCalled();
        });
    });

    describe("completeWithTokens", () => {
        it("redeems the continuation token for an authorization code then exchanges it for tokens", async () => {
            mockHttpClient.sendAsync
                .mockResolvedValueOnce(buildResponse({ code: "auth-code-1" }))
                .mockResolvedValueOnce(
                    buildResponse({
                        access_token: "access-1",
                        token_type: "Bearer",
                    })
                );

            const result = await apiClient.completeWithTokens(
                {
                    continuationToken: "ct-poll",
                    scopes: ["openid"],
                },
                context
            );

            expect(result.access_token).toBe("access-1");
            expect(mockHttpClient.sendAsync).toHaveBeenCalledTimes(2);
        });
    });
});

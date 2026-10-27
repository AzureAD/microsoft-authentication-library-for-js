/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerTelemetryManager } from "@azure/msal-common/browser";
import { CustomAuthApiClientV2 } from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/CustomAuthApiClientV2.js";
import { CustomAuthError } from "../../../../../../src/custom_auth/core/error/CustomAuthError.js";
import { CustomAuthApiError } from "../../../../../../src/custom_auth/core/error/CustomAuthApiError.js";
import {
    CONTINUATION_TOKEN_MISSING,
    INVALID_HAL_RESPONSE,
    NO_AUTHENTICATION_METHODS,
    UNEXPECTED_AUTHENTICATION_FACTOR,
} from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/ErrorCodesV2.js";
import { HttpMethod } from "../../../../../../src/custom_auth/core/network_client/http_client/IHttpClient.js";
import type { PollResponseV2 } from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/response/ResponsesV2.js";

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

        it("sends optional scopes and claims as form values", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuation_token: "ct-entry",
                    sign_up: "/tenant/api/v0.1/signup/start",
                })
            );

            await apiClient.authorizeChallengeStart(
                context,
                ["openid", "User.Read"],
                '{"access_token":{"acrs":{"value":"c4"}}}'
            );

            const [, options] = mockHttpClient.sendAsync.mock.calls[0];
            expect(options.body).toBeInstanceOf(URLSearchParams);
            expect((options.body as URLSearchParams).get("client_id")).toBe(
                "client-id-123"
            );
            expect((options.body as URLSearchParams).get("scope")).toBe(
                "openid User.Read"
            );
            expect((options.body as URLSearchParams).get("claims")).toBe(
                '{"access_token":{"acrs":{"value":"c4"}}}'
            );
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

        it("preserves web_redirect_required diagnostics on an OAuth failure", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse(
                    {
                        error: "invalid_grant",
                        error_description:
                            "AADSTS55214: Non-retryable error has occurred.",
                        error_codes: [55214],
                        timestamp: "2026-10-12 15:43:29Z",
                        trace_id: "c7fe3b84-3596-4d2d-a195-3aa21fb41100",
                        correlation_id: "c556852d-edfa-4040-b472-15a62de49ad5",
                        suberror: "web_redirect_required",
                    },
                    400
                )
            );

            await expect(
                apiClient.authorizeChallengeStart(context)
            ).rejects.toMatchObject({
                error: "invalid_grant",
                errorDescription:
                    "AADSTS55214: Non-retryable error has occurred.",
                errorCodes: [55214],
                subError: "web_redirect_required",
                correlationId: "c556852d-edfa-4040-b472-15a62de49ad5",
                traceId: "c7fe3b84-3596-4d2d-a195-3aa21fb41100",
                timestamp: "2026-10-12 15:43:29Z",
            });
        });

        it("accepts InsufficientAuthorization when the entry includes a continuation token", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    error: "InsufficientAuthorization",
                    error_description:
                        "AADSTS500127: No authenticated credentials found in request.",
                    error_codes: [500127],
                    timestamp: "2026-10-15 11:00:20Z",
                    trace_id: "6a72e163-b400-45c1-82d1-2ffe597f1c00",
                    correlation_id: "5bf14be2-24a1-425c-b8ea-6961b52105b9",
                    continuation_token: "ct-entry",
                    sign_in: "/tenant/api/v0.1/signin/start",
                })
            );

            await expect(
                apiClient.authorizeChallengeStart(context)
            ).resolves.toEqual({
                continuationToken: "ct-entry",
                resetPasswordHref: undefined,
                signInHref: "/tenant/api/v0.1/signin/start",
                signUpHref: undefined,
            });
        });

        it("throws InsufficientAuthorization when the entry has no continuation token", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse(
                    {
                        error: "InsufficientAuthorization",
                        error_description:
                            "AADSTS500127: No authenticated credentials found in request.",
                        error_codes: [500127],
                        timestamp: "2026-10-15 11:00:20Z",
                        trace_id: "6a72e163-b400-45c1-82d1-2ffe597f1c00",
                        correlation_id: "5bf14be2-24a1-425c-b8ea-6961b52105b9",
                    },
                    401
                )
            );

            await expect(
                apiClient.authorizeChallengeStart(context)
            ).rejects.toMatchObject({
                error: "InsufficientAuthorization",
                errorDescription:
                    "AADSTS500127: No authenticated credentials found in request.",
                errorCodes: [500127],
                correlationId: "5bf14be2-24a1-425c-b8ea-6961b52105b9",
                traceId: "6a72e163-b400-45c1-82d1-2ffe597f1c00",
                timestamp: "2026-10-15 11:00:20Z",
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

    describe("signUpStart", () => {
        const startResponse = {
            continuationToken: "ct-start",
            state: "interactionRequired",
            action: "verify",
            id: "email-1",
            type: "email",
            hint: "u***@contoso.com",
            codeLength: 8,
            _links: {
                verify: { href: "/tenant/api/v0.1/email/verify" },
                resend: { href: "/tenant/api/v0.1/email/resend" },
                self: { href: "/tenant/api/v0.1/email/verify" },
            },
        };

        it("sends the continuation token and username and returns the email challenge", async () => {
            const request = {
                continuationToken: "ct-entry",
                username: "user@contoso.com",
            };
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse(startResponse)
            );

            const result = await apiClient.signUpStart(
                "/tenant/api/v0.1/signup/start",
                request,
                context
            );

            expect(result).toEqual({
                nextAction: "verify",
                continuationToken: "ct-start",
                verifyHref: "/tenant/api/v0.1/email/verify",
                resendHref: "/tenant/api/v0.1/email/resend",
                type: "email",
                hint: "u***@contoso.com",
                codeLength: 8,
            });

            const [startUrl, options] = mockHttpClient.sendAsync.mock.calls[0];
            expect(startUrl.href).toBe(
                "https://nativeauthasampleapp.ciamlogin.com/nativeauthasampleapp.onmicrosoft.com/api/v0.1/signup/start"
            );
            expect(JSON.parse(options.body)).toEqual(request);
        });

        it("allows sign-up verification without a resend link", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    ...startResponse,
                    _links: { verify: startResponse._links.verify },
                })
            );

            await expect(
                apiClient.signUpStart(
                    "/tenant/api/v0.1/signup/start",
                    {
                        continuationToken: "ct-entry",
                        username: "user@contoso.com",
                    },
                    context
                )
            ).resolves.toMatchObject({
                nextAction: "verify",
                verifyHref: startResponse._links.verify.href,
                resendHref: undefined,
            });
        });

        it.each([
            [
                "collectAttributes",
                { ...startResponse, action: "collectAttributes" },
            ],
            ["continue", { ...startResponse, action: "continue" }],
            ["enroll", { ...startResponse, action: "enroll" }],
            ["unknown action", { ...startResponse, action: "unsupported" }],
            ["missing action", { ...startResponse, action: undefined }],
            [
                "missing verify link",
                {
                    ...startResponse,
                    _links: { resend: startResponse._links.resend },
                },
            ],
            [
                "malformed resend link",
                {
                    ...startResponse,
                    _links: {
                        verify: startResponse._links.verify,
                        resend: { href: "" },
                    },
                },
            ],
            ["invalid code length", { ...startResponse, codeLength: 0 }],
        ])("rejects %s in the start response", async (_, response) => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse(response)
            );

            await expect(
                apiClient.signUpStart(
                    "/tenant/api/v0.1/signup/start",
                    {
                        continuationToken: "ct-entry",
                        username: "user@contoso.com",
                    },
                    context
                )
            ).rejects.toMatchObject({ error: INVALID_HAL_RESPONSE });
        });

        it("rejects a start challenge without a continuation token", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    ...startResponse,
                    continuationToken: undefined,
                })
            );
            await expect(
                apiClient.signUpStart(
                    "/tenant/api/v0.1/signup/start",
                    {
                        continuationToken: "ct-entry",
                        username: "user@contoso.com",
                    },
                    context
                )
            ).rejects.toMatchObject({ error: CONTINUATION_TOKEN_MISSING });
        });
    });

    describe.each(["verification", "attribute submission"])(
        "sign-up collection after %s",
        (operation) => {
            it.each(["email", "EMAIL", "eMaIl"])(
                "rejects a requested %s attribute with an API error",
                async (attributeId) => {
                    mockHttpClient.sendAsync.mockResolvedValueOnce(
                        buildResponse({
                            continuationToken: "ct-collection",
                            action: "collectAttributes",
                            attributes: [{ attributeId, required: true }],
                            _links: {
                                submitAttributes: {
                                    href: "/signup/submitattributes",
                                },
                            },
                        })
                    );

                    const result =
                        operation === "verification"
                            ? apiClient.verifyChallenge(
                                  "/signup/verify",
                                  {
                                      continuationToken: "ct-start",
                                      otp: "12345678",
                                  },
                                  context
                              )
                            : apiClient.submitSignUpAttributes(
                                  "/signup/submitattributes",
                                  {
                                      continuationToken: "ct-attributes",
                                      attributes: { city: "Redmond" },
                                  },
                                  context
                              );

                    await expect(result).rejects.toMatchObject({
                        error: INVALID_HAL_RESPONSE,
                        correlationId: "corr-1",
                        errorDescription:
                            "Invalid HAL response: email cannot be collected as a sign-up attribute",
                    });
                }
            );
        }
    );

    describe("submitSignUpAttributes", () => {
        it("submits attributes and returns the issued email challenge", async () => {
            const request = {
                continuationToken: "ct-start",
                attributes: {
                    email: "user@test.com",
                    password: "valid-password",
                    displayName: "Test User",
                },
            };
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-submit",
                    state: "interactionRequired",
                    action: "verify",
                    id: "email-1",
                    type: "email",
                    hint: "u***@test.com",
                    codeLength: 8,
                    attributes: [
                        {
                            attributeId: "password",
                            inputType: "password",
                            required: true,
                        },
                    ],
                    _links: {
                        verify: {
                            href: "/tenant/api/v0.1/signup/verify",
                        },
                        resend: {
                            href: "/tenant/api/v0.1/signup/resend",
                        },
                    },
                })
            );

            const result = await apiClient.submitSignUpAttributes(
                "/tenant/api/v0.1/signup/submitattributes",
                request,
                context
            );

            expect(result).toEqual({
                nextAction: "verify",
                continuationToken: "ct-submit",
                type: "email",
                hint: "u***@test.com",
                codeLength: 8,
                verifyHref: "/tenant/api/v0.1/signup/verify",
                resendHref: "/tenant/api/v0.1/signup/resend",
                attributes: [
                    {
                        attributeId: "password",
                        inputType: "password",
                        required: true,
                    },
                ],
            });

            const [url, options] = mockHttpClient.sendAsync.mock.calls[0];
            expect(url.href).toBe(
                "https://nativeauthasampleapp.ciamlogin.com/nativeauthasampleapp.onmicrosoft.com/api/v0.1/signup/submitattributes"
            );
            expect(JSON.parse(options.body)).toEqual(request);
        });

        it("retains attribute-validation error details", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse(
                    {
                        error: {
                            code: "invalidRequest",
                            message:
                                "AADSTS1002027: Some of the collected attributes were invalid.",
                            correlationId: "corr-response",
                            innerError: {
                                code: "attributeValidationError",
                                details: [
                                    {
                                        attributeIds: ["email"],
                                        code: "attributeRequired",
                                        message:
                                            "Attribute 'email': is required.",
                                    },
                                ],
                            },
                        },
                    },
                    400
                )
            );

            await expect(
                apiClient.submitSignUpAttributes(
                    "/tenant/api/v0.1/signup/submitattributes",
                    {
                        continuationToken: "ct-start",
                        attributes: { email: "" },
                    },
                    context
                )
            ).rejects.toMatchObject({
                error: "invalidRequest",
                innerErrorCode: "attributeValidationError",
                correlationId: "corr-response",
                attributeValidationDetails: [
                    {
                        attributeIds: ["email"],
                        code: "attributeRequired",
                        message: "Attribute 'email': is required.",
                    },
                ],
            });
        });

        it("maps a repeated collect-attributes response", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-submit",
                    state: "interactionRequired",
                    action: "collectAttributes",
                    attributes: [
                        {
                            attributeId: "jobTitle",
                            inputType: "text",
                            required: true,
                        },
                    ],
                    _links: {
                        submitAttributes: {
                            href: "/tenant/api/v0.1/signup/submitattributes-2",
                        },
                    },
                })
            );

            const result = await apiClient.submitSignUpAttributes(
                "/tenant/api/v0.1/signup/submitattributes",
                {
                    continuationToken: "ct-start",
                    attributes: { city: "Redmond" },
                },
                context
            );

            expect(result).toEqual({
                nextAction: "collectAttributes",
                continuationToken: "ct-submit",
                attributes: [
                    {
                        attributeId: "jobTitle",
                        inputType: "text",
                        required: true,
                    },
                ],
                submitAttributesHref:
                    "/tenant/api/v0.1/signup/submitattributes-2",
            });
        });

        it("maps email and phone enrollment from sign-up attributes", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-enroll",
                    state: "interactionRequired",
                    action: "enroll",
                    _embedded: {
                        methods: [
                            {
                                type: "phone",
                                channels: ["sms"],
                                _links: {
                                    enroll: {
                                        href: "/tenant/api/v2.0/auth/methods/phone",
                                    },
                                },
                            },
                            {
                                type: "email",
                                _links: {
                                    enroll: {
                                        href: "/tenant/api/v2.0/auth/methods/email",
                                    },
                                },
                            },
                        ],
                    },
                })
            );

            await expect(
                apiClient.submitSignUpAttributes(
                    "/tenant/api/v2.0/auth/submitattributes",
                    {
                        continuationToken: "ct-start",
                        attributes: { email: "user@test.com" },
                    },
                    context
                )
            ).resolves.toEqual({
                nextAction: "enroll",
                continuationToken: "ct-enroll",
                methods: [
                    {
                        type: "phone",
                        channels: ["sms"],
                        enrollHref: "/tenant/api/v2.0/auth/methods/phone",
                    },
                    {
                        type: "email",
                        channels: undefined,
                        enrollHref: "/tenant/api/v2.0/auth/methods/email",
                    },
                ],
            });
        });

        it("rejects sign-up enrollment without embedded methods", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-enroll",
                    action: "enroll",
                })
            );

            await expect(
                apiClient.submitSignUpAttributes(
                    "/submitattributes",
                    { continuationToken: "ct-start", attributes: {} },
                    context
                )
            ).rejects.toMatchObject({ error: NO_AUTHENTICATION_METHODS });
        });

        it("rejects sign-up enrollment without a continuation token", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    action: "enroll",
                    _embedded: {
                        methods: [
                            {
                                type: "email",
                                _links: { enroll: { href: "/enroll/email" } },
                            },
                        ],
                    },
                })
            );

            await expect(
                apiClient.submitSignUpAttributes(
                    "/submitattributes",
                    { continuationToken: "ct-start", attributes: {} },
                    context
                )
            ).rejects.toMatchObject({ error: CONTINUATION_TOKEN_MISSING });
        });

        it("rejects malformed sign-up enrollment methods and links", async () => {
            for (const methods of [
                [{ type: "email" }],
                [
                    {
                        type: "phone",
                        channels: [],
                        _links: { enroll: { href: "/enroll/phone" } },
                    },
                ],
                [
                    {
                        type: "phone",
                        channels: "sms",
                        _links: { enroll: { href: "/enroll/phone" } },
                    },
                ],
            ]) {
                mockHttpClient.sendAsync.mockResolvedValueOnce(
                    buildResponse({
                        continuationToken: "ct-enroll",
                        action: "enroll",
                        _embedded: { methods },
                    })
                );

                await expect(
                    apiClient.submitSignUpAttributes(
                        "/submitattributes",
                        { continuationToken: "ct-start", attributes: {} },
                        context
                    )
                ).rejects.toMatchObject({ error: INVALID_HAL_RESPONSE });
            }
        });

        it("maps a completed attribute submission", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-complete",
                    state: "continue",
                })
            );

            const result = await apiClient.submitSignUpAttributes(
                "/tenant/api/v0.1/signup/submitattributes",
                {
                    continuationToken: "ct-start",
                    attributes: { jobTitle: "Engineer" },
                },
                context
            );

            expect(result).toEqual({
                nextAction: "continue",
                continuationToken: "ct-complete",
            });
        });
    });

    describe("requestChallenge", () => {
        it.each(["email", "sms"])(
            "allows %s verification without a resend link",
            async (type) => {
                mockHttpClient.sendAsync
                    .mockResolvedValueOnce(
                        buildResponse({
                            continuationToken: "ct-challenge",
                            action: "verify",
                            type,
                            codeLength: 6,
                            _links: {
                                verify: { href: "/tenant/api/v0.1/verify" },
                            },
                        })
                    )
                    .mockResolvedValueOnce(
                        buildResponse({
                            continuationToken: "ct-continue",
                            state: "continue",
                        })
                    );

                const challenge = await apiClient.requestChallenge(
                    "/tenant/api/v0.1/challenge",
                    { continuationToken: "ct-start" },
                    context
                );

                expect(challenge).toEqual({
                    nextAction: "verify",
                    continuationToken: "ct-challenge",
                    type,
                    verifyHref: "/tenant/api/v0.1/verify",
                    resendHref: undefined,
                    codeLength: 6,
                    hint: undefined,
                });
                await expect(
                    apiClient.verifyChallenge(
                        "/tenant/api/v0.1/verify",
                        {
                            continuationToken: challenge.continuationToken,
                            otp: "123456",
                        },
                        context
                    )
                ).resolves.toEqual({
                    nextAction: "continue",
                    continuationToken: "ct-continue",
                });
            }
        );

        it("returns the verify href and challenge metadata", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-challenge",
                    action: "verify",
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
                nextAction: "verify",
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
                    action: "verify",
                    payload: { codeLength: 8 },
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
            expect(result).toMatchObject({
                nextAction: "verify",
                codeLength: 8,
            });
        });

        it.each([
            [0, 0],
            [-1, -1],
            [undefined, 0],
            [null, 0],
            ["6", 0],
            [6.5, 0],
        ])(
            "maps challenge codeLength %s to %s without throwing",
            async (codeLength, expectedCodeLength) => {
                mockHttpClient.sendAsync.mockResolvedValueOnce(
                    buildResponse({
                        continuationToken: "ct-challenge",
                        action: "verify",
                        type: "email",
                        codeLength,
                        _links: {
                            verify: { href: "/tenant/api/v0.1/verify" },
                        },
                    })
                );

                await expect(
                    apiClient.requestChallenge(
                        "/tenant/api/v0.1/challenge",
                        { continuationToken: "ct-start" },
                        context
                    )
                ).resolves.toMatchObject({ codeLength: expectedCodeLength });
            }
        );

        it("rejects a malformed challenge resend link", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-challenge",
                    action: "verify",
                    _links: {
                        verify: { href: "/tenant/api/v0.1/verify" },
                        resend: { href: 42 },
                    },
                })
            );

            await expect(
                apiClient.requestChallenge(
                    "/tenant/api/v0.1/challenge",
                    { continuationToken: "ct-start" },
                    context
                )
            ).rejects.toMatchObject({
                error: INVALID_HAL_RESPONSE,
                errorDescription: "Invalid HAL response: missing 'resend' link",
            });
        });

        it("rejects a challenge resend relation without an href", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-challenge",
                    action: "verify",
                    _links: {
                        verify: { href: "/tenant/api/v0.1/verify" },
                        resend: {},
                    },
                })
            );

            await expect(
                apiClient.requestChallenge(
                    "/tenant/api/v0.1/challenge",
                    { continuationToken: "ct-start" },
                    context
                )
            ).rejects.toMatchObject({
                error: INVALID_HAL_RESPONSE,
                errorDescription: "Invalid HAL response: missing 'resend' link",
            });
        });

        it("maps a password challenge without OTP metadata", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-password",
                    action: "verify",
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
                nextAction: "verify",
                continuationToken: "ct-password",
                type: "password",
                verifyHref: "/tenant/api/v0.1/password/verify",
                resendHref: undefined,
                codeLength: undefined,
                hint: undefined,
            });
        });

        it.each([undefined, "unsupported"])(
            "rejects a challenge with action %s",
            async (action) => {
                mockHttpClient.sendAsync.mockResolvedValueOnce(
                    buildResponse({
                        continuationToken: "ct-challenge",
                        action,
                        type: "email",
                        _links: {
                            verify: { href: "/tenant/api/v0.1/verify" },
                        },
                    })
                );

                await expect(
                    apiClient.requestChallenge(
                        "/tenant/api/v0.1/challenge",
                        { continuationToken: "ct-start" },
                        context
                    )
                ).rejects.toMatchObject({
                    error: INVALID_HAL_RESPONSE,
                    errorDescription:
                        "Invalid HAL response: challenge returned no known next action",
                });
            }
        );

        it("returns the risk-verification link for an SMS challenge", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-risk",
                    state: "interactionRequired",
                    action: "riskverify",
                    _links: {
                        riskverify: {
                            href: "/tenant/api/v1.0-internal/risk/phone/verify",
                        },
                    },
                })
            );

            await expect(
                apiClient.requestChallenge(
                    "/tenant/api/v0.1/sms/challenge",
                    { continuationToken: "ct-start" },
                    context
                )
            ).resolves.toEqual({
                nextAction: "riskverify",
                continuationToken: "ct-risk",
                riskVerifyHref: "/tenant/api/v1.0-internal/risk/phone/verify",
            });
        });

        it("rejects risk verification without a riskverify link", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-risk",
                    state: "interactionRequired",
                    action: "riskverify",
                    _links: {},
                })
            );

            await expect(
                apiClient.requestChallenge(
                    "/tenant/api/v0.1/sms/challenge",
                    { continuationToken: "ct-start" },
                    context
                )
            ).rejects.toMatchObject({
                error: INVALID_HAL_RESPONSE,
                errorDescription:
                    "Invalid HAL response: missing 'riskverify' link",
            });
        });
    });

    describe("verifyRisk", () => {
        it("returns SMS verification metadata", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-sms-verify",
                    state: "interactionRequired",
                    action: "verify",
                    scenario: "signin",
                    type: "sms",
                    hint: "+*** *******11",
                    payload: { codeLength: 6 },
                    _links: {
                        verify: {
                            href: "/tenant/api/v1.0-internal/sms/verify",
                        },
                        resend: {
                            href: "/tenant/api/v1.0-internal/sms/challenge",
                        },
                    },
                })
            );

            await expect(
                apiClient.verifyRisk(
                    "/tenant/api/v1.0-internal/risk/phone/verify",
                    { continuationToken: "ct-risk" },
                    context
                )
            ).resolves.toEqual({
                nextAction: "verify",
                continuationToken: "ct-sms-verify",
                verifyHref: "/tenant/api/v1.0-internal/sms/verify",
                resendHref: "/tenant/api/v1.0-internal/sms/challenge",
                codeLength: 6,
                hint: "+*** *******11",
                type: "sms",
            });
        });

        it("rejects a response without the verify action", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-risk",
                    action: "unsupported",
                })
            );

            await expect(
                apiClient.verifyRisk(
                    "/tenant/api/v1.0-internal/risk/phone/verify",
                    { continuationToken: "ct-risk" },
                    context
                )
            ).rejects.toMatchObject({
                error: INVALID_HAL_RESPONSE,
                errorDescription:
                    "Invalid HAL response: SMS risk verification returned no known next action",
            });
        });

        it.each([undefined, "email"])(
            "rejects risk verification with challenge type %s",
            async (type) => {
                mockHttpClient.sendAsync.mockResolvedValueOnce(
                    buildResponse({
                        continuationToken: "ct-sms-verify",
                        action: "verify",
                        scenario: "signin",
                        type,
                        _links: {
                            verify: {
                                href: "/tenant/api/v1.0-internal/sms/verify",
                            },
                        },
                    })
                );

                await expect(
                    apiClient.verifyRisk(
                        "/tenant/api/v1.0-internal/risk/phone/verify",
                        { continuationToken: "ct-risk" },
                        context
                    )
                ).rejects.toMatchObject({
                    error: INVALID_HAL_RESPONSE,
                    errorDescription:
                        "Invalid HAL response: SMS risk verification returned a non-SMS challenge",
                });
            }
        );

        it("rejects risk verification without a verify link", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-sms-verify",
                    action: "verify",
                    scenario: "signin",
                    type: "sms",
                    _links: {},
                })
            );

            await expect(
                apiClient.verifyRisk(
                    "/tenant/api/v1.0-internal/risk/phone/verify",
                    { continuationToken: "ct-risk" },
                    context
                )
            ).rejects.toMatchObject({
                error: INVALID_HAL_RESPONSE,
                errorDescription: "Invalid HAL response: missing 'verify' link",
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

        it("maps sign-up state:continue using its continuation token", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-sign-up-verify",
                    state: "continue",
                })
            );

            const result = await apiClient.verifyChallenge(
                "/tenant/api/v0.1/signup/verify",
                { continuationToken: "ct-challenge", otp: "12345678" },
                context
            );

            expect(result).toEqual({
                nextAction: "continue",
                continuationToken: "ct-sign-up-verify",
            });
        });

        it("maps sign-up collectAttributes metadata and submit href", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-sign-up-verify",
                    state: "interactionRequired",
                    action: "collectAttributes",
                    attributes: [
                        {
                            attributeId: "password",
                            inputType: "password",
                            required: true,
                            canChange: true,
                            label: "Password",
                            confirmationInput: "retype",
                        },
                        {
                            attributeId: "jobTitle",
                            inputType: "text",
                            canChange: true,
                            label: "Job Title",
                            regex: "^.*",
                        },
                    ],
                    _links: {
                        submitAttributes: {
                            href: "/tenant/api/v0.1/signup/submitattributes",
                        },
                    },
                })
            );

            const result = await apiClient.verifyChallenge(
                "/tenant/api/v0.1/signup/verify",
                { continuationToken: "ct-challenge", otp: "12345678" },
                context
            );

            expect(result).toEqual({
                nextAction: "collectAttributes",
                continuationToken: "ct-sign-up-verify",
                attributes: [
                    {
                        attributeId: "password",
                        inputType: "password",
                        required: true,
                        canChange: true,
                        label: "Password",
                        confirmationInput: "retype",
                    },
                    {
                        attributeId: "jobTitle",
                        inputType: "text",
                        canChange: true,
                        label: "Job Title",
                        regex: "^.*",
                    },
                ],
                submitAttributesHref:
                    "/tenant/api/v0.1/signup/submitattributes",
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
                    password: "valid-password",
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
                    password: "valid-password",
                },
                context
            );

            expect(result).toMatchObject({
                nextAction: "challenge",
                authenticationFactor: "singleFactor",
            });
        });

        it("maps enrollment methods in server order without applying flow support policy", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-enroll",
                    state: "interactionRequired",
                    action: "enroll",
                    _embedded: {
                        methods: [
                            {
                                type: "unknown",
                                channels: ["unknown", ""],
                                _links: {
                                    enroll: {
                                        href: "/tenant/api/v0.1/enroll/unknown",
                                    },
                                },
                            },
                            {
                                type: "email",
                                _links: {
                                    enroll: {
                                        href: "/tenant/api/v0.1/enroll/email",
                                    },
                                },
                            },
                            {
                                type: "phone",
                                channels: ["voice"],
                                _links: {
                                    enroll: {
                                        href: "/tenant/api/v0.1/enroll/voice",
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
                    password: "valid-password",
                },
                context
            );

            expect(result).toEqual({
                nextAction: "enroll",
                continuationToken: "ct-enroll",
                methods: [
                    {
                        type: "unknown",
                        channels: ["unknown", ""],
                        enrollHref: "/tenant/api/v0.1/enroll/unknown",
                    },
                    {
                        type: "email",
                        channels: undefined,
                        enrollHref: "/tenant/api/v0.1/enroll/email",
                    },
                    {
                        type: "phone",
                        channels: ["voice"],
                        enrollHref: "/tenant/api/v0.1/enroll/voice",
                    },
                ],
            });
        });

        it("rejects verify enrollment with an empty method list", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-enroll",
                    action: "enroll",
                    _embedded: { methods: [] },
                })
            );

            await expect(
                apiClient.verifyChallenge(
                    "/tenant/api/v0.1/password/verify",
                    {
                        continuationToken: "ct-password",
                        password: "valid-password",
                    },
                    context
                )
            ).rejects.toMatchObject({ error: NO_AUTHENTICATION_METHODS });
        });

        it("rejects an enrollment method without an enroll link", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-enroll",
                    action: "enroll",
                    _embedded: {
                        methods: [
                            {
                                type: "email",
                            },
                        ],
                    },
                })
            );

            await expect(
                apiClient.verifyChallenge(
                    "/tenant/api/v0.1/password/verify",
                    {
                        continuationToken: "ct-password",
                        password: "valid-password",
                    },
                    context
                )
            ).rejects.toMatchObject({
                error: INVALID_HAL_RESPONSE,
                errorDescription: "Invalid HAL response: missing 'enroll' link",
            });
        });

        it("rejects a challenge-only method from an enrollment response", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-enroll",
                    action: "enroll",
                    _embedded: {
                        methods: [
                            {
                                type: "email",
                                _links: {
                                    challenge: { href: "/challenge/email" },
                                },
                            },
                        ],
                    },
                })
            );

            await expect(
                apiClient.verifyChallenge(
                    "/tenant/api/v0.1/password/verify",
                    {
                        continuationToken: "ct-password",
                        password: "valid-password",
                    },
                    context
                )
            ).rejects.toMatchObject({
                error: INVALID_HAL_RESPONSE,
                errorDescription: "Invalid HAL response: missing 'enroll' link",
            });
        });

        it.each([[], "sms", null])(
            "rejects verify enrollment with invalid channels %j",
            async (channels) => {
                mockHttpClient.sendAsync.mockResolvedValueOnce(
                    buildResponse({
                        continuationToken: "ct-enroll",
                        action: "enroll",
                        _embedded: {
                            methods: [
                                {
                                    type: "phone",
                                    channels,
                                    _links: {
                                        enroll: {
                                            href: "/tenant/api/v0.1/enroll/phone",
                                        },
                                    },
                                },
                            ],
                        },
                    })
                );

                await expect(
                    apiClient.verifyChallenge(
                        "/tenant/api/v0.1/password/verify",
                        {
                            continuationToken: "ct-password",
                            password: "valid-password",
                        },
                        context
                    )
                ).rejects.toMatchObject({
                    error: INVALID_HAL_RESPONSE,
                    errorDescription:
                        "Invalid HAL response: enrollment method channels are malformed",
                });
            }
        );

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
                        password: "valid-password",
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
                        password: "valid-password",
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

    describe("enrollAuthMethod", () => {
        it("posts email enrollment without a channel and maps activation metadata", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-activate",
                    state: "interactionRequired",
                    action: "activate",
                    type: "email",
                    hint: "u***@test.com",
                    codeLength: 6,
                    _links: {
                        activate: {
                            href: "/tenant/api/v0.1/activate/email",
                        },
                        resend: {
                            href: "/tenant/api/v0.1/enroll/email",
                        },
                    },
                })
            );

            const result = await apiClient.enrollAuthMethod(
                "/tenant/api/v0.1/enroll/email",
                {
                    email: "user@test.com",
                    continuationToken: "ct-enroll",
                },
                context
            );

            expect(result).toEqual({
                nextAction: "activate",
                continuationToken: "ct-activate",
                hint: "u***@test.com",
                codeLength: 6,
                activateHref: "/tenant/api/v0.1/activate/email",
                resendHref: "/tenant/api/v0.1/enroll/email",
            });

            const [url, options] = mockHttpClient.sendAsync.mock.calls[0];
            expect(url.href).toBe(
                "https://nativeauthasampleapp.ciamlogin.com/nativeauthasampleapp.onmicrosoft.com/api/v0.1/enroll/email"
            );
            expect(options.method).toBe(HttpMethod.POST);
            expect(JSON.parse(options.body)).toEqual({
                email: "user@test.com",
                continuationToken: "ct-enroll",
            });
        });

        it("posts phone enrollment with the SMS channel", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-activate",
                    action: "activate",
                    type: "phone",
                    codeLength: 6,
                    _links: {
                        activate: {
                            href: "/tenant/api/v0.1/activate/phone",
                        },
                        resend: {
                            href: "/tenant/api/v0.1/enroll/phone",
                        },
                    },
                })
            );

            await expect(
                apiClient.enrollAuthMethod(
                    "/tenant/api/v0.1/enroll/phone",
                    {
                        phoneNumber: "+15555550123",
                        channel: "sms",
                        continuationToken: "ct-enroll",
                    },
                    context
                )
            ).resolves.toMatchObject({
                nextAction: "activate",
                codeLength: 6,
            });

            const [, options] = mockHttpClient.sendAsync.mock.calls[0];
            expect(JSON.parse(options.body)).toEqual({
                phoneNumber: "+15555550123",
                channel: "sms",
                continuationToken: "ct-enroll",
            });
        });

        it("allows activation without a resend link", async () => {
            mockHttpClient.sendAsync
                .mockResolvedValueOnce(
                    buildResponse({
                        continuationToken: "ct-activate",
                        action: "activate",
                        codeLength: 6,
                        _links: {
                            activate: {
                                href: "/tenant/api/v0.1/activate/email",
                            },
                        },
                    })
                )
                .mockResolvedValueOnce(
                    buildResponse({
                        continuationToken: "ct-continue",
                        state: "continue",
                    })
                );

            const enrollment = await apiClient.enrollAuthMethod(
                "/tenant/api/v0.1/enroll/email",
                {
                    email: "user@test.com",
                    continuationToken: "ct-enroll",
                },
                context
            );

            expect(enrollment).toEqual({
                nextAction: "activate",
                continuationToken: "ct-activate",
                hint: undefined,
                codeLength: 6,
                activateHref: "/tenant/api/v0.1/activate/email",
                resendHref: undefined,
            });
            await expect(
                apiClient.activateAuthMethod(
                    enrollment.activateHref,
                    {
                        continuationToken: enrollment.continuationToken,
                        otp: "123456",
                    },
                    context
                )
            ).resolves.toEqual({
                nextAction: "continue",
                continuationToken: "ct-continue",
            });
        });

        it("does not require method type in an activation response", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-activate",
                    action: "activate",
                    codeLength: 6,
                    _links: {
                        activate: {
                            href: "/tenant/api/v0.1/activate/email",
                        },
                        resend: {
                            href: "/tenant/api/v0.1/enroll/email",
                        },
                    },
                })
            );

            await expect(
                apiClient.enrollAuthMethod(
                    "/tenant/api/v0.1/enroll/email",
                    {
                        email: "user@test.com",
                        continuationToken: "ct-enroll",
                    },
                    context
                )
            ).resolves.toMatchObject({
                nextAction: "activate",
            });
        });

        it("rejects an activation response without an activate link", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-activate",
                    action: "activate",
                    type: "email",
                    codeLength: 6,
                })
            );

            await expect(
                apiClient.enrollAuthMethod(
                    "/tenant/api/v0.1/enroll/email",
                    {
                        email: "user@test.com",
                        continuationToken: "ct-enroll",
                    },
                    context
                )
            ).rejects.toMatchObject({
                error: INVALID_HAL_RESPONSE,
                errorDescription:
                    "Invalid HAL response: missing 'activate' link",
            });
        });

        it("rejects a malformed activate link", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-activate",
                    action: "activate",
                    type: "email",
                    codeLength: 6,
                    _links: {
                        activate: {
                            href: 42,
                        },
                    },
                })
            );

            await expect(
                apiClient.enrollAuthMethod(
                    "/tenant/api/v0.1/enroll/email",
                    {
                        email: "user@test.com",
                        continuationToken: "ct-enroll",
                    },
                    context
                )
            ).rejects.toMatchObject({
                error: INVALID_HAL_RESPONSE,
                errorDescription:
                    "Invalid HAL response: missing 'activate' link",
            });
        });

        it("rejects a malformed resend link", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-activate",
                    action: "activate",
                    type: "email",
                    codeLength: 6,
                    _links: {
                        activate: {
                            href: "/tenant/api/v0.1/activate/email",
                        },
                        resend: {
                            href: 42,
                        },
                    },
                })
            );

            await expect(
                apiClient.enrollAuthMethod(
                    "/tenant/api/v0.1/enroll/email",
                    {
                        email: "user@test.com",
                        continuationToken: "ct-enroll",
                    },
                    context
                )
            ).rejects.toMatchObject({
                error: INVALID_HAL_RESPONSE,
                errorDescription: "Invalid HAL response: missing 'resend' link",
            });
        });

        it("rejects an activation resend relation without an href", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-activate",
                    action: "activate",
                    type: "email",
                    codeLength: 6,
                    _links: {
                        activate: {
                            href: "/tenant/api/v0.1/activate/email",
                        },
                        resend: {},
                    },
                })
            );

            await expect(
                apiClient.enrollAuthMethod(
                    "/tenant/api/v0.1/enroll/email",
                    {
                        email: "user@test.com",
                        continuationToken: "ct-enroll",
                    },
                    context
                )
            ).rejects.toMatchObject({
                error: INVALID_HAL_RESPONSE,
                errorDescription: "Invalid HAL response: missing 'resend' link",
            });
        });

        it.each([
            [0, 0],
            [-1, -1],
            [undefined, 0],
            [null, 0],
            ["6", 0],
            [6.5, 0],
        ])(
            "maps activation codeLength %s to %s without throwing",
            async (codeLength, expectedCodeLength) => {
                mockHttpClient.sendAsync.mockResolvedValueOnce(
                    buildResponse({
                        continuationToken: "ct-activate",
                        action: "activate",
                        type: "email",
                        codeLength,
                        _links: {
                            activate: {
                                href: "/tenant/api/v0.1/activate/email",
                            },
                        },
                    })
                );

                await expect(
                    apiClient.enrollAuthMethod(
                        "/tenant/api/v0.1/enroll/email",
                        {
                            email: "user@test.com",
                            continuationToken: "ct-enroll",
                        },
                        context
                    )
                ).resolves.toMatchObject({ codeLength: expectedCodeLength });
            }
        );
    });

    describe("resendAuthMethodRegistrationChallenge", () => {
        it("posts only the continuation token and maps activation metadata", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-resend",
                    action: "activate",
                    type: "email",
                    hint: "u***@test.com",
                    codeLength: 6,
                    _links: {
                        activate: {
                            href: "/tenant/api/v0.1/activate/email",
                        },
                        resend: {
                            href: "/tenant/api/v0.1/enroll/email",
                        },
                    },
                })
            );

            await expect(
                apiClient.resendAuthMethodRegistrationChallenge(
                    "/tenant/api/v0.1/enroll/email",
                    {
                        continuationToken: "ct-activate",
                    },
                    context
                )
            ).resolves.toMatchObject({
                nextAction: "activate",
                continuationToken: "ct-resend",
                hint: "u***@test.com",
                codeLength: 6,
            });

            const [url, options] = mockHttpClient.sendAsync.mock.calls[0];
            expect(url.href).toBe(
                "https://nativeauthasampleapp.ciamlogin.com/nativeauthasampleapp.onmicrosoft.com/api/v0.1/enroll/email"
            );
            expect(options.method).toBe(HttpMethod.POST);
            expect(JSON.parse(options.body)).toEqual({
                continuationToken: "ct-activate",
            });
        });
    });

    describe("activateAuthMethod", () => {
        it("posts the OTP and returns the continuation token", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-continue",
                    state: "continue",
                })
            );

            const result = await apiClient.activateAuthMethod(
                "/tenant/api/v0.1/activate/email",
                {
                    otp: "866334",
                    continuationToken: "ct-activate",
                },
                context
            );

            expect(result).toEqual({
                nextAction: "continue",
                continuationToken: "ct-continue",
            });

            const [, options] = mockHttpClient.sendAsync.mock.calls[0];
            expect(JSON.parse(options.body)).toEqual({
                otp: "866334",
                continuationToken: "ct-activate",
            });
        });

        it("rejects activation without the continue state", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-continue",
                    state: "interactionRequired",
                })
            );

            await expect(
                apiClient.activateAuthMethod(
                    "/tenant/api/v0.1/activate/email",
                    {
                        otp: "866334",
                        continuationToken: "ct-activate",
                    },
                    context
                )
            ).rejects.toMatchObject({
                error: INVALID_HAL_RESPONSE,
                errorDescription:
                    "Invalid HAL response: activation returned no continuation state",
            });
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
                {
                    newPassword: "new-valid-password",
                    continuationToken: "ct-verify",
                },
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
        it("validates and maps the enrollment response for the interaction client", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-enroll",
                    state: "interactionRequired",
                    action: "enroll",
                    _embedded: {
                        methods: [
                            {
                                type: "email",
                                _links: { enroll: { href: "/enroll/email" } },
                            },
                        ],
                    },
                })
            );

            await expect(
                apiClient.poll(
                    "/tenant/api/v0.1/poll",
                    { continuationToken: "ct-update" },
                    context
                )
            ).resolves.toEqual({
                nextAction: "enroll",
                continuationToken: "ct-enroll",
                enrollmentMethods: [
                    {
                        type: "email",
                        channels: undefined,
                        enrollHref: "/enroll/email",
                    },
                ],
            });
        });

        it.each<{ body: PollResponseV2; error: string }>([
            {
                body: { continuationToken: "ct-enroll", action: "enroll" },
                error: NO_AUTHENTICATION_METHODS,
            },
            {
                body: {
                    continuationToken: "ct-enroll",
                    action: "enroll",
                    _embedded: { methods: [] },
                },
                error: NO_AUTHENTICATION_METHODS,
            },
            {
                body: {
                    action: "enroll",
                    _embedded: {
                        methods: [
                            {
                                type: "email",
                                _links: { enroll: { href: "/enroll/email" } },
                            },
                        ],
                    },
                },
                error: CONTINUATION_TOKEN_MISSING,
            },
            {
                body: {
                    continuationToken: "ct-enroll",
                    action: "enroll",
                    _embedded: {
                        methods: [
                            {
                                type: "",
                                _links: { enroll: { href: "/enroll/email" } },
                            },
                        ],
                    },
                },
                error: INVALID_HAL_RESPONSE,
            },
            {
                body: {
                    continuationToken: "ct-enroll",
                    action: "enroll",
                    _embedded: {
                        methods: [
                            {
                                type: "phone",
                                channels: [],
                                _links: { enroll: { href: "/enroll/phone" } },
                            },
                        ],
                    },
                },
                error: INVALID_HAL_RESPONSE,
            },
            {
                body: {
                    continuationToken: "ct-enroll",
                    action: "enroll",
                    _embedded: { methods: [{ type: "email" }] },
                },
                error: INVALID_HAL_RESPONSE,
            },
            {
                body: {
                    continuationToken: "ct-poll",
                    action: "poll",
                    _links: { poll: { href: " " } },
                },
                error: INVALID_HAL_RESPONSE,
            },
            {
                body: { continuationToken: "ct-poll", action: "poll" },
                error: INVALID_HAL_RESPONSE,
            },
        ])(
            "rejects malformed poll response $body with $error",
            async ({ body, error }) => {
                mockHttpClient.sendAsync.mockResolvedValueOnce(
                    buildResponse(body)
                );

                await expect(
                    apiClient.poll(
                        "/tenant/api/v0.1/poll",
                        { continuationToken: "ct-update" },
                        context
                    )
                ).rejects.toMatchObject({
                    error,
                    correlationId: context.correlationId,
                });
            }
        );

        it.each([undefined, "/tenant/api/v0.1/poll-next"])(
            "returns continue without a poll href (advertised poll href: %s)",
            async (pollHref) => {
                mockHttpClient.sendAsync.mockResolvedValueOnce(
                    buildResponse({
                        state: "continue",
                        continuationToken: "ct-poll",
                        _links: pollHref
                            ? { poll: { href: pollHref } }
                            : undefined,
                    })
                );

                const result = await apiClient.poll(
                    "/tenant/api/v0.1/poll",
                    { continuationToken: "ct-update" },
                    context
                );

                expect(result).toEqual({
                    continuationToken: "ct-poll",
                    nextAction: "continue",
                    pollHref: undefined,
                });
                expect(result.pollHref).toBeUndefined();
            }
        );

        it("returns poll with the response token and sends the request token", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    action: "poll",
                    continuationToken: "ct-poll",
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

            expect(result).toEqual({
                continuationToken: "ct-poll",
                nextAction: "poll",
                pollHref: "/tenant/api/v0.1/poll-next",
            });
            const [url, options] = mockHttpClient.sendAsync.mock.calls[0];
            expect(String(url)).toContain("/api/v0.1/poll");
            expect(options.method).toBe(HttpMethod.POST);
            expect(JSON.parse(options.body as string)).toEqual({
                continuationToken: "ct-update",
            });
        });

        it("returns the rotated token and relocated link with nextAction poll", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse({
                    action: "poll",
                    continuationToken: "ct-poll",
                    _links: {
                        poll: { href: "/tenant/api/v0.1/poll-next" },
                    },
                })
            );

            await expect(
                apiClient.poll(
                    "/tenant/api/v0.1/poll",
                    { continuationToken: "ct-update" },
                    context
                )
            ).resolves.toEqual({
                nextAction: "poll",
                continuationToken: "ct-poll",
                pollHref: "/tenant/api/v0.1/poll-next",
            });
        });

        it.each<PollResponseV2>([
            { action: "future-action" },
            { action: "future-action", state: "continue" },
            { state: "future-state" },
            { state: "interactionRequired" },
            {},
        ])(
            "rejects unsupported nextAction in %j even with a poll link",
            async (body) => {
                mockHttpClient.sendAsync.mockResolvedValueOnce(
                    buildResponse({
                        ...body,
                        continuationToken: "ct-poll",
                        _links: {
                            poll: { href: "/tenant/api/v0.1/poll-next" },
                        },
                    })
                );

                await expect(
                    apiClient.poll(
                        "/tenant/api/v0.1/poll",
                        { continuationToken: "ct-update" },
                        context
                    )
                ).rejects.toMatchObject({
                    error: INVALID_HAL_RESPONSE,
                    errorDescription: `Password reset poll next action '${
                        body.action ?? body.state
                    }' is not supported.`,
                    correlationId: context.correlationId,
                });
            }
        );

        it.each<PollResponseV2>([
            { action: "enroll" },
            { action: "poll" },
            { state: "continue" },
        ])(
            "rejects missing or empty response tokens for %j instead of reusing the request token",
            async (body) => {
                for (const continuationToken of [undefined, ""]) {
                    mockHttpClient.sendAsync.mockResolvedValueOnce(
                        buildResponse({
                            ...body,
                            continuationToken,
                            _links: {
                                poll: { href: "/tenant/api/v0.1/poll-next" },
                            },
                            _embedded: {
                                methods: [
                                    {
                                        type: "email",
                                        _links: {
                                            enroll: { href: "/enroll/email" },
                                        },
                                    },
                                ],
                            },
                        })
                    );

                    await expect(
                        apiClient.poll(
                            "/tenant/api/v0.1/poll",
                            { continuationToken: "ct-poll" },
                            context
                        )
                    ).rejects.toMatchObject({
                        error: CONTINUATION_TOKEN_MISSING,
                        correlationId: context.correlationId,
                    });
                }
            }
        );
    });

    describe("errors on HAL requests", () => {
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
                innerErrorCode: "otp_expired",
            });
        });

        it("preserves userNotFound on a failing HAL request", async () => {
            mockHttpClient.sendAsync.mockResolvedValueOnce(
                buildResponse(
                    {
                        error: {
                            code: "invalidRequest",
                            message:
                                "AADSTS50034: The user account does not exist in the directory.",
                            timestamp: "2026-10-15 11:00:16Z",
                            traceId: "6a72e163-b400-45c1-82d1-2ffe897e1c00",
                            correlationId:
                                "1b387df0-1092-49fd-9afa-503c14ead335",
                            innerError: { code: "userNotFound" },
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
                error: "invalidRequest",
                innerErrorCode: "userNotFound",
                correlationId: "1b387df0-1092-49fd-9afa-503c14ead335",
                traceId: "6a72e163-b400-45c1-82d1-2ffe897e1c00",
                timestamp: "2026-10-15 11:00:16Z",
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
                },
                context
            );

            expect(result.access_token).toBe("access-1");
            expect(mockHttpClient.sendAsync).toHaveBeenCalledTimes(2);
            expect(
                mockHttpClient.sendAsync.mock.calls[0][1].body.toString()
            ).toBe("continuation_token=ct-poll");
            expect(
                mockHttpClient.sendAsync.mock.calls[1][1].body.toString()
            ).toBe(
                "client_id=client-id-123&grant_type=authorization_code&code=auth-code-1&client_info=1"
            );
        });
    });
});

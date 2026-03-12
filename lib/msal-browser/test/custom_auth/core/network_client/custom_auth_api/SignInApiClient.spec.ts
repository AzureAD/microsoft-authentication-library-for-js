/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerTelemetryManager } from "@azure/msal-common/browser";
import { SignInApiClient } from "../../../../../src/custom_auth/core/network_client/custom_auth_api/SignInApiClient.js";
import { CustomAuthApiError } from "../../../../../src/custom_auth/core/error/CustomAuthApiError.js";
import * as CustomAuthApiErrorCode from "../../../../../src/custom_auth/core/network_client/custom_auth_api/types/ApiErrorCodes.js";
import { GrantType } from "../../../../../src/custom_auth/CustomAuthConstants.js";

// Mock ServerTelemetryManager minimal implementation
const mockTelemetryManager = {
    generateCurrentRequestHeaderValue: jest.fn(() => "cur"),
    generateLastRequestHeaderValue: jest.fn(() => "last"),
} as unknown as ServerTelemetryManager;

describe("SignInApiClient", () => {
    const baseUrl = "https://customauth.test/";
    const clientId = "client-id-123";
    let mockHttpClient: any;
    let apiClient: SignInApiClient;

    beforeEach(() => {
        mockHttpClient = {
            post: jest.fn(),
        };

        apiClient = new SignInApiClient(
            baseUrl,
            clientId,
            mockHttpClient,
            "cap1 cap2"
        );
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    const buildResponse = (
        body: any,
        ok = true,
        headers: Record<string, string> = {}
    ) => {
        return {
            ok,
            json: async () => body,
            headers: {
                get: (name: string) => headers[name] || null,
            },
        } as unknown as Response;
    };

    describe("initiate", () => {
        it("sends initiate request and validates continuation token", async () => {
            const responseBody = {
                continuation_token: "cont-token-1",
                extra: "v",
            };
            mockHttpClient.post.mockResolvedValue(
                buildResponse(responseBody, true, {
                    "x-ms-request-id": "corr-1",
                })
            );

            const result = await apiClient.initiate({
                username: "user@test.com",
                challenge_type: "email-otp",
                telemetryManager: mockTelemetryManager,
                correlationId: "corr-1",
            });

            expect(mockHttpClient.post).toHaveBeenCalled();
            expect(result.continuation_token).toBe("cont-token-1");
            expect(result.correlation_id).toBe("corr-1");
        });

        it("throws when continuation token missing", async () => {
            mockHttpClient.post.mockResolvedValue(buildResponse({}, true));

            await expect(
                apiClient.initiate({
                    username: "user@test.com",
                    challenge_type: "email-password",
                    telemetryManager: mockTelemetryManager,
                    correlationId: "corr-2",
                })
            ).rejects.toBeInstanceOf(CustomAuthApiError);
        });
    });

    describe("requestChallenge", () => {
        it("sends challenge request and validates continuation token", async () => {
            const responseBody = {
                continuation_token: "cont-token-2",
                challenge_type: "email-otp",
                binding_method: "sms",
            };
            mockHttpClient.post.mockResolvedValue(
                buildResponse(responseBody, true, {
                    "x-ms-request-id": "corr-3",
                })
            );

            const result = await apiClient.requestChallenge({
                continuation_token: "cont-token-1",
                challenge_type: "email-otp",
                telemetryManager: mockTelemetryManager,
                correlationId: "corr-3",
            });

            expect(mockHttpClient.post).toHaveBeenCalled();
            // Challenge response shape contains challenge_type and binding_method
            expect(result.challenge_type).toBe("email-otp");
            expect(result.binding_method).toBe("sms");
            expect(result.correlation_id).toBe("corr-3");
        });

        it("throws when continuation token missing in response", async () => {
            mockHttpClient.post.mockResolvedValue(buildResponse({}, true));

            await expect(
                apiClient.requestChallenge({
                    continuation_token: "cont-token-1",
                    challenge_type: "email-otp",
                    telemetryManager: mockTelemetryManager,
                    correlationId: "corr-4",
                })
            ).rejects.toBeInstanceOf(CustomAuthApiError);
        });
    });

    describe("requestTokens variants", () => {
        const validTokenResponse = {
            access_token: "at",
            id_token: "id",
            refresh_token: "rt",
            expires_in: 3600,
            token_type: "Bearer",
            client_info: "ci",
        };

        it("requestTokensWithPassword succeeds with valid response", async () => {
            mockHttpClient.post.mockResolvedValue(
                buildResponse(validTokenResponse, true, {
                    "x-ms-request-id": "corr-5",
                })
            );

            const result = await apiClient.requestTokensWithPassword({
                continuation_token: "cont-1",
                scope: "openid",
                password: "p",
                telemetryManager: mockTelemetryManager,
                correlationId: "corr-5",
            });

            expect(mockHttpClient.post).toHaveBeenCalled();
            expect(result.access_token).toBe("at");
            expect(result.correlation_id).toBe("corr-5");
        });

        it("requestTokensWithOob succeeds with valid response", async () => {
            mockHttpClient.post.mockResolvedValue(
                buildResponse(validTokenResponse, true, {
                    "x-ms-request-id": "corr-6",
                })
            );

            const result = await apiClient.requestTokensWithOob({
                continuation_token: "cont-1",
                scope: "openid",
                oob: "oob-code",
                grant_type: GrantType.OOB,
                telemetryManager: mockTelemetryManager,
                correlationId: "corr-6",
            });

            expect(result.access_token).toBe("at");
            expect(result.correlation_id).toBe("corr-6");
        });

        it("requestTokenWithContinuationToken succeeds with valid response and includes username when provided", async () => {
            mockHttpClient.post.mockResolvedValue(
                buildResponse(validTokenResponse, true, {
                    "x-ms-request-id": "corr-7",
                })
            );

            const result = await apiClient.requestTokenWithContinuationToken({
                continuation_token: "cont-1",
                scope: "openid",
                telemetryManager: mockTelemetryManager,
                correlationId: "corr-7",
                username: "user@t.com",
            });

            expect(result.access_token).toBe("at");
            expect(result.correlation_id).toBe("corr-7");
        });

        it("throws CustomAuthApiError when access_token missing", async () => {
            const bad: any = { ...validTokenResponse };
            delete bad.access_token;
            mockHttpClient.post.mockResolvedValue(buildResponse(bad, true));

            await expect(
                apiClient.requestTokensWithPassword({
                    continuation_token: "cont-1",
                    scope: "openid",
                    password: "p",
                    telemetryManager: mockTelemetryManager,
                    correlationId: "corr-8",
                })
            ).rejects.toBeInstanceOf(CustomAuthApiError);
        });

        it("throws when id_token missing", async () => {
            const bad: any = { ...validTokenResponse };
            delete bad.id_token;
            mockHttpClient.post.mockResolvedValue(buildResponse(bad, true));

            await expect(
                apiClient.requestTokensWithPassword({
                    continuation_token: "cont-1",
                    scope: "openid",
                    password: "p",
                    telemetryManager: mockTelemetryManager,
                    correlationId: "corr-9",
                })
            ).rejects.toBeInstanceOf(CustomAuthApiError);
        });

        it("throws when refresh_token missing", async () => {
            const bad: any = { ...validTokenResponse };
            delete bad.refresh_token;
            mockHttpClient.post.mockResolvedValue(buildResponse(bad, true));

            await expect(
                apiClient.requestTokensWithPassword({
                    continuation_token: "cont-1",
                    scope: "openid",
                    password: "p",
                    telemetryManager: mockTelemetryManager,
                    correlationId: "corr-10",
                })
            ).rejects.toBeInstanceOf(CustomAuthApiError);
        });

        it("throws when expires_in invalid", async () => {
            const bad: any = { ...validTokenResponse, expires_in: 0 };
            mockHttpClient.post.mockResolvedValue(buildResponse(bad, true));

            await expect(
                apiClient.requestTokensWithPassword({
                    continuation_token: "cont-1",
                    scope: "openid",
                    password: "p",
                    telemetryManager: mockTelemetryManager,
                    correlationId: "corr-11",
                })
            ).rejects.toBeInstanceOf(CustomAuthApiError);
        });

        it("throws when token_type invalid", async () => {
            const bad: any = { ...validTokenResponse, token_type: "NotBearer" };
            mockHttpClient.post.mockResolvedValue(buildResponse(bad, true));

            await expect(
                apiClient.requestTokensWithPassword({
                    continuation_token: "cont-1",
                    scope: "openid",
                    password: "p",
                    telemetryManager: mockTelemetryManager,
                    correlationId: "corr-12",
                })
            ).rejects.toBeInstanceOf(CustomAuthApiError);
        });

        it("throws when client_info missing", async () => {
            const bad: any = { ...validTokenResponse };
            delete bad.client_info;
            mockHttpClient.post.mockResolvedValue(buildResponse(bad, true));

            await expect(
                apiClient.requestTokensWithPassword({
                    continuation_token: "cont-1",
                    scope: "openid",
                    password: "p",
                    telemetryManager: mockTelemetryManager,
                    correlationId: "corr-13",
                })
            ).rejects.toBeInstanceOf(CustomAuthApiError);
        });
    });

    describe("requestAuthMethods", () => {
        it("returns available methods and validates continuation token", async () => {
            const responseBody = {
                continuation_token: "cont-token-3",
                methods: [
                    {
                        id: "m1",
                        challenge_type: "password",
                        challenge_channel: "none",
                        login_hint: "",
                    },
                ],
            };
            mockHttpClient.post.mockResolvedValue(
                buildResponse(responseBody, true, {
                    "x-ms-request-id": "corr-14",
                })
            );

            const result = await apiClient.requestAuthMethods({
                continuation_token: "cont-token-2",
                telemetryManager: mockTelemetryManager,
                correlationId: "corr-14",
            });

            expect(result.methods && result.methods.length).toBe(1);
            expect(result.correlation_id).toBe("corr-14");
        });

        it("throws when continuation token missing in response", async () => {
            mockHttpClient.post.mockResolvedValue(buildResponse({}, true));

            await expect(
                apiClient.requestAuthMethods({
                    continuation_token: "cont-token-2",
                    telemetryManager: mockTelemetryManager,
                    correlationId: "corr-15",
                })
            ).rejects.toBeInstanceOf(CustomAuthApiError);
        });
    });

    describe("http error handling", () => {
        it("throws CustomAuthApiError when http client post throws", async () => {
            mockHttpClient.post.mockRejectedValue(new Error("network-failure"));

            await expect(
                apiClient.initiate({
                    username: "u@t.com",
                    challenge_type: "email-otp",
                    telemetryManager: mockTelemetryManager,
                    correlationId: "corr-16",
                })
            ).rejects.toBeInstanceOf(CustomAuthApiError);
        });

        it("propagates API error responses as CustomAuthApiError", async () => {
            const apiError = {
                error: CustomAuthApiErrorCode.INVALID_REQUEST,
                error_description: "bad input",
                correlation_id: "resp-corr",
                invalid_attributes: [],
            };
            mockHttpClient.post.mockResolvedValue(
                buildResponse(apiError, false, {
                    "x-ms-request-id": "resp-corr",
                })
            );

            await expect(
                apiClient.initiate({
                    username: "u@t.com",
                    challenge_type: "email-otp",
                    telemetryManager: mockTelemetryManager,
                    correlationId: "corr-17",
                })
            ).rejects.toBeInstanceOf(CustomAuthApiError);
        });
    });
});

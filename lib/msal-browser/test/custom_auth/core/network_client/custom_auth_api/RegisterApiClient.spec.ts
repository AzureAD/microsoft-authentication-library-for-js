/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { RegisterApiClient } from "../../../../../src/custom_auth/core/network_client/custom_auth_api/RegisterApiClient.js";
import { FetchHttpClient } from "../../../../../src/custom_auth/core/network_client/http_client/FetchHttpClient.js";
import { getDefaultLogger } from "../../../test_resources/TestModules.js";
import { ServerTelemetryManager } from "@azure/msal-common/browser";
import { CustomAuthApiError } from "../../../../../src/custom_auth/core/error/CustomAuthApiError.js";
import { GrantType } from "../../../../../src/custom_auth/CustomAuthConstants.js";

describe("RegisterApiClient", () => {
    let registerApiClient: RegisterApiClient;
    let mockHttpClient: jest.Mocked<FetchHttpClient>;
    let mockTelemetryManager: jest.Mocked<ServerTelemetryManager>;

    const baseUrl = "https://test.com";
    const clientId = "test-client-id";
    const correlationId = "test-correlation-id";
    const continuationToken = "test-continuation-token";

    beforeEach(() => {
        const logger = getDefaultLogger();

        // Create a real FetchHttpClient and then mock its methods
        const realHttpClient = new FetchHttpClient(logger);
        mockHttpClient = realHttpClient as jest.Mocked<FetchHttpClient>;
        mockHttpClient.post = jest.fn();
        mockHttpClient.get = jest.fn();
        mockHttpClient.sendAsync = jest.fn();

        mockTelemetryManager = {
            generateCurrentRequestHeaderValue: jest
                .fn()
                .mockReturnValue("current-telemetry"),
            generateLastRequestHeaderValue: jest
                .fn()
                .mockReturnValue("last-telemetry"),
        } as any;

        registerApiClient = new RegisterApiClient(
            baseUrl,
            clientId,
            mockHttpClient
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("introspect", () => {
        it("should successfully call introspect endpoint and return available auth methods", async () => {
            const mockResponse = {
                continuation_token: "new-continuation-token",
                correlation_id: correlationId,
                methods: [
                    {
                        id: "email",
                        challenge_type: "oob",
                        challenge_channel: "email",
                        login_hint: "user@example.com",
                    },
                ],
            };

            mockHttpClient.post.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockResponse),
                headers: new Map([["x-ms-request-id", correlationId]]),
            } as any);

            const result = await registerApiClient.introspect({
                continuation_token: continuationToken,
                correlationId: correlationId,
                telemetryManager: mockTelemetryManager,
            });

            expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
            const [url] = mockHttpClient.post.mock.calls[0];
            expect(url.toString()).toBe(`${baseUrl}/register/v1.0/introspect`);

            expect(result).toEqual({
                ...mockResponse,
                correlation_id: correlationId,
            });
        });

        it("should throw error when continuation token is missing in response", async () => {
            const mockResponse = {
                correlation_id: correlationId,
                methods: [],
            };

            mockHttpClient.post.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockResponse),
                headers: new Map([["x-ms-request-id", correlationId]]),
            } as any);

            await expect(
                registerApiClient.introspect({
                    continuation_token: continuationToken,
                    correlationId: correlationId,
                    telemetryManager: mockTelemetryManager,
                })
            ).rejects.toThrow(CustomAuthApiError);
        });
    });

    describe("challenge", () => {
        it("should successfully call challenge endpoint with required parameters", async () => {
            const mockResponse = {
                continuation_token: "new-continuation-token",
                correlation_id: correlationId,
                challenge_type: "oob",
                binding_method: "prompt",
                challenge_target: "user@example.com",
                challenge_channel: "email",
                code_length: 6,
            };

            mockHttpClient.post.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockResponse),
                headers: new Map([["x-ms-request-id", correlationId]]),
            } as any);

            const result = await registerApiClient.challenge({
                continuation_token: continuationToken,
                challenge_type: "oob",
                challenge_target: "user@example.com",
                correlationId: correlationId,
                telemetryManager: mockTelemetryManager,
            });

            expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
            const [url] = mockHttpClient.post.mock.calls[0];
            expect(url.toString()).toBe(`${baseUrl}/register/v1.0/challenge`);

            expect(result).toEqual({
                ...mockResponse,
                correlation_id: correlationId,
            });
        });

        it("should include challenge_channel when provided", async () => {
            const mockResponse = {
                continuation_token: "new-continuation-token",
                correlation_id: correlationId,
                challenge_type: "oob",
                binding_method: "prompt",
                challenge_target: "user@example.com",
                challenge_channel: "email",
            };

            mockHttpClient.post.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockResponse),
                headers: new Map([["x-ms-request-id", correlationId]]),
            } as any);

            const result = await registerApiClient.challenge({
                continuation_token: continuationToken,
                challenge_type: "oob",
                challenge_target: "user@example.com",
                challenge_channel: "email",
                correlationId: correlationId,
                telemetryManager: mockTelemetryManager,
            });

            expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
            expect(result).toEqual({
                ...mockResponse,
                correlation_id: correlationId,
            });
        });
    });

    describe("continue", () => {
        it("should successfully call continue endpoint with OOB grant type", async () => {
            const mockResponse = {
                continuation_token: "final-continuation-token",
                correlation_id: correlationId,
            };

            mockHttpClient.post.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockResponse),
                headers: new Map([["x-ms-request-id", correlationId]]),
            } as any);

            const result = await registerApiClient.continue({
                continuation_token: continuationToken,
                grant_type: GrantType.OOB,
                oob: "123456",
                correlationId: correlationId,
                telemetryManager: mockTelemetryManager,
            });

            expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
            const [url] = mockHttpClient.post.mock.calls[0];
            expect(url.toString()).toBe(`${baseUrl}/register/v1.0/continue`);

            expect(result).toEqual({
                ...mockResponse,
                correlation_id: correlationId,
            });
        });

        it("should work without oob parameter", async () => {
            const mockResponse = {
                continuation_token: "final-continuation-token",
                correlation_id: correlationId,
            };

            mockHttpClient.post.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockResponse),
                headers: new Map([["x-ms-request-id", correlationId]]),
            } as any);

            const result = await registerApiClient.continue({
                continuation_token: continuationToken,
                grant_type: GrantType.OOB,
                correlationId: correlationId,
                telemetryManager: mockTelemetryManager,
            });

            expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
            expect(result).toEqual({
                ...mockResponse,
                correlation_id: correlationId,
            });
        });
    });

    describe("error handling", () => {
        it("should throw CustomAuthApiError when HTTP request fails", async () => {
            mockHttpClient.post.mockRejectedValue(new Error("Network error"));

            await expect(
                registerApiClient.introspect({
                    continuation_token: continuationToken,
                    correlationId: correlationId,
                    telemetryManager: mockTelemetryManager,
                })
            ).rejects.toThrow(CustomAuthApiError);
        });

        it("should throw CustomAuthApiError when API returns error response", async () => {
            const errorResponse = {
                error: "invalid_request",
                error_description: "Invalid continuation token",
                correlation_id: correlationId,
            };

            mockHttpClient.post.mockResolvedValue({
                ok: false,
                json: jest.fn().mockResolvedValue(errorResponse),
                headers: new Map([["x-ms-request-id", correlationId]]),
            } as any);

            await expect(
                registerApiClient.introspect({
                    continuation_token: continuationToken,
                    correlationId: correlationId,
                    telemetryManager: mockTelemetryManager,
                })
            ).rejects.toThrow(CustomAuthApiError);
        });
    });
});

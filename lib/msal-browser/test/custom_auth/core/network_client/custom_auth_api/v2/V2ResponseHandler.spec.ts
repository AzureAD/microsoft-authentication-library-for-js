/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { V2ResponseHandler } from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/V2ResponseHandler.js";
import {
    INVALID_RESPONSE_BODY,
    INVALID_HAL_RESPONSE,
    CONTINUATION_TOKEN_MISSING,
} from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/V2ErrorCodes.js";

const REQUEST_CORRELATION_ID = "req-corr-id";
const HEADER_CORRELATION_ID = "header-corr-id";

const buildResponse = (
    body: unknown,
    status = 200,
    headers: Record<string, string> = {},
    jsonThrows = false
): Response =>
    ({
        status,
        headers: {
            get: (name: string) => headers[name] ?? null,
        },
        json: async () => {
            if (jsonThrows) {
                throw new SyntaxError("Unexpected token");
            }

            return body;
        },
    } as unknown as Response);

describe("V2ResponseHandler", () => {
    let handler: V2ResponseHandler;

    beforeEach(() => {
        handler = new V2ResponseHandler();
    });

    describe("parseResponse", () => {
        it("reads the correlation id from the response header", async () => {
            const result = await handler.parseResponse(
                buildResponse({ state: "interactionRequired" }, 200, {
                    "x-ms-request-id": HEADER_CORRELATION_ID,
                }),
                REQUEST_CORRELATION_ID
            );

            expect(result.correlationId).toBe(HEADER_CORRELATION_ID);
            expect(result.statusCode).toBe(200);
        });

        it("falls back to the request correlation id when the header is absent", async () => {
            const result = await handler.parseResponse(
                buildResponse({}),
                REQUEST_CORRELATION_ID
            );

            expect(result.correlationId).toBe(REQUEST_CORRELATION_ID);
        });

        it("reads the continuation token from camelCase", async () => {
            const result = await handler.parseResponse(
                buildResponse({ continuationToken: "ct-camel" }),
                REQUEST_CORRELATION_ID
            );

            expect(result.continuationToken).toBe("ct-camel");
        });

        it("reads the continuation token from snake_case", async () => {
            const result = await handler.parseResponse(
                buildResponse({ continuation_token: "ct-snake" }),
                REQUEST_CORRELATION_ID
            );

            expect(result.continuationToken).toBe("ct-snake");
        });

        it("flags web fallback when the flat error is redirect_to_web", async () => {
            const result = await handler.parseResponse(
                buildResponse({
                    error: "redirect_to_web",
                    continuation_token: "ct",
                }),
                REQUEST_CORRELATION_ID
            );

            expect(result.isWebFallbackRequired).toBe(true);
        });

        it("flags web fallback when the state is webFallbackRequired", async () => {
            const result = await handler.parseResponse(
                buildResponse({ state: "webFallbackRequired" }),
                REQUEST_CORRELATION_ID
            );

            expect(result.isWebFallbackRequired).toBe(true);
        });

        it("does not flag web fallback on a normal response", async () => {
            const result = await handler.parseResponse(
                buildResponse({ state: "interactionRequired" }),
                REQUEST_CORRELATION_ID
            );

            expect(result.isWebFallbackRequired).toBe(false);
        });

        it("normalizes a nested HAL error", async () => {
            const result = await handler.parseResponse(
                buildResponse({
                    error: {
                        code: "invalid_grant",
                        message: "bad credential",
                        innerError: { code: "password_too_weak" },
                        correlationId: "err-corr",
                        traceId: "trace-1",
                        timestamp: "2026-01-01",
                    },
                }),
                REQUEST_CORRELATION_ID
            );

            expect(result.error).toEqual({
                code: "invalid_grant",
                message: "bad credential",
                innerErrorCode: "password_too_weak",
                correlationId: "err-corr",
                traceId: "trace-1",
                timestamp: "2026-01-01",
            });
        });

        it("normalizes a flat OAuth error with error_codes", async () => {
            const result = await handler.parseResponse(
                buildResponse({
                    error: "invalid_request",
                    error_description: "AADSTS900023: bad tenant",
                    error_codes: [900023],
                    correlation_id: "flat-corr",
                    trace_id: "flat-trace",
                    timestamp: "2026-02-02",
                }),
                REQUEST_CORRELATION_ID
            );

            expect(result.error).toEqual({
                code: "invalid_request",
                message: "AADSTS900023: bad tenant",
                errorCodes: [900023],
                correlationId: "flat-corr",
                traceId: "flat-trace",
                timestamp: "2026-02-02",
            });
        });

        it("leaves error undefined when the body carries no error", async () => {
            const result = await handler.parseResponse(
                buildResponse({ continuationToken: "ct" }),
                REQUEST_CORRELATION_ID
            );

            expect(result.error).toBeUndefined();
        });

        it("surfaces the header correlation id on the body", async () => {
            const result = await handler.parseResponse<{
                correlationId?: string;
            }>(
                buildResponse({}, 200, {
                    "x-ms-request-id": HEADER_CORRELATION_ID,
                }),
                REQUEST_CORRELATION_ID
            );

            expect(result.body.correlationId).toBe(HEADER_CORRELATION_ID);
        });

        it.each([
            ["an array body", [1, 2, 3]],
            ["a string body", "not-an-object"],
            ["a numeric body", 42],
            ["a null body", null],
        ])("throws INVALID_RESPONSE_BODY for %s", async (_label, body) => {
            await expect(
                handler.parseResponse(
                    buildResponse(body),
                    REQUEST_CORRELATION_ID
                )
            ).rejects.toMatchObject({ error: INVALID_RESPONSE_BODY });
        });

        it("throws INVALID_RESPONSE_BODY when json() fails to parse", async () => {
            await expect(
                handler.parseResponse(
                    buildResponse(undefined, 200, {}, true),
                    REQUEST_CORRELATION_ID
                )
            ).rejects.toMatchObject({ error: INVALID_RESPONSE_BODY });
        });
    });

    describe("requireHref", () => {
        it("returns the href when it is present", () => {
            const href = handler.requireHref(
                "/api/verify",
                "verify",
                REQUEST_CORRELATION_ID
            );

            expect(href).toBe("/api/verify");
        });

        it("throws INVALID_HAL_RESPONSE when the relation is missing", () => {
            expect(() =>
                handler.requireHref(undefined, "verify", REQUEST_CORRELATION_ID)
            ).toThrow(expect.objectContaining({ error: INVALID_HAL_RESPONSE }));
        });

        it("throws the supplied flow-specific error when the action is missing", () => {
            expect(() =>
                handler.requireHref(
                    undefined,
                    "reset-password",
                    REQUEST_CORRELATION_ID,
                    {
                        code: "reset_password_unsupported",
                        message: "Reset password is unavailable",
                    }
                )
            ).toThrow(
                expect.objectContaining({
                    error: "reset_password_unsupported",
                    errorDescription: "Reset password is unavailable",
                })
            );
        });
    });

    describe("requireContinuationToken", () => {
        it("returns the token when present", () => {
            expect(
                handler.requireContinuationToken("ct", REQUEST_CORRELATION_ID)
            ).toBe("ct");
        });

        it("throws CONTINUATION_TOKEN_MISSING when absent", () => {
            expect(() =>
                handler.requireContinuationToken(
                    undefined,
                    REQUEST_CORRELATION_ID
                )
            ).toThrow(
                expect.objectContaining({
                    error: CONTINUATION_TOKEN_MISSING,
                })
            );
        });
    });

    describe("requireMethods", () => {
        it("returns embedded methods when present", () => {
            const methods = [
                { _links: { challenge: { href: "/api/challenge" } } },
            ];

            expect(
                handler.requireMethods(methods, REQUEST_CORRELATION_ID)
            ).toBe(methods);
        });

        it("throws when embedded methods are absent", () => {
            expect(() =>
                handler.requireMethods(undefined, REQUEST_CORRELATION_ID)
            ).toThrow(
                expect.objectContaining({
                    error: "no_authentication_methods",
                })
            );
        });
    });
});

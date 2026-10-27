/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ResponseHandlerV2 } from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/ResponseHandlerV2.js";
import {
    INVALID_RESPONSE_BODY,
    INVALID_HAL_RESPONSE,
    CONTINUATION_TOKEN_MISSING,
} from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/ErrorCodesV2.js";

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

describe("ResponseHandlerV2", () => {
    let handler: ResponseHandlerV2;

    beforeEach(() => {
        handler = new ResponseHandlerV2();
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

        it("normalizes web_redirect_required from a flat OAuth suberror", async () => {
            const result = await handler.parseResponse(
                buildResponse({
                    error: "invalid_grant",
                    error_description:
                        "AADSTS55214: Non-retryable error has occurred.",
                    error_codes: [55214],
                    timestamp: "2026-10-12 15:43:29Z",
                    trace_id: "c7fe3b84-3596-4d2d-a195-3aa21fb41100",
                    correlation_id: "c556852d-edfa-4040-b472-15a62de49ad5",
                    suberror: "web_redirect_required",
                }),
                REQUEST_CORRELATION_ID
            );

            expect(result.isWebFallbackRequired).toBe(true);
            expect(result.error).toEqual({
                code: "invalid_grant",
                message: "AADSTS55214: Non-retryable error has occurred.",
                errorCodes: [55214],
                subError: "web_redirect_required",
                correlationId: "c556852d-edfa-4040-b472-15a62de49ad5",
                traceId: "c7fe3b84-3596-4d2d-a195-3aa21fb41100",
                timestamp: "2026-10-12 15:43:29Z",
            });
        });

        it("normalizes userNotFound from a nested HAL error", async () => {
            const result = await handler.parseResponse(
                buildResponse({
                    error: {
                        code: "invalidRequest",
                        message:
                            "AADSTS50034: The user account does not exist in the directory.",
                        timestamp: "2026-10-15 11:00:16Z",
                        traceId: "6a72e163-b400-45c1-82d1-2ffe897e1c00",
                        correlationId: "1b387df0-1092-49fd-9afa-503c14ead335",
                        innerError: {
                            code: "userNotFound",
                        },
                    },
                }),
                REQUEST_CORRELATION_ID
            );

            expect(result.error).toEqual({
                code: "invalidRequest",
                message:
                    "AADSTS50034: The user account does not exist in the directory.",
                innerErrorCode: "userNotFound",
                correlationId: "1b387df0-1092-49fd-9afa-503c14ead335",
                traceId: "6a72e163-b400-45c1-82d1-2ffe897e1c00",
                timestamp: "2026-10-15 11:00:16Z",
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

    describe("requireObjectArray", () => {
        const message = "Invalid HAL response: malformed collection";

        it.each([
            { label: "empty", values: [] },
            { label: "object", values: [{ id: "email" }] },
        ])("preserves $label arrays", ({ values }) => {
            expect(
                handler.requireObjectArray(
                    values,
                    message,
                    REQUEST_CORRELATION_ID
                )
            ).toBe(values);
        });
    });

    describe("resolveSignUpAttributes", () => {
        const message =
            "Invalid HAL response: sign-up attributes must be an array of objects with nonempty string attributeId values";

        it("preserves valid attribute metadata", () => {
            const values = [{ attributeId: "username" }];

            expect(
                handler.resolveSignUpAttributes(values, REQUEST_CORRELATION_ID)
            ).toBe(values);
        });

        it("rejects blank attribute identifiers with the field-specific error", () => {
            expect(() =>
                handler.resolveSignUpAttributes(
                    [{ attributeId: "" }],
                    REQUEST_CORRELATION_ID
                )
            ).toThrow(
                expect.objectContaining({
                    error: INVALID_HAL_RESPONSE,
                    errorDescription: message,
                    correlationId: REQUEST_CORRELATION_ID,
                })
            );
        });

        it("defaults absent attributes to an empty collection", () => {
            expect(
                handler.resolveSignUpAttributes(
                    undefined,
                    REQUEST_CORRELATION_ID
                )
            ).toEqual([]);
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

        it.each<{ label: string; methods: unknown }>([
            { label: "absent", methods: undefined },
            { label: "null", methods: null },
            { label: "empty", methods: [] },
        ])(
            "rejects $label embedded methods with the dedicated error",
            ({ methods }) => {
                expect(() =>
                    handler.requireMethods(
                        methods as unknown[] | undefined,
                        REQUEST_CORRELATION_ID
                    )
                ).toThrow(
                    expect.objectContaining({
                        error: "no_authentication_methods",
                        errorDescription:
                            "Invalid HAL response: no embedded authentication methods",
                        correlationId: REQUEST_CORRELATION_ID,
                    })
                );
            }
        );

        it.each<{ label: string; methods: unknown }>([
            { label: "a string", methods: "email" },
            { label: "an empty string", methods: "" },
            { label: "a number", methods: 42 },
            { label: "a boolean", methods: false },
            { label: "an object with length", methods: { length: 1 } },
            { label: "a null entry", methods: [null] },
            { label: "an undefined entry", methods: [undefined] },
            { label: "a numeric entry", methods: [42] },
            { label: "a string entry", methods: ["email"] },
            { label: "an array entry", methods: [[]] },
        ])(
            "rejects malformed embedded methods containing $label",
            ({ methods }) => {
                expect(() =>
                    handler.requireMethods(
                        methods as unknown[],
                        REQUEST_CORRELATION_ID
                    )
                ).toThrow(
                    expect.objectContaining({
                        error: INVALID_HAL_RESPONSE,
                        errorDescription:
                            "Invalid HAL response: embedded authentication methods are malformed",
                        correlationId: REQUEST_CORRELATION_ID,
                    })
                );
            }
        );
    });
});

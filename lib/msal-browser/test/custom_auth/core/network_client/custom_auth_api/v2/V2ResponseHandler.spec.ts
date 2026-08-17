/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { V2ResponseHandler } from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/V2ResponseHandler.js";
import { CustomAuthV2ApiError } from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/error/CustomAuthV2ApiError.js";
import {
    INVALID_RESPONSE_BODY,
    INVALID_HAL_RESPONSE,
    CONTINUATION_TOKEN_MISSING,
} from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/error/V2ErrorCodes.js";

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

    describe("serialize", () => {
        it("reads the correlation id from the response header", async () => {
            const result = await handler.serialize(
                buildResponse({ state: "interactionRequired" }, 200, {
                    "x-ms-request-id": HEADER_CORRELATION_ID,
                }),
                REQUEST_CORRELATION_ID
            );

            expect(result.correlationId).toBe(HEADER_CORRELATION_ID);
            expect(result.statusCode).toBe(200);
        });

        it("falls back to the request correlation id when the header is absent", async () => {
            const result = await handler.serialize(
                buildResponse({}),
                REQUEST_CORRELATION_ID
            );

            expect(result.correlationId).toBe(REQUEST_CORRELATION_ID);
        });

        it("reads the continuation token from camelCase", async () => {
            const result = await handler.serialize(
                buildResponse({ continuationToken: "ct-camel" }),
                REQUEST_CORRELATION_ID
            );

            expect(result.continuationToken).toBe("ct-camel");
        });

        it("reads the continuation token from snake_case", async () => {
            const result = await handler.serialize(
                buildResponse({ continuation_token: "ct-snake" }),
                REQUEST_CORRELATION_ID
            );

            expect(result.continuationToken).toBe("ct-snake");
        });

        it("flags web fallback when the flat error is redirect_to_web", async () => {
            const result = await handler.serialize(
                buildResponse({
                    error: "redirect_to_web",
                    continuation_token: "ct",
                }),
                REQUEST_CORRELATION_ID
            );

            expect(result.isWebFallbackRequired).toBe(true);
        });

        it("flags web fallback when the state is webFallbackRequired", async () => {
            const result = await handler.serialize(
                buildResponse({ state: "webFallbackRequired" }),
                REQUEST_CORRELATION_ID
            );

            expect(result.isWebFallbackRequired).toBe(true);
        });

        it("does not flag web fallback on a normal response", async () => {
            const result = await handler.serialize(
                buildResponse({ state: "interactionRequired" }),
                REQUEST_CORRELATION_ID
            );

            expect(result.isWebFallbackRequired).toBe(false);
        });

        it("normalizes a nested HAL error", async () => {
            const result = await handler.serialize(
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
            const result = await handler.serialize(
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
            const result = await handler.serialize(
                buildResponse({ continuationToken: "ct" }),
                REQUEST_CORRELATION_ID
            );

            expect(result.error).toBeUndefined();
        });

        it("surfaces the header correlation id on the body", async () => {
            const result = await handler.serialize<{ correlationId?: string }>(
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
                handler.serialize(buildResponse(body), REQUEST_CORRELATION_ID)
            ).rejects.toMatchObject({ code: INVALID_RESPONSE_BODY });
        });

        it("throws INVALID_RESPONSE_BODY when json() fails to parse", async () => {
            await expect(
                handler.serialize(
                    buildResponse(undefined, 200, {}, true),
                    REQUEST_CORRELATION_ID
                )
            ).rejects.toMatchObject({ code: INVALID_RESPONSE_BODY });
        });
    });

    describe("requireRelationHref", () => {
        it("returns the href when the relation is present", () => {
            const href = handler.requireRelationHref(
                { verify: { href: "/api/verify" } },
                "verify",
                REQUEST_CORRELATION_ID
            );

            expect(href).toBe("/api/verify");
        });

        it("throws INVALID_HAL_RESPONSE when the relation is missing", () => {
            expect(() =>
                handler.requireRelationHref(
                    { self: { href: "/api/self" } },
                    "verify",
                    REQUEST_CORRELATION_ID
                )
            ).toThrow(expect.objectContaining({ code: INVALID_HAL_RESPONSE }));
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
                expect.objectContaining({ code: CONTINUATION_TOKEN_MISSING })
            );
        });
    });
});

describe("getRelationHref", () => {
    let handler: V2ResponseHandler;

    beforeEach(() => {
        handler = new V2ResponseHandler();
    });

    it("returns the href of a single link", () => {
        expect(
            handler.getRelationHref(
                { challenge: { href: "/api/challenge" } },
                "challenge"
            )
        ).toBe("/api/challenge");
    });

    it("returns the first href of a link array", () => {
        expect(
            handler.getRelationHref(
                {
                    challenge: [
                        { href: "/api/challenge-1" },
                        { href: "/api/challenge-2" },
                    ],
                },
                "challenge"
            )
        ).toBe("/api/challenge-1");
    });

    it("returns undefined when the relation is absent", () => {
        expect(
            handler.getRelationHref(
                { self: { href: "/api/self" } },
                "challenge"
            )
        ).toBeUndefined();
    });

    it("returns undefined when links are undefined", () => {
        expect(handler.getRelationHref(undefined, "challenge")).toBeUndefined();
    });
});

describe("getMethods", () => {
    let handler: V2ResponseHandler;

    beforeEach(() => {
        handler = new V2ResponseHandler();
    });

    it("returns an empty array when there are no embedded methods", () => {
        expect(handler.getMethods({})).toEqual([]);
    });

    it("wraps a single embedded method in an array", () => {
        const method = { _links: { challenge: { href: "/api/challenge" } } };

        expect(handler.getMethods({ _embedded: { methods: method } })).toEqual([
            method,
        ]);
    });

    it("returns an embedded methods array as-is", () => {
        const methods = [
            { _links: { challenge: { href: "/api/challenge-1" } } },
            { _links: { challenge: { href: "/api/challenge-2" } } },
        ];

        expect(handler.getMethods({ _embedded: { methods } })).toEqual(methods);
    });
});

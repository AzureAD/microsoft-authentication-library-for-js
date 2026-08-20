/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    addLegacyRequestFields,
    addResourceField,
    CrossVersionRequest,
    CrossVersionRequestFields,
    LegacyRequestFields,
    normalizeIncomingRequest,
    normalizeResourceField,
} from "../../../src/webBrokerBridge/adapter/CrossVersionRequestAdapter.js";

interface TestRequest extends CrossVersionRequestFields, LegacyRequestFields {
    scopes?: string[];
    correlationId?: string;
    httpMethod?: string;
}

function adaptIncomingRequest(
    request: CrossVersionRequest<TestRequest>
): TestRequest {
    return normalizeIncomingRequest(request);
}

function adaptOutgoingRequest(
    request: TestRequest
): CrossVersionRequest<TestRequest> {
    return addLegacyRequestFields(request);
}

function promoteResource(request: TestRequest): TestRequest {
    return normalizeResourceField(request);
}

function demoteResource(request: TestRequest): TestRequest {
    return addResourceField(request);
}

describe("CrossVersionRequestAdapter", () => {
    const baseRequest = {
        scopes: ["openid"],
        correlationId: "test-corr-id",
    };

    describe("normalizeIncomingRequest", () => {
        it("folds tokenQueryParameters into extraQueryParameters", () => {
            const result = adaptIncomingRequest({
                ...baseRequest,
                tokenQueryParameters: { foo: "bar" },
            });
            expect(result.extraQueryParameters).toEqual({ foo: "bar" });
            expect(result).not.toHaveProperty("tokenQueryParameters");
        });

        it("folds tokenBodyParameters into extraParameters", () => {
            const result = adaptIncomingRequest({
                ...baseRequest,
                tokenBodyParameters: { baz: "qux" },
            });
            expect(result.extraParameters).toEqual({ baz: "qux" });
            expect(result).not.toHaveProperty("tokenBodyParameters");
        });

        it("folds authorizePostBodyParameters into extraParameters", () => {
            const result = adaptIncomingRequest({
                ...baseRequest,
                authorizePostBodyParameters: { auth: "param" },
            });
            expect(result.extraParameters).toEqual({ auth: "param" });
            expect(result).not.toHaveProperty("authorizePostBodyParameters");
        });

        it("merges authorizePostBodyParameters into existing extraParameters", () => {
            const result = adaptIncomingRequest({
                ...baseRequest,
                tokenBodyParameters: { body: "1" },
                authorizePostBodyParameters: { post: "2" },
            });
            expect(result.extraParameters).toEqual({
                body: "1",
                post: "2",
            });
            expect(result).not.toHaveProperty("tokenBodyParameters");
            expect(result).not.toHaveProperty("authorizePostBodyParameters");
        });

        it("merges tokenQueryParameters into existing extraQueryParameters (v5 wins)", () => {
            const result = adaptIncomingRequest({
                ...baseRequest,
                extraQueryParameters: {
                    shared: "currentWins",
                    currentOnly: "yes",
                },
                tokenQueryParameters: {
                    shared: "legacyLoses",
                    legacyOnly: "yes",
                },
            });
            expect(result.extraQueryParameters).toEqual({
                shared: "currentWins",
                currentOnly: "yes",
                legacyOnly: "yes",
            });
            expect(result).not.toHaveProperty("tokenQueryParameters");
        });

        it("merges tokenBodyParameters into existing extraParameters (v5 wins)", () => {
            const result = adaptIncomingRequest({
                ...baseRequest,
                extraParameters: {
                    shared: "currentWins",
                    currentOnly: "yes",
                },
                tokenBodyParameters: {
                    shared: "legacyLoses",
                    legacyOnly: "yes",
                },
            });
            expect(result.extraParameters).toEqual({
                shared: "currentWins",
                currentOnly: "yes",
                legacyOnly: "yes",
            });
            expect(result).not.toHaveProperty("tokenBodyParameters");
        });

        it("merges authorizePostBodyParameters into existing extraParameters (v5 wins)", () => {
            const result = adaptIncomingRequest({
                ...baseRequest,
                extraParameters: {
                    shared: "currentWins",
                    currentOnly: "yes",
                },
                authorizePostBodyParameters: {
                    shared: "legacyLoses",
                    legacyOnly: "yes",
                },
            });
            expect(result.extraParameters).toEqual({
                shared: "currentWins",
                currentOnly: "yes",
                legacyOnly: "yes",
            });
            expect(result).not.toHaveProperty("authorizePostBodyParameters");
        });

        it("does not mutate the input request", () => {
            const request = {
                ...baseRequest,
                tokenQueryParameters: { foo: "bar" },
                tokenBodyParameters: { baz: "qux" },
                authorizePostBodyParameters: { auth: "param" },
            };
            adaptIncomingRequest(request);
            expect(request.tokenQueryParameters).toEqual({ foo: "bar" });
            expect(request.tokenBodyParameters).toEqual({ baz: "qux" });
            expect(request.authorizePostBodyParameters).toEqual({
                auth: "param",
            });
            expect(request).not.toHaveProperty("extraQueryParameters");
            expect(request).not.toHaveProperty("extraParameters");
        });

        it("is idempotent on a v5 request", () => {
            const result = adaptIncomingRequest({
                ...baseRequest,
                extraQueryParameters: { q: "1" },
                extraParameters: { p: "2" },
            });
            expect(result.extraQueryParameters).toEqual({ q: "1" });
            expect(result.extraParameters).toEqual({ p: "2" });
        });

        it("handles empty request with no extra parameters", () => {
            const result = adaptIncomingRequest(baseRequest);
            expect(result.extraQueryParameters).toBeUndefined();
            expect(result.extraParameters).toBeUndefined();
        });
    });

    describe("addLegacyRequestFields", () => {
        it("copies extraQueryParameters to tokenQueryParameters", () => {
            const result = adaptOutgoingRequest({
                ...baseRequest,
                extraQueryParameters: { foo: "bar" },
            });
            expect(result.tokenQueryParameters).toEqual({ foo: "bar" });
            expect(result.extraQueryParameters).toEqual({ foo: "bar" });
        });

        it("sets tokenBodyParameters and merges extraParameters into extraQueryParameters", () => {
            const result = adaptOutgoingRequest({
                ...baseRequest,
                extraParameters: { baz: "qux" },
            });
            expect(result.tokenBodyParameters).toEqual({ baz: "qux" });
            expect(result.extraQueryParameters).toEqual({ baz: "qux" });
            expect(result.tokenQueryParameters).toBeUndefined();
            expect(result.authorizePostBodyParameters).toBeUndefined();
            expect(result.extraParameters).toEqual({ baz: "qux" });
        });

        it("httpMethod POST does not change extraParameters handling", () => {
            const result = adaptOutgoingRequest({
                ...baseRequest,
                httpMethod: "POST",
                extraParameters: { baz: "qux" },
            });
            expect(result.tokenBodyParameters).toEqual({ baz: "qux" });
            expect(result.extraQueryParameters).toEqual({ baz: "qux" });
            expect(result.authorizePostBodyParameters).toBeUndefined();
            expect(result.extraParameters).toEqual({ baz: "qux" });
        });

        it("merges extraParameters into extraQueryParameters (extraParameters wins)", () => {
            const result = adaptOutgoingRequest({
                ...baseRequest,
                extraQueryParameters: {
                    shared: "original",
                    qsOnly: "yes",
                },
                extraParameters: {
                    shared: "fromBody",
                    bodyOnly: "yes",
                },
            });
            expect(result.extraQueryParameters).toEqual({
                shared: "fromBody",
                qsOnly: "yes",
                bodyOnly: "yes",
            });
            expect(result.tokenQueryParameters).toEqual({
                shared: "original",
                qsOnly: "yes",
            });
            expect(result.authorizePostBodyParameters).toBeUndefined();
        });

        it("httpMethod POST does not change merge precedence", () => {
            const result = adaptOutgoingRequest({
                ...baseRequest,
                httpMethod: "POST",
                extraQueryParameters: {
                    shared: "original",
                    qsOnly: "yes",
                },
                extraParameters: {
                    shared: "fromBody",
                    bodyOnly: "yes",
                },
            });
            expect(result.extraQueryParameters).toEqual({
                shared: "fromBody",
                qsOnly: "yes",
                bodyOnly: "yes",
            });
            expect(result.tokenQueryParameters).toEqual({
                shared: "original",
                qsOnly: "yes",
            });
            expect(result.tokenBodyParameters).toEqual({
                shared: "fromBody",
                bodyOnly: "yes",
            });
            expect(result.authorizePostBodyParameters).toBeUndefined();
        });

        it("does not mutate the input request", () => {
            const request = {
                ...baseRequest,
                extraQueryParameters: { foo: "bar" },
            };
            adaptOutgoingRequest(request);
            expect(request).not.toHaveProperty("tokenQueryParameters");
        });

        it("is idempotent when called multiple times", () => {
            const request = {
                ...baseRequest,
                extraQueryParameters: { q: "1" },
                extraParameters: { p: "2" },
            };
            const result1 = adaptOutgoingRequest(request);
            const result2 = adaptOutgoingRequest(request);
            expect(result1).toEqual(result2);
            expect(result1.tokenQueryParameters).toEqual({ q: "1" });
            expect(result1.tokenBodyParameters).toEqual({ p: "2" });
            expect(result1.authorizePostBodyParameters).toBeUndefined();
            expect(result1.extraQueryParameters).toEqual({
                q: "1",
                p: "2",
            });
        });

        it("handles empty request with no extra parameters", () => {
            const result = adaptOutgoingRequest(baseRequest);
            expect(result.tokenQueryParameters).toBeUndefined();
            expect(result.tokenBodyParameters).toBeUndefined();
            expect(result.authorizePostBodyParameters).toBeUndefined();
        });
    });

    describe("round-trip compatibility", () => {
        it("v4 request with distinct per-endpoint params round-trips correctly", () => {
            const normalized = adaptIncomingRequest({
                ...baseRequest,
                extraQueryParameters: { authorize_only: "1" },
                tokenQueryParameters: { token_only: "2" },
                tokenBodyParameters: { token_body: "3" },
                authorizePostBodyParameters: { auth_body: "4" },
            });
            expect(normalized.extraQueryParameters).toEqual({
                authorize_only: "1",
                token_only: "2",
            });
            expect(normalized.extraParameters).toEqual({
                token_body: "3",
                auth_body: "4",
            });
            expect(normalized).not.toHaveProperty("tokenQueryParameters");
            expect(normalized).not.toHaveProperty("tokenBodyParameters");
            expect(normalized).not.toHaveProperty(
                "authorizePostBodyParameters"
            );
        });

        it("v4 → normalize → addLegacy preserves all params", () => {
            const normalized = adaptIncomingRequest({
                ...baseRequest,
                tokenQueryParameters: { query: "val" },
                tokenBodyParameters: { body: "val" },
                authorizePostBodyParameters: { authBody: "val" },
            });
            expect(normalized.extraQueryParameters).toEqual({
                query: "val",
            });
            expect(normalized.extraParameters).toEqual({
                body: "val",
                authBody: "val",
            });

            const withLegacy = adaptOutgoingRequest(normalized);
            expect(withLegacy.tokenQueryParameters).toEqual({
                query: "val",
            });
            expect(withLegacy.tokenBodyParameters).toEqual({
                body: "val",
                authBody: "val",
            });
            expect(withLegacy.authorizePostBodyParameters).toBeUndefined();
            expect(withLegacy.extraQueryParameters).toEqual({
                query: "val",
                body: "val",
                authBody: "val",
            });
        });

        test.each(["GET", "POST"])(
            "v5 %s → addLegacy → normalize preserves all params",
            (httpMethod) => {
                const withLegacy = adaptOutgoingRequest({
                    ...baseRequest,
                    ...(httpMethod === "POST" ? { httpMethod } : {}),
                    extraQueryParameters: { query: "val" },
                    extraParameters: { body: "val" },
                });
                expect(withLegacy.tokenQueryParameters).toEqual({
                    query: "val",
                });
                expect(withLegacy.tokenBodyParameters).toEqual({
                    body: "val",
                });
                expect(withLegacy.authorizePostBodyParameters).toBeUndefined();
                expect(withLegacy.extraQueryParameters).toEqual({
                    query: "val",
                    body: "val",
                });

                const normalized = adaptIncomingRequest(withLegacy);
                expect(normalized.extraQueryParameters).toEqual({
                    query: "val",
                    body: "val",
                });
                expect(normalized.extraParameters).toEqual({
                    body: "val",
                });
                expect(normalized).not.toHaveProperty("tokenQueryParameters");
                expect(normalized).not.toHaveProperty("tokenBodyParameters");
                expect(normalized).not.toHaveProperty(
                    "authorizePostBodyParameters"
                );
            }
        );
    });

    describe("resource compatibility", () => {
        it("preserves other extraParameters when promoting resource", () => {
            const result = promoteResource({
                ...baseRequest,
                extraParameters: {
                    resource: "https://resource.example.com",
                    other: "value",
                },
            });
            expect(result.resource).toBe("https://resource.example.com");
            expect(result.extraParameters).toEqual({ other: "value" });
        });

        it("returns request unchanged when no extraParameters.resource", () => {
            const result = promoteResource({
                ...baseRequest,
                extraParameters: { other: "value" },
            });
            expect(result.resource).toBeUndefined();
            expect(result.extraParameters).toEqual({ other: "value" });
        });

        it("does not mutate extraParameters.resource", () => {
            const request = {
                ...baseRequest,
                extraParameters: {
                    resource: "https://resource.example.com",
                },
            };
            promoteResource(request);
            expect(request).not.toHaveProperty("resource");
            expect(request.extraParameters.resource).toBe(
                "https://resource.example.com"
            );
        });

        it("merges into existing extraParameters when demoting resource", () => {
            const result = demoteResource({
                ...baseRequest,
                resource: "https://resource.example.com",
                extraParameters: { other: "value" },
            });
            expect(result.resource).toBeUndefined();
            expect(result.extraParameters).toEqual({
                other: "value",
                resource: "https://resource.example.com",
            });
        });

        it("returns request unchanged when no resource", () => {
            const result = demoteResource({
                ...baseRequest,
                extraParameters: { other: "value" },
            });
            expect(result.resource).toBeUndefined();
            expect(result.extraParameters).toEqual({ other: "value" });
        });

        it("does not mutate top-level resource", () => {
            const request = {
                ...baseRequest,
                resource: "https://resource.example.com",
            };
            demoteResource(request);
            expect(request.resource).toBe("https://resource.example.com");
            expect(request).not.toHaveProperty("extraParameters");
        });

        it("normalizeResourceField → addResourceField round-trips", () => {
            const promoted = promoteResource({
                ...baseRequest,
                extraParameters: {
                    resource: "https://resource.example.com",
                },
            });
            expect(promoted.resource).toBe("https://resource.example.com");
            expect(promoted.extraParameters).toEqual({});

            const demoted = demoteResource(promoted);
            expect(demoted.resource).toBeUndefined();
            expect(demoted.extraParameters).toEqual({
                resource: "https://resource.example.com",
            });
        });

        it("addResourceField → normalizeResourceField round-trips", () => {
            const demoted = demoteResource({
                ...baseRequest,
                resource: "https://resource.example.com",
            });
            expect(demoted.resource).toBeUndefined();
            expect(demoted.extraParameters?.resource).toBe(
                "https://resource.example.com"
            );

            const promoted = promoteResource(demoted);
            expect(promoted.resource).toBe("https://resource.example.com");
            expect(promoted.extraParameters).toEqual({});
        });
    });
});

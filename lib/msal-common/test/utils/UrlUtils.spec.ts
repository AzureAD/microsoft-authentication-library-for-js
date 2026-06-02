import * as UrlUtils from "../../src/utils/UrlUtils";

describe("UrlUtils.ts Class Unit Tests", () => {
    describe("stripLeadingHashOrQuery Tests", () => {
        it("strips leading # if present", () => {
            expect(UrlUtils.stripLeadingHashOrQuery("#value")).toEqual("value");
        });

        it("strips leading ? if present", () => {
            expect(UrlUtils.stripLeadingHashOrQuery("?value")).toEqual("value");
        });

        it("strips leading #/ if present", () => {
            expect(UrlUtils.stripLeadingHashOrQuery("#/value")).toEqual(
                "value"
            );
        });

        it("returns input as-is if # or ? are not present", () => {
            expect(UrlUtils.stripLeadingHashOrQuery("value")).toEqual("value");
        });
    });

    describe("getDeserializedResponse Tests", () => {
        it("getDeserializedResponse returns object if hash contains known properties", () => {
            expect(UrlUtils.getDeserializedResponse("#code=value")).toEqual({
                code: "value",
            });
            expect(UrlUtils.getDeserializedResponse("#state=value")).toEqual({
                state: "value",
            });
            expect(UrlUtils.getDeserializedResponse("#error=value")).toEqual({
                error: "value",
            });
            expect(
                UrlUtils.getDeserializedResponse("#error_description=value")
            ).toEqual({ error_description: "value" });
        });

        it("getDeserializedResponse returns object if query string contains known properties", () => {
            expect(UrlUtils.getDeserializedResponse("?code=value")).toEqual({
                code: "value",
            });
            expect(UrlUtils.getDeserializedResponse("?state=value")).toEqual({
                state: "value",
            });
            expect(UrlUtils.getDeserializedResponse("?error=value")).toEqual({
                error: "value",
            });
            expect(
                UrlUtils.getDeserializedResponse("?error_description=value")
            ).toEqual({ error_description: "value" });
        });

        it("getDeserializedResponse returns the hash as a deserialized object", () => {
            const serializedHash =
                "#code=value1&state=value2&client_info=value3";
            const deserializedHash = {
                code: "value1",
                state: "value2",
                client_info: "value3",
            };

            expect(UrlUtils.getDeserializedResponse(serializedHash)).toEqual(
                deserializedHash
            );
        });

        it("getDeserializedResponse returns the queryString as a deserialized object", () => {
            const serializedHash =
                "?code=value1&state=value2&client_info=value3";
            const deserializedHash = {
                code: "value1",
                state: "value2",
                client_info: "value3",
            };

            expect(UrlUtils.getDeserializedResponse(serializedHash)).toEqual(
                deserializedHash
            );
        });

        it("getDeserializedResponse returns null if key/value is undefined", () => {
            expect(UrlUtils.getDeserializedResponse("#")).toBe(null);
            expect(UrlUtils.getDeserializedResponse("?")).toBe(null);
            expect(UrlUtils.getDeserializedResponse("#=value1")).toBe(null);
            expect(UrlUtils.getDeserializedResponse("?=value1")).toBe(null);
            expect(UrlUtils.getDeserializedResponse("#key1=")).toBe(null);
            expect(UrlUtils.getDeserializedResponse("?key1=")).toBe(null);
        });
    });

    describe("normalizeUrlForComparison Tests", () => {
        it("normalizes URLs with encoded vs decoded apostrophes to be equal", () => {
            const urlWithEncodedApostrophe =
                "https://localhost:4200/profile?comments=blah%27blah";
            const urlWithDecodedApostrophe =
                "https://localhost:4200/profile?comments=blah'blah";

            const normalizedEncoded = UrlUtils.normalizeUrlForComparison(
                urlWithEncodedApostrophe
            );
            const normalizedDecoded = UrlUtils.normalizeUrlForComparison(
                urlWithDecodedApostrophe
            );

            expect(normalizedEncoded).toEqual(normalizedDecoded);
        });

        it("removes hash from URL before comparison", () => {
            const urlWithHash = "https://example.com/path?param=value#hash";
            const urlWithoutHash = "https://example.com/path?param=value";

            const normalizedWithHash =
                UrlUtils.normalizeUrlForComparison(urlWithHash);
            const normalizedWithoutHash =
                UrlUtils.normalizeUrlForComparison(urlWithoutHash);

            expect(normalizedWithHash).toEqual(normalizedWithoutHash);
        });

        it("handles URLs with multiple encoded characters", () => {
            const urlWithEncoded =
                "https://example.com/path?name=John%20Doe%27s%20Test&other=value";
            const urlWithDecoded =
                "https://example.com/path?name=John Doe's Test&other=value";

            const normalizedEncoded =
                UrlUtils.normalizeUrlForComparison(urlWithEncoded);
            const normalizedDecoded =
                UrlUtils.normalizeUrlForComparison(urlWithDecoded);

            expect(normalizedEncoded).toEqual(normalizedDecoded);
        });

        it("returns empty string for empty input", () => {
            expect(UrlUtils.normalizeUrlForComparison("")).toEqual("");
        });

        it("returns original value for null/undefined input", () => {
            expect(UrlUtils.normalizeUrlForComparison(null as any)).toBe(null);
            expect(UrlUtils.normalizeUrlForComparison(undefined as any)).toBe(
                undefined
            );
        });

        it("handles malformed URLs gracefully", () => {
            const malformedUrl = "not-a-valid-url";
            // Should not throw and should return a canonicalized version
            expect(() =>
                UrlUtils.normalizeUrlForComparison(malformedUrl)
            ).not.toThrow();
        });

        it("preserves case in path segments (RFC 3986 case-sensitive)", () => {
            const url = "https://example.com/MyPath/SubPath?param=value";
            const normalized = UrlUtils.normalizeUrlForComparison(url);

            expect(normalized).toContain("/MyPath/SubPath/");
        });

        it("preserves case in query parameter values (RFC 3986 case-sensitive)", () => {
            const url = "https://example.com/path?token=AbCdEfGh&state=XyZ123";
            const normalized = UrlUtils.normalizeUrlForComparison(url);

            expect(normalized).toContain("token=AbCdEfGh");
            expect(normalized).toContain("state=XyZ123");
        });

        it("lowercases only the scheme and host", () => {
            const url =
                "HTTPS://EXAMPLE.COM/CaseSensitivePath?Key=CaseSensitiveValue";
            const normalized = UrlUtils.normalizeUrlForComparison(url);

            expect(normalized).toContain("https://example.com/");
            expect(normalized).toContain("/CaseSensitivePath/");
            expect(normalized).toContain("Key=CaseSensitiveValue");
        });

        it("does not corrupt base64-encoded query parameter values", () => {
            const base64Token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9";
            const url = `https://example.com/path?token=${base64Token}`;
            const normalized = UrlUtils.normalizeUrlForComparison(url);

            expect(normalized).toContain(`token=${base64Token}`);
        });

        it("treats URLs with different host casing as equal", () => {
            const url1 = "https://Example.COM/path?param=value";
            const url2 = "https://example.com/path?param=value";

            expect(UrlUtils.normalizeUrlForComparison(url1)).toEqual(
                UrlUtils.normalizeUrlForComparison(url2)
            );
        });

        it("treats URLs with different path casing as different", () => {
            const url1 = "https://example.com/Path";
            const url2 = "https://example.com/path";

            expect(UrlUtils.normalizeUrlForComparison(url1)).not.toEqual(
                UrlUtils.normalizeUrlForComparison(url2)
            );
        });

        it("treats URLs with different query param value casing as different", () => {
            const url1 = "https://example.com/path?token=ABC";
            const url2 = "https://example.com/path?token=abc";

            expect(UrlUtils.normalizeUrlForComparison(url1)).not.toEqual(
                UrlUtils.normalizeUrlForComparison(url2)
            );
        });

        it("normalizes trailing slash on pathname", () => {
            const url1 = "https://example.com/path";
            const url2 = "https://example.com/path/";

            expect(UrlUtils.normalizeUrlForComparison(url1)).toEqual(
                UrlUtils.normalizeUrlForComparison(url2)
            );
        });
    });
});

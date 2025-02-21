import { ParsedUrlError } from "../../../src/core/error/ParsedUrlError.js";
import { UrlUtils } from "../../../src/core/utils/UrlUtils.js";

describe("UrlUtils", () => {
    describe("IsValidSecureUrl", () => {
        it("should return true for a valid HTTPS URL", () => {
            const url = "https://example.com";
            const result = UrlUtils.IsValidSecureUrl(url);
            expect(result).toBe(true);
        });

        it("should return false for a non-HTTPS URL", () => {
            const url = "http://example.com";
            const result = UrlUtils.IsValidSecureUrl(url);
            expect(result).toBe(false);
        });

        it("should return false for an invalid URL", () => {
            const url = "invalid-url";
            const result = UrlUtils.IsValidSecureUrl(url);
            expect(result).toBe(false);
        });

        it("should return false for an empty string", () => {
            const url = "";
            const result = UrlUtils.IsValidSecureUrl(url);
            expect(result).toBe(false);
        });
    });

    describe("parseUrl", () => {
        it("should return a valid URL object for a correct URL", () => {
            const url = "https://example.com";
            const result = UrlUtils.parseUrl(url);
            expect(result).toBeInstanceOf(URL);
            expect(result.origin).toBe(url);
        });

        it("should throw ParsedUrlError for an invalid URL", () => {
            const url = "invalid-url";
            expect(() => UrlUtils.parseUrl(url)).toThrow(
                new ParsedUrlError("invalid_url", `The URL "${url}" is invalid: TypeError: Invalid URL: invalid-url`),
            );
        });
    });

    describe("parseSecureUrl", () => {
        it("should return a valid URL object for a correct HTTPS URL", () => {
            const url = "https://example.com";
            const result = UrlUtils.parseSecureUrl(url);
            expect(result).toBeInstanceOf(URL);
            expect(result.origin).toBe(url);
        });

        it("should throw ParsedUrlError if the URL is not HTTPS", () => {
            const url = "http://example.com";
            expect(() => UrlUtils.parseSecureUrl(url)).toThrow(
                new ParsedUrlError("unsecure_url", `The URL "${url}" is not secure. Only HTTPS URLs are supported.`),
            );
        });

        it("should throw ParsedUrlError for an invalid URL", () => {
            const url = "invalid-url";
            expect(() => UrlUtils.parseSecureUrl(url)).toThrow(
                new ParsedUrlError("invalid_url", `The URL "${url}" is invalid: TypeError: Invalid URL: invalid-url`),
            );
        });
    });

    describe("buildUrl", () => {
        test("should correctly construct a URL when baseUrl does not end with a slash and path does not start with a slash", () => {
            const result = UrlUtils.buildUrl("https://example.com", "path/to/resource");
            expect(result.toString()).toBe("https://example.com/path/to/resource");
        });

        test("should correctly construct a URL when baseUrl ends with a slash and path does not start with a slash", () => {
            const result = UrlUtils.buildUrl("https://example.com/", "path/to/resource");
            expect(result.toString()).toBe("https://example.com/path/to/resource");
        });

        test("should correctly construct a URL when baseUrl does not end with a slash and path starts with a slash", () => {
            const result = UrlUtils.buildUrl("https://example.com", "/path/to/resource");
            expect(result.toString()).toBe("https://example.com/path/to/resource");
        });

        test("should correctly construct a URL when baseUrl ends with a slash and path starts with a slash", () => {
            const result = UrlUtils.buildUrl("https://example.com/", "/path/to/resource");
            expect(result.toString()).toBe("https://example.com/path/to/resource");
        });

        test("should correctly construct a URL with query parameters", () => {
            const result = UrlUtils.buildUrl("https://example.com", "path?query=1");
            expect(result.toString()).toBe("https://example.com/path?query=1");
        });

        test("should correctly construct a URL when baseUrl contains a subpath", () => {
            const result = UrlUtils.buildUrl("https://example.com/sub", "path/to/resource");
            expect(result.toString()).toBe("https://example.com/sub/path/to/resource");
        });
    });
});

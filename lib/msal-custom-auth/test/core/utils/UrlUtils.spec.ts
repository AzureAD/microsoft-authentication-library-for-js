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
        test.each([
            [
                "baseUrl does not end with a slash and path does not start with a slash",
                "https://example.com",
                "path/to/resource",
                "https://example.com/path/to/resource",
            ],
            [
                "baseUrl ends with a slash and path does not start with a slash",
                "https://example.com/",
                "path/to/resource",
                "https://example.com/path/to/resource",
            ],
            [
                "baseUrl does not end with a slash and path starts with a slash",
                "https://example.com",
                "/path/to/resource",
                "https://example.com/path/to/resource",
            ],
            [
                "baseUrl ends with a slash and path starts with a slash",
                "https://example.com/",
                "/path/to/resource",
                "https://example.com/path/to/resource",
            ],
            ["URL with query parameters", "https://example.com", "path?query=1", "https://example.com/path?query=1"],
            [
                "baseUrl contains a subpath",
                "https://example.com/sub",
                "path/to/resource",
                "https://example.com/sub/path/to/resource",
            ],
        ])("should correctly construct a URL when %s", (name, baseUrl, path, expected) => {
            const result = UrlUtils.buildUrl(baseUrl, path);
            expect(result.toString()).toBe(expected);
        });
    });

    describe("IsValidUrl", () => {
        test.each([
            [true, "https://example.com"],
            [true, "http://example.com"],
            [false, "invalid-url"],
            [false, ""],
        ])("should return %s for URL '%s'", (expected, url) => {
            const result = UrlUtils.IsValidUrl(url);
            expect(result).toBe(expected);
        });
    });
});

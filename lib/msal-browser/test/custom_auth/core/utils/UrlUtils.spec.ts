import { ParsedUrlError } from "../../../../src/custom_auth/core/error/ParsedUrlError.js";
import {
    buildUrl,
    parseUrl,
} from "../../../../src/custom_auth/core/utils/UrlUtils.js";

describe("UrlUtils", () => {
    describe("parseUrl", () => {
        it("should return a valid URL object for a correct URL", () => {
            const url = "https://example.com";
            const result = parseUrl(url);
            expect(result).toBeInstanceOf(URL);
            expect(result.origin).toBe(url);
        });

        it("should throw ParsedUrlError for an invalid URL", () => {
            const url = "invalid-url";
            expect(() => parseUrl(url)).toThrow(
                new ParsedUrlError(
                    "invalid_url",
                    `The URL "${url}" is invalid: TypeError: Invalid URL: invalid-url`
                )
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
            [
                "URL with query parameters",
                "https://example.com",
                "path?query=1",
                "https://example.com/path?query=1",
            ],
            [
                "baseUrl contains a subpath",
                "https://example.com/sub",
                "path/to/resource",
                "https://example.com/sub/path/to/resource",
            ],
        ])(
            "should correctly construct a URL when %s",
            (name, baseUrl, path, expected) => {
                const result = buildUrl(baseUrl, path);
                expect(result.toString()).toBe(expected);
            }
        );
    });
});

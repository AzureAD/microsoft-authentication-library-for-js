import { ParsedUrlError } from "../../../../src/custom_auth/core/error/ParsedUrlError.js";
import {
    addQueryParametersToUrl,
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

    describe("addQueryParametersToUrl", () => {
        it("should add dc query parameter to URL", () => {
            const url = new URL("https://example.com/path");
            const queryParams = { dc: "datacenter1" };

            addQueryParametersToUrl(url, queryParams);

            expect(url.searchParams.get("dc")).toBe("datacenter1");
            expect(url.toString()).toBe(
                "https://example.com/path?dc=datacenter1"
            );
        });

        it("should add slice query parameter to URL", () => {
            const url = new URL("https://example.com/path");
            const queryParams = { slice: "slice2" };

            addQueryParametersToUrl(url, queryParams);

            expect(url.searchParams.get("slice")).toBe("slice2");
            expect(url.toString()).toBe(
                "https://example.com/path?slice=slice2"
            );
        });

        it("should add both dc and slice query parameters to URL", () => {
            const url = new URL("https://example.com/path");
            const queryParams = { dc: "datacenter1", slice: "slice2" };

            addQueryParametersToUrl(url, queryParams);

            expect(url.searchParams.get("dc")).toBe("datacenter1");
            expect(url.searchParams.get("slice")).toBe("slice2");
            expect(url.toString()).toBe(
                "https://example.com/path?dc=datacenter1&slice=slice2"
            );
        });

        it("should not modify URL when extraQueryParameters is undefined", () => {
            const url = new URL("https://example.com/path");
            const originalUrl = url.toString();

            addQueryParametersToUrl(url, undefined);

            expect(url.toString()).toBe(originalUrl);
        });

        it("should handle empty extraQueryParameters object", () => {
            const url = new URL("https://example.com/path");
            const originalUrl = url.toString();

            addQueryParametersToUrl(url, {});

            expect(url.toString()).toBe(originalUrl);
        });

        it("should preserve existing query parameters", () => {
            const url = new URL("https://example.com/path?existing=value");
            const queryParams = { dc: "datacenter1" };

            addQueryParametersToUrl(url, queryParams);

            expect(url.searchParams.get("existing")).toBe("value");
            expect(url.searchParams.get("dc")).toBe("datacenter1");
            expect(url.toString()).toBe(
                "https://example.com/path?existing=value&dc=datacenter1"
            );
        });

        it("should overwrite existing query parameters with same key", () => {
            const url = new URL("https://example.com/path?dc=old");
            const queryParams = { dc: "new" };

            addQueryParametersToUrl(url, queryParams);

            expect(url.searchParams.get("dc")).toBe("new");
            expect(url.toString()).toBe("https://example.com/path?dc=new");
        });
    });
});

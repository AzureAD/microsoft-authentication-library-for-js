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

    describe("buildUrl with customAuthApiQueryParams", () => {
        it("should add dc query parameter to URL", () => {
            const customAuthApiQueryParams = { dc: "datacenter1" };
            const result = buildUrl(
                "https://example.com",
                "path",
                customAuthApiQueryParams
            );

            expect(result.searchParams.get("dc")).toBe("datacenter1");
            expect(result.toString()).toBe(
                "https://example.com/path?dc=datacenter1"
            );
        });

        it("should add slice query parameter to URL", () => {
            const customAuthApiQueryParams = { slice: "slice2" };
            const result = buildUrl(
                "https://example.com",
                "path",
                customAuthApiQueryParams
            );

            expect(result.searchParams.get("slice")).toBe("slice2");
            expect(result.toString()).toBe(
                "https://example.com/path?slice=slice2"
            );
        });

        it("should add both dc and slice query parameters to URL", () => {
            const customAuthApiQueryParams = {
                dc: "datacenter1",
                slice: "slice2",
            };
            const result = buildUrl(
                "https://example.com",
                "path",
                customAuthApiQueryParams
            );

            expect(result.searchParams.get("dc")).toBe("datacenter1");
            expect(result.searchParams.get("slice")).toBe("slice2");
            expect(result.toString()).toBe(
                "https://example.com/path?dc=datacenter1&slice=slice2"
            );
        });

        it("should not add query parameters when customAuthApiQueryParams is undefined", () => {
            const result = buildUrl("https://example.com", "path", undefined);

            expect(result.toString()).toBe("https://example.com/path");
        });

        it("should handle empty customAuthApiQueryParams object", () => {
            const result = buildUrl("https://example.com", "path", {});

            expect(result.toString()).toBe("https://example.com/path");
        });

        it("should preserve existing query parameters in path", () => {
            const customAuthApiQueryParams = { dc: "datacenter1" };
            const result = buildUrl(
                "https://example.com",
                "path?existing=value",
                customAuthApiQueryParams
            );

            expect(result.searchParams.get("existing")).toBe("value");
            expect(result.searchParams.get("dc")).toBe("datacenter1");
            expect(result.toString()).toBe(
                "https://example.com/path?existing=value&dc=datacenter1"
            );
        });

        it("should overwrite existing query parameters with same key", () => {
            const customAuthApiQueryParams = { dc: "new" };
            const result = buildUrl(
                "https://example.com",
                "path?dc=old",
                customAuthApiQueryParams
            );

            expect(result.searchParams.get("dc")).toBe("new");
            expect(result.toString()).toBe("https://example.com/path?dc=new");
        });

        it("should handle null and undefined values in customAuthApiQueryParams", () => {
            const customAuthApiQueryParams = {
                dc: null as any,
                slice: undefined as any,
            };
            const result = buildUrl(
                "https://example.com",
                "path",
                customAuthApiQueryParams
            );

            expect(result.searchParams.get("dc")).toBeNull();
            expect(result.searchParams.get("slice")).toBeNull();
            expect(result.toString()).toBe("https://example.com/path");
        });
    });
});

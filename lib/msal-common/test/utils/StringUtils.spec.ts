import { StringUtils } from "../../src/utils/StringUtils";

describe("StringUtils.ts Class Unit Tests", () => {
    it("isEmptyObject correctly identifies empty stringified objects", () => {
        expect(StringUtils.isEmptyObj(undefined)).toBe(true);
        // @ts-ignore
        expect(StringUtils.isEmptyObj(null)).toBe(true);
        expect(StringUtils.isEmptyObj("")).toBe(true);
        expect(StringUtils.isEmptyObj("{}")).toBe(true);
        expect(StringUtils.isEmptyObj("{ }")).toBe(true);
        expect(StringUtils.isEmptyObj("{   }")).toBe(true);
        expect(StringUtils.isEmptyObj("Non-object string")).toBe(true);
        const exampleObj = {
            valid: true,
        };
        expect(StringUtils.isEmptyObj(JSON.stringify(exampleObj))).toBe(false);
    });

    it("startsWith returns true if given string starts with given substring", () => {
        const testString = "This is a test string";
        const searchString = "This";
        expect(StringUtils.startsWith(testString, searchString)).toBe(true);
    });

    it("startsWith returns false if given string does not start with given substring", () => {
        const testString = "This is a test string";
        const searchString = "test";
        expect(StringUtils.startsWith(testString, searchString)).toBe(false);
    });

    it("endsWith returns true if given string ends with given substring", () => {
        const testString = "This is a test string";
        const searchString = "string";
        expect(StringUtils.endsWith(testString, searchString)).toBe(true);
    });

    it("endsWith returns false if given string does not end with given substring", () => {
        const testString = "This is a test string";
        const searchString = "test";
        expect(StringUtils.endsWith(testString, searchString)).toBe(false);
    });

    it("endsWith returns false if given string is shorter than substring to search for", () => {
        const testString = "test";
        const searchString = "tests";
        expect(StringUtils.endsWith(testString, searchString)).toBe(false);
    });

    it("queryStringToObject correctly deserializes query string into object", () => {
        const serializedObj = "param1=value1&param2=value2&param3=value3";
        const deserializedObj = {
            param1: "value1",
            param2: "value2",
            param3: "value3",
        };
        expect(StringUtils.queryStringToObject(serializedObj)).toEqual(
            deserializedObj
        );
    });

    it("trimArrayEntries() correctly trims entries in an array", () => {
        const arr = ["S1", " S2  ", " S3 "];
        expect(StringUtils.trimArrayEntries(arr)).toEqual(["S1", "S2", "S3"]);
    });

    it("removeEmptyStringsFromArray() removes empty strings from an array", () => {});

    it("queryStringToObject correctly deserializes URI encoded query string into decoded object", () => {
        const serializedObj = "param1=test%2525u00f1";
        const deserializedObj = {
            param1: "test%25u00f1",
        };
        expect(StringUtils.queryStringToObject(serializedObj)).toEqual(
            deserializedObj
        );
    });

    describe("jsonParseHelper", () => {
        it("parses json", () => {
            const test = { test: "json" };
            const jsonString = JSON.stringify(test);
            const parsedVal = StringUtils.jsonParseHelper(jsonString);
            expect(parsedVal).toEqual(test);
        });

        it("returns null on error", () => {
            // @ts-ignore
            const parsedValNull = StringUtils.jsonParseHelper(null);
            const parsedValEmptyString = StringUtils.jsonParseHelper("");
            expect(parsedValNull).toBeNull();
            expect(parsedValEmptyString).toBeNull();
        });
    });

    describe("matchPattern", () => {
        it("no wildcard", () => {
            const matches = StringUtils.matchPattern(
                "https://myapplication.com/user/1",
                "https://myapplication.com/user/1"
            );

            expect(matches).toBe(true);
        });

        it("single wildcard", () => {
            const matches = StringUtils.matchPattern(
                "https://myapplication.com/user/*",
                "https://myapplication.com/user/1"
            );

            expect(matches).toBe(true);
        });

        it("multiple wildcards", () => {
            const matches = StringUtils.matchPattern(
                "https://*.myapplication.com/user/*",
                "https://test.myapplication.com/user/1"
            );

            expect(matches).toBe(true);
        });

        it("backslash is escaped", () => {
            const matches = StringUtils.matchPattern("test\\*", "test\\api");

            expect(matches).toBe(true);
        });
    });

    describe("matchPatternStrict", () => {
        describe("host component - wildcard stays within a single DNS label", () => {
            it("wildcard host pattern matches intended subdomain", () => {
                expect(
                    StringUtils.matchPatternStrict(
                        "*.contoso.com",
                        "app.contoso.com",
                        { component: "host" }
                    )
                ).toBe(true);
            });

            it("wildcard host pattern does not match when wildcard would span a dot boundary", () => {
                expect(
                    StringUtils.matchPatternStrict(
                        "*.contoso.com",
                        "othercontoso.com",
                        { component: "host" }
                    )
                ).toBe(false);
            });

            it("wildcard host pattern does not match multi-label wildcard expansion", () => {
                expect(
                    StringUtils.matchPatternStrict(
                        "*.contoso.com",
                        "a.b.contoso.com",
                        { component: "host" }
                    )
                ).toBe(false);
            });

            it("exact host pattern matches its intended host", () => {
                expect(
                    StringUtils.matchPatternStrict(
                        "api.contoso.com",
                        "api.contoso.com",
                        { component: "host" }
                    )
                ).toBe(true);
            });

            it("exact host pattern does not match a different host", () => {
                expect(
                    StringUtils.matchPatternStrict(
                        "api.contoso.com",
                        "other.contoso.com",
                        { component: "host" }
                    )
                ).toBe(false);
            });
        });

        describe("dot metacharacter escaping", () => {
            it("dot in pattern is treated as a literal dot", () => {
                expect(
                    StringUtils.matchPatternStrict("example.com", "example.com")
                ).toBe(true);
            });

            it("dot in pattern does not match a non-dot character", () => {
                expect(
                    StringUtils.matchPatternStrict("example.com", "exampleXcom")
                ).toBe(false);
            });
        });

        describe("anchoring - full-string match required", () => {
            it("pattern must match the full string, not just a substring", () => {
                expect(
                    StringUtils.matchPatternStrict("/user/1", "/user/1/extra", {
                        component: "path",
                    })
                ).toBe(false);
            });

            it("pattern must not match a prefix of the input", () => {
                expect(
                    StringUtils.matchPatternStrict("contoso", "contoso.com", {
                        component: "host",
                    })
                ).toBe(false);
            });

            it("pattern must not match a suffix of the input", () => {
                expect(
                    StringUtils.matchPatternStrict(
                        "contoso.com",
                        "api.contoso.com",
                        { component: "host" }
                    )
                ).toBe(false);
            });
        });

        describe("path component - wildcard matches across slashes", () => {
            it("path wildcard matches a single path segment", () => {
                expect(
                    StringUtils.matchPatternStrict("/user/*", "/user/1", {
                        component: "path",
                    })
                ).toBe(true);
            });

            it("path wildcard matches multiple path segments", () => {
                expect(
                    StringUtils.matchPatternStrict("/user/*", "/user/1/2/3", {
                        component: "path",
                    })
                ).toBe(true);
            });

            it("path wildcard does not match a completely different path", () => {
                expect(
                    StringUtils.matchPatternStrict("/user/*", "/admin/1", {
                        component: "path",
                    })
                ).toBe(false);
            });
        });

        describe("question mark is a literal (URL query separator)", () => {
            it("? in a pattern matches a literal ? in the input", () => {
                expect(
                    StringUtils.matchPatternStrict(
                        "/items?page=1",
                        "/items?page=1"
                    )
                ).toBe(true);
            });

            it("? in a pattern does not match a different character", () => {
                expect(
                    StringUtils.matchPatternStrict(
                        "/items?page=1",
                        "/itemsXpage=1"
                    )
                ).toBe(false);
            });

            it("pattern with ? does not match input missing the ? character", () => {
                expect(
                    StringUtils.matchPatternStrict(
                        "/items?page=1",
                        "/itemspage=1"
                    )
                ).toBe(false);
            });
        });

        describe("host pattern only matches the host component, not values in other components", () => {
            it("wildcard host pattern does not match a hostname that appears only in the query string", () => {
                expect(
                    StringUtils.matchPatternStrict(
                        "*.microsoft.com",
                        "other.com",
                        { component: "host" }
                    )
                ).toBe(false);
            });

            it("wildcard host pattern does not match a host with no dot before the domain", () => {
                expect(
                    StringUtils.matchPatternStrict(
                        "*.microsoft.com",
                        "othermicrosoft.com",
                        { component: "host" }
                    )
                ).toBe(false);
            });

            it("wildcard host pattern matches only the correct host component", () => {
                expect(
                    StringUtils.matchPatternStrict(
                        "*.microsoft.com",
                        "login.microsoft.com",
                        { component: "host" }
                    )
                ).toBe(true);
            });
        });

        describe("no options provided - defaults to permissive wildcard semantics", () => {
            it("* matches across any characters when no component specified", () => {
                expect(
                    StringUtils.matchPatternStrict(
                        "https://myapplication.com/user/*",
                        "https://myapplication.com/user/1"
                    )
                ).toBe(true);
            });

            it("exact match succeeds when no component specified", () => {
                expect(
                    StringUtils.matchPatternStrict(
                        "https://myapplication.com/v1.0/me",
                        "https://myapplication.com/v1.0/me"
                    )
                ).toBe(true);
            });

            it("non-match returns false when no component specified", () => {
                expect(
                    StringUtils.matchPatternStrict(
                        "https://myapplication.com/v1.0/me",
                        "https://myapplication.com/v1.0/other"
                    )
                ).toBe(false);
            });
        });
    });
});

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
});

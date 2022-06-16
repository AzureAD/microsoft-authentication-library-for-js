import { StringUtils } from "../../src/utils/StringUtils";
import { TEST_TOKENS } from "../test_kit/StringConstants";
import { ClientAuthError, ClientAuthErrorMessage } from "../../src/error/ClientAuthError";
import { AuthError } from "../../src/error/AuthError";

describe("StringUtils.ts Class Unit Tests", () => {
    
    it("decodeJwt returns a correctly crackedToken.", () => {
        const sampleJwt = `${TEST_TOKENS.SAMPLE_JWT_HEADER}.${TEST_TOKENS.SAMPLE_JWT_PAYLOAD}.${TEST_TOKENS.SAMPLE_JWT_SIG}`;
        const decodedJwt = StringUtils.decodeAuthToken(sampleJwt);

        expect(decodedJwt).toEqual({
            header: TEST_TOKENS.SAMPLE_JWT_HEADER,
            JWSPayload: TEST_TOKENS.SAMPLE_JWT_PAYLOAD,
            JWSSig: TEST_TOKENS.SAMPLE_JWT_SIG
        });
    });

    it("decodeJwt throws error when given a null token string", (done) => {
        try {
            // @ts-ignore
            StringUtils.decodeAuthToken(null);
        } catch (err) {
            expect(err instanceof ClientAuthError).toBe(true);
            expect(err instanceof AuthError).toBe(true);
            expect(err instanceof Error).toBe(true);
            expect(err.errorCode).toBe(ClientAuthErrorMessage.nullOrEmptyToken.code);
            expect(err.errorMessage).toContain(ClientAuthErrorMessage.nullOrEmptyToken.desc);
            expect(err.message).toContain(ClientAuthErrorMessage.nullOrEmptyToken.desc);
            expect(err.name).toBe("ClientAuthError");
            expect(err.stack).toContain("StringUtils.spec.ts");
            done();
        }        
    });

    it("decodeJwt throws error when given a empty token string", (done) => {
        try {
            StringUtils.decodeAuthToken("");
        } catch (err) {
            expect(err instanceof ClientAuthError).toBe(true);
            expect(err instanceof AuthError).toBe(true);
            expect(err instanceof Error).toBe(true);
            expect(err.errorCode).toBe(ClientAuthErrorMessage.nullOrEmptyToken.code);
            expect(err.errorMessage).toContain(ClientAuthErrorMessage.nullOrEmptyToken.desc);
            expect(err.message).toContain(ClientAuthErrorMessage.nullOrEmptyToken.desc);
            expect(err.name).toBe("ClientAuthError");
            expect(err.stack).toContain("StringUtils.spec.ts");
            done();
        }
    });

    it("decodeJwt throws error when given a malformed token string", (done) => {
        try {
            StringUtils.decodeAuthToken(TEST_TOKENS.SAMPLE_MALFORMED_JWT);
        } catch (err) {
            expect(err instanceof ClientAuthError).toBe(true);
            expect(err instanceof AuthError).toBe(true);
            expect(err instanceof Error).toBe(true);
            expect(err.errorCode).toBe(ClientAuthErrorMessage.tokenParsingError.code);
            expect(err.errorMessage).toContain(ClientAuthErrorMessage.tokenParsingError.desc);
            expect(err.message).toContain(ClientAuthErrorMessage.tokenParsingError.desc);
            expect(err.name).toBe("ClientAuthError");
            expect(err.stack).toContain("StringUtils.spec.ts");
            done();
        }
    });

    it("isEmpty correctly identifies empty strings", () => {
        expect(StringUtils.isEmpty(undefined)).toBe(true);
        // @ts-ignore
        expect(StringUtils.isEmpty(null)).toBe(true);
        expect(StringUtils.isEmpty("")).toBe(true);
        expect(StringUtils.isEmpty("Non-empty string")).toBe(false);
    });

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
            "valid": true
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
            "param1": "value1",
            "param2": "value2",
            "param3": "value3",
        };
        expect(StringUtils.queryStringToObject(serializedObj)).toEqual(deserializedObj);        
    });

    it("trimArrayEntries() correctly trims entries in an array", () => {
        const arr = ["S1", " S2  ", " S3 "];
        expect(StringUtils.trimArrayEntries(arr)).toEqual(["S1", "S2", "S3"]);   
    });

    it("removeEmptyStringsFromArray() removes empty strings from an array", () => {

    });

    it("queryStringToObject correctly deserializes URI encoded query string into decoded object", () => {
        const serializedObj = "param1=test%2525u00f1";
        const deserializedObj = {
            "param1": "test%25u00f1"
        };
        expect(StringUtils.queryStringToObject(serializedObj)).toEqual(deserializedObj);        
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
        })
    });

    describe("matchPattern", () => {
        it("no wildcard", () => {
            const matches = StringUtils.matchPattern("https://myapplication.com/user/1", "https://myapplication.com/user/1");

            expect(matches).toBe(true);
        });

        it("single wildcard", () => {
            const matches = StringUtils.matchPattern("https://myapplication.com/user/*", "https://myapplication.com/user/1");

            expect(matches).toBe(true);
        });

        it("multiple wildcards", () => {
            const matches = StringUtils.matchPattern("https://*.myapplication.com/user/*", "https://test.myapplication.com/user/1");

            expect(matches).toBe(true);
        });

        it("backslash is escaped", () => {
            const matches = StringUtils.matchPattern("test\\*", "test\\api");

            expect(matches).toBe(true);
        });
    });
});

import { expect } from "chai";
import { StringUtils } from "../../src/utils/StringUtils";
import { TEST_TOKENS } from "../test_kit/StringConstants";
import { ClientAuthError, ClientAuthErrorMessage } from "../../src/error/ClientAuthError";
import { AuthError } from "../../src/error/AuthError";
import { IdToken } from "../../src";

describe("StringUtils.ts Class Unit Tests", () => {
    
    it("decodeJwt returns a correctly crackedToken.", () => {
        const sampleJwt = `${TEST_TOKENS.SAMPLE_JWT_HEADER}.${TEST_TOKENS.SAMPLE_JWT_PAYLOAD}.${TEST_TOKENS.SAMPLE_JWT_SIG}`;
        const decodedJwt = StringUtils.decodeAuthToken(sampleJwt);

        expect(decodedJwt).to.be.deep.eq({
            header: TEST_TOKENS.SAMPLE_JWT_HEADER,
            JWSPayload: TEST_TOKENS.SAMPLE_JWT_PAYLOAD,
            JWSSig: TEST_TOKENS.SAMPLE_JWT_SIG
        });
    });

    it("decodeJwt throws error when given a null token string", () => {
        let err: ClientAuthError;

        try {
            let decodedJwt = StringUtils.decodeAuthToken(null);
        } catch (e) {
            err = e;
        }

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.nullOrEmptyToken.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.nullOrEmptyToken.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.nullOrEmptyToken.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("StringUtils.spec.ts");
    });

    it("decodeJwt throws error when given a empty token string", () => {
        let err: ClientAuthError;

        try {
            let decodedJwt = StringUtils.decodeAuthToken("");
        } catch (e) {
            err = e;
        }

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.nullOrEmptyToken.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.nullOrEmptyToken.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.nullOrEmptyToken.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("StringUtils.spec.ts");
    });

    it("decodeJwt throws error when given a malformed token string", () => {
        let err: ClientAuthError;

        try {
            let decodedJwt = StringUtils.decodeAuthToken(TEST_TOKENS.SAMPLE_MALFORMED_JWT);
        } catch (e) {
            err = e;
        }

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.tokenParsingError.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.tokenParsingError.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.tokenParsingError.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("StringUtils.spec.ts");
    });

    it("isEmpty correctly identifies empty strings", () => {
        expect(StringUtils.isEmpty(undefined)).to.be.true;
        expect(StringUtils.isEmpty(null)).to.be.true;
        expect(StringUtils.isEmpty("")).to.be.true;
        expect(StringUtils.isEmpty("Non-empty string")).to.be.false;
    });

    it("isEmptyObject correctly identifies empty stringified objects", () => {
        expect(StringUtils.isEmptyObj(undefined)).to.be.true;
        expect(StringUtils.isEmptyObj(null)).to.be.true;
        expect(StringUtils.isEmptyObj("")).to.be.true;
        expect(StringUtils.isEmptyObj("{}")).to.be.true;
        expect(StringUtils.isEmptyObj("{ }")).to.be.true;
        expect(StringUtils.isEmptyObj("{   }")).to.be.true;
        expect(StringUtils.isEmptyObj("Non-object string")).to.be.true;
        const exampleObj = {
            "valid": true
        };
        expect(StringUtils.isEmptyObj(JSON.stringify(exampleObj))).to.be.false;
    });

    it("startsWith returns true if given string starts with given substring", () => {
        const testString = "This is a test string";
        const searchString = "This";
        expect(StringUtils.startsWith(testString, searchString)).to.be.true;
    });

    it("startsWith returns false if given string does not start with given substring", () => {
        const testString = "This is a test string";
        const searchString = "test";
        expect(StringUtils.startsWith(testString, searchString)).to.be.false;
    });

    it("endsWith returns true if given string ends with given substring", () => {
        const testString = "This is a test string";
        const searchString = "string";
        expect(StringUtils.endsWith(testString, searchString)).to.be.true;
    });

    it("endsWith returns false if given string does not end with given substring", () => {
        const testString = "This is a test string";
        const searchString = "test";
        expect(StringUtils.endsWith(testString, searchString)).to.be.false;
    });

    it("endsWith returns false if given string is shorter than substring to search for", () => {
        const testString = "test";
        const searchString = "tests";
        expect(StringUtils.endsWith(testString, searchString)).to.be.false;
    });


    it("queryStringToObject correctly deserializes query string into object", () => {
        const serializedObj = "param1=value1&param2=value2&param3=value3";
        const deserializedObj = {
            "param1": "value1",
            "param2": "value2",
            "param3": "value3",
        };
        expect(StringUtils.queryStringToObject(serializedObj)).to.be.deep.eq(deserializedObj);        
    });

    it("trimArrayEntries() correctly trims entries in an array", () => {
        const arr = ["S1", " S2  ", " S3 "];
        expect(StringUtils.trimArrayEntries(arr)).to.be.deep.eq(["S1", "S2", "S3"]);   
    });

    it("removeEmptyStringsFromArray() removes empty strings from an array", () => {

    });

    describe("jsonParseHelper", () => {
        it("parses json", () => {
            const test = { test: "json" };
            const jsonString = JSON.stringify(test);
            const parsedVal = StringUtils.jsonParseHelper(jsonString);
            expect(parsedVal).to.be.deep.eq(test);
        });

        it("returns null on error", () => {
            const parsedValNull = StringUtils.jsonParseHelper(null);
            const parsedValEmptyString = StringUtils.jsonParseHelper("");
            expect(parsedValNull).to.be.null;
            expect(parsedValEmptyString).to.be.null;
        })
    });

    describe("matchPattern", () => {
        it("no wildcard", () => {
            const matches = StringUtils.matchPattern("https://myapplication.com/user/1", "https://myapplication.com/user/1");

            expect(matches).to.be.true;
        });

        it("single wildcard", () => {
            const matches = StringUtils.matchPattern("https://myapplication.com/user/*", "https://myapplication.com/user/1");

            expect(matches).to.be.true;
        });

        it("multiple wildcards", () => {
            const matches = StringUtils.matchPattern("https://*.myapplication.com/user/*", "https://test.myapplication.com/user/1");

            expect(matches).to.be.true;
        });
    });
});

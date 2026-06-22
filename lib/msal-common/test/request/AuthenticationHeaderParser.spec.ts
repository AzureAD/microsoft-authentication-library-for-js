import { AuthenticationHeaderParser } from "../../src/request/AuthenticationHeaderParser";
import {
    TEST_AUTHENTICATION_HEADERS,
    TEST_POP_VALUES,
} from "../test_kit/StringConstants";
import { HeaderNames } from "../../src/utils/Constants";
import {
    ClientConfigurationErrorCodes,
    createClientConfigurationError,
} from "../../src";

describe("AuthenticationHeaderParser unit tests", () => {
    let headers: Record<string, string>;
    describe("getShrNonce", () => {
        beforeEach(() => {
            headers = {};
        });

        it("should return a server nonce when a valid Authenticaiton-Info header is present", () => {
            headers[HeaderNames.AuthenticationInfo] =
                TEST_AUTHENTICATION_HEADERS.authenticationInfo;
            const authenticationHeaderParser = new AuthenticationHeaderParser(
                headers
            );
            expect(authenticationHeaderParser.getShrNonce()).toStrictEqual(
                TEST_POP_VALUES.SHR_NONCE
            );
        });

        it("should return a server nonce when a valid WWW-Authenticate header is present", () => {
            headers[HeaderNames.WWWAuthenticate] =
                TEST_AUTHENTICATION_HEADERS.wwwAuthenticate;
            const authenticationHeaderParser = new AuthenticationHeaderParser(
                headers
            );
            expect(authenticationHeaderParser.getShrNonce()).toStrictEqual(
                TEST_POP_VALUES.SHR_NONCE
            );
        });

        it("should throw an error if neither Authentication-Info or WWW-Authenticate headers are present", () => {
            const authenticationHeaderParser = new AuthenticationHeaderParser(
                {}
            );
            expect(() => authenticationHeaderParser.getShrNonce()).toThrow(
                createClientConfigurationError(
                    ClientConfigurationErrorCodes.missingNonceAuthenticationHeader,
                    ""
                )
            );
        });

        it("should throw an error if Authentication-Info is present but does not contain nextnonce", () => {
            headers[HeaderNames.AuthenticationInfo] =
                TEST_AUTHENTICATION_HEADERS.invalidAuthenticationInfo;
            const authenticationHeaderParser = new AuthenticationHeaderParser(
                headers
            );
            expect(() => authenticationHeaderParser.getShrNonce()).toThrow(
                createClientConfigurationError(
                    ClientConfigurationErrorCodes.invalidAuthenticationHeader,
                    ""
                )
            );
        });

        it("should throw an error if WWWAuthenticate is present but does not contain nonce", () => {
            headers[HeaderNames.WWWAuthenticate] =
                TEST_AUTHENTICATION_HEADERS.invalidWwwAuthenticate;
            const authenticationHeaderParser = new AuthenticationHeaderParser(
                headers
            );
            expect(() => authenticationHeaderParser.getShrNonce()).toThrow(
                createClientConfigurationError(
                    ClientConfigurationErrorCodes.invalidAuthenticationHeader,
                    ""
                )
            );
        });
    });

    describe("getDPoPNonce", () => {
        beforeEach(() => {
            headers = {};
        });

        it("should return the DPoP-Nonce header value when present", () => {
            headers[HeaderNames.DPopNonce] =
                TEST_AUTHENTICATION_HEADERS.dpopNonce;
            const authenticationHeaderParser = new AuthenticationHeaderParser(
                headers
            );
            expect(authenticationHeaderParser.getDPoPNonce()).toStrictEqual(
                TEST_AUTHENTICATION_HEADERS.dpopNonce
            );
        });

        it("should return the DPoP-Nonce header value when header name is lower-case", () => {
            headers[HeaderNames.DPopNonce.toLowerCase()] =
                TEST_AUTHENTICATION_HEADERS.dpopNonce;
            const authenticationHeaderParser = new AuthenticationHeaderParser(
                headers
            );
            expect(authenticationHeaderParser.getDPoPNonce()).toStrictEqual(
                TEST_AUTHENTICATION_HEADERS.dpopNonce
            );
        });

        it("should return null when DPoP-Nonce header is absent", () => {
            const authenticationHeaderParser = new AuthenticationHeaderParser(
                {}
            );
            expect(authenticationHeaderParser.getDPoPNonce()).toBeNull();
        });

        it("should return null when only SHR headers are present (Authentication-Info)", () => {
            headers[HeaderNames.AuthenticationInfo] =
                TEST_AUTHENTICATION_HEADERS.authenticationInfo;
            const authenticationHeaderParser = new AuthenticationHeaderParser(
                headers
            );
            expect(authenticationHeaderParser.getDPoPNonce()).toBeNull();
        });

        it("should return null when only SHR headers are present (WWW-Authenticate)", () => {
            headers[HeaderNames.WWWAuthenticate] =
                TEST_AUTHENTICATION_HEADERS.wwwAuthenticate;
            const authenticationHeaderParser = new AuthenticationHeaderParser(
                headers
            );
            expect(authenticationHeaderParser.getDPoPNonce()).toBeNull();
        });

        it("should return DPoP nonce even when SHR headers are also present", () => {
            headers[HeaderNames.DPopNonce] =
                TEST_AUTHENTICATION_HEADERS.dpopNonce;
            headers[HeaderNames.WWWAuthenticate] =
                TEST_AUTHENTICATION_HEADERS.wwwAuthenticate;
            headers[HeaderNames.AuthenticationInfo] =
                TEST_AUTHENTICATION_HEADERS.authenticationInfo;
            const authenticationHeaderParser = new AuthenticationHeaderParser(
                headers
            );
            expect(authenticationHeaderParser.getDPoPNonce()).toStrictEqual(
                TEST_AUTHENTICATION_HEADERS.dpopNonce
            );
        });
    });
});

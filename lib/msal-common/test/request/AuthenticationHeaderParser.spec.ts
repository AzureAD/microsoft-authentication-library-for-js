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
        it("returns the standalone DPoP-Nonce value from record headers without normalizing it", () => {
            const nonce = "  opaque%2Fnonce+/=  ";
            const authenticationHeaderParser = new AuthenticationHeaderParser({
                "dpop-nonce": nonce,
            });

            expect(authenticationHeaderParser.getDPoPNonce()).toBe(nonce);
        });

        it("returns the standalone DPoP-Nonce value from a structural get(name) header implementation", () => {
            const nonce = "resource-nonce";
            const authenticationHeaderParser = new AuthenticationHeaderParser({
                get: (name: string): string | null =>
                    name === HeaderNames.DPOP_NONCE ? nonce : null,
            });

            expect(authenticationHeaderParser.getDPoPNonce()).toBe(nonce);
        });

        it("returns null when DPoP-Nonce is absent", () => {
            expect(
                new AuthenticationHeaderParser({}).getDPoPNonce()
            ).toBeNull();
            expect(
                new AuthenticationHeaderParser({
                    get: (): string | null => null,
                }).getDPoPNonce()
            ).toBeNull();
        });

        it("rejects invalid DPoP-Nonce header values without including the value in the error", () => {
            const sentinel = "nonce\r\nsentinel";
            const authenticationHeaderParser = new AuthenticationHeaderParser({
                [HeaderNames.DPOP_NONCE]: sentinel,
            });

            expect(() => authenticationHeaderParser.getDPoPNonce()).toThrow(
                ClientConfigurationErrorCodes.invalidDpopNonce
            );

            try {
                authenticationHeaderParser.getDPoPNonce();
            } catch (error) {
                expect(String(error)).not.toContain(sentinel);
            }
        });
    });
});

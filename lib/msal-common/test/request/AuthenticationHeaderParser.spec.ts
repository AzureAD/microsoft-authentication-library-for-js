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

const authenticationInfoHeaderNames = [
    HeaderNames.AuthenticationInfo,
    "authentication-info",
    "AUTHENTICATION-INFO",
    "aUtHeNtIcAtIoN-iNfO",
];
const wwwAuthenticateHeaderNames = [
    HeaderNames.WWWAuthenticate,
    "www-authenticate",
    "WWW-AUTHENTICATE",
    "wWw-AuThEnTiCaTe",
];
const authenticationHeaderPairs = authenticationInfoHeaderNames.flatMap(
    (authenticationInfo) =>
        wwwAuthenticateHeaderNames.map((wwwAuthenticate) => ({
            authenticationInfo,
            wwwAuthenticate,
        }))
);

describe("AuthenticationHeaderParser unit tests", () => {
    let headers: Record<string, string>;
    describe("getShrNonce", () => {
        beforeEach(() => {
            headers = {};
        });

        it.each(authenticationInfoHeaderNames)(
            "returns a server nonce from %s",
            (headerName) => {
                headers[headerName] =
                    TEST_AUTHENTICATION_HEADERS.authenticationInfo;
                const authenticationHeaderParser =
                    new AuthenticationHeaderParser(headers);
                expect(authenticationHeaderParser.getShrNonce()).toStrictEqual(
                    TEST_POP_VALUES.SHR_NONCE
                );
            }
        );

        it.each(wwwAuthenticateHeaderNames)(
            "returns a server nonce from %s",
            (headerName) => {
                headers[headerName] =
                    TEST_AUTHENTICATION_HEADERS.wwwAuthenticate;
                const authenticationHeaderParser =
                    new AuthenticationHeaderParser(headers);
                expect(authenticationHeaderParser.getShrNonce()).toStrictEqual(
                    TEST_POP_VALUES.SHR_NONCE
                );
            }
        );

        it.each([
            [
                HeaderNames.AuthenticationInfo,
                'nextnonce="dGVzdA=="',
                "dGVzdA==",
            ],
            [HeaderNames.WWWAuthenticate, 'PoP nonce="dGVzdA=="', "dGVzdA=="],
            [HeaderNames.AuthenticationInfo, 'nextnonce="a=b=="', "a=b=="],
        ])(
            "preserves equals signs in %s: %s",
            (headerName, headerValue, expectedNonce) => {
                expect(
                    new AuthenticationHeaderParser({
                        [headerName]: headerValue,
                    }).getShrNonce()
                ).toBe(expectedNonce);
            }
        );

        it.each([
            [
                HeaderNames.AuthenticationInfo,
                'nextnonce="abc", qop="auth"',
                "abc",
            ],
            [
                HeaderNames.AuthenticationInfo,
                'qop="auth", nextnonce="abc"',
                "abc",
            ],
            [
                HeaderNames.AuthenticationInfo,
                'qop="auth,auth-int", nextnonce="abc"',
                "abc",
            ],
            [
                HeaderNames.AuthenticationInfo,
                'PoP qop="auth", nextnonce="abc"',
                "abc",
            ],
            [
                HeaderNames.WWWAuthenticate,
                'PoP realm="resource", nonce="abc"',
                "abc",
            ],
            [
                HeaderNames.AuthenticationInfo,
                'PoP nextnonce \t= \t"abc" \t',
                "abc",
            ],
            [HeaderNames.AuthenticationInfo, 'NEXTNONCE="AbC"', "AbC"],
            [HeaderNames.WWWAuthenticate, 'pOp\tnonce="abc"', "abc"],
            [HeaderNames.AuthenticationInfo, 'nextnonce=" a b "', " a b "],
            [
                HeaderNames.WWWAuthenticate,
                'PoP nonce="shr", Digest realm="example", nonce="digest"',
                "shr",
            ],
        ])(
            "handles parameter placement and whitespace in %s: %s",
            (headerName, headerValue, expectedNonce) => {
                expect(
                    new AuthenticationHeaderParser({
                        [headerName]: headerValue,
                    }).getShrNonce()
                ).toBe(expectedNonce);
            }
        );

        it.each(
            ["abc%2Fdef", "opaque%u0041", "a'b"].flatMap((nonce) => [
                [HeaderNames.AuthenticationInfo, `nextnonce="${nonce}"`, nonce],
                [HeaderNames.WWWAuthenticate, `PoP nonce="${nonce}"`, nonce],
            ])
        )(
            "preserves opaque nonce contents in %s: %s",
            (headerName, headerValue, expectedNonce) => {
                expect(
                    new AuthenticationHeaderParser({
                        [headerName]: headerValue,
                    }).getShrNonce()
                ).toBe(expectedNonce);
            }
        );

        it.each(
            [
                ["a,b", "a,b"],
                [String.raw`a\"b`, 'a"b'],
                [String.raw`a\\b`, String.raw`a\b`],
                [String.raw`a\"b,c`, 'a"b,c'],
                [String.raw`a\%2Fb`, "a%2Fb"],
                ["a\\\\", "a\\"],
            ].flatMap(([rawNonce, expectedNonce]) => [
                [
                    HeaderNames.AuthenticationInfo,
                    `nextnonce="${rawNonce}", qop="auth"`,
                    expectedNonce,
                ],
                [
                    HeaderNames.WWWAuthenticate,
                    `PoP nonce="${rawNonce}", realm="resource"`,
                    expectedNonce,
                ],
            ])
        )(
            "handles quoted commas and HTTP escapes in %s: %s",
            (headerName, headerValue, expectedNonce) => {
                expect(
                    new AuthenticationHeaderParser({
                        [headerName]: headerValue,
                    }).getShrNonce()
                ).toBe(expectedNonce);
            }
        );

        it.each([
            [
                HeaderNames.AuthenticationInfo,
                'nextnonce="shr", qop="auth,nextnonce=wrong"',
            ],
            [
                HeaderNames.WWWAuthenticate,
                'PoP nonce="shr", realm="example,nonce=wrong"',
            ],
        ])(
            "does not treat quoted metadata as another nonce in %s: %s",
            (headerName, headerValue) => {
                expect(
                    new AuthenticationHeaderParser({
                        [headerName]: headerValue,
                    }).getShrNonce()
                ).toBe("shr");
            }
        );

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

        it.each(authenticationInfoHeaderNames)(
            "throws when %s does not contain nextnonce",
            (headerName) => {
                headers[headerName] =
                    TEST_AUTHENTICATION_HEADERS.invalidAuthenticationInfo;
                const authenticationHeaderParser =
                    new AuthenticationHeaderParser(headers);
                expect(() => authenticationHeaderParser.getShrNonce()).toThrow(
                    createClientConfigurationError(
                        ClientConfigurationErrorCodes.invalidAuthenticationHeader,
                        ""
                    )
                );
            }
        );

        it.each(wwwAuthenticateHeaderNames)(
            "throws when %s does not contain nonce",
            (headerName) => {
                headers[headerName] =
                    TEST_AUTHENTICATION_HEADERS.invalidWwwAuthenticate;
                const authenticationHeaderParser =
                    new AuthenticationHeaderParser(headers);
                expect(() => authenticationHeaderParser.getShrNonce()).toThrow(
                    createClientConfigurationError(
                        ClientConfigurationErrorCodes.invalidAuthenticationHeader,
                        ""
                    )
                );
            }
        );

        it.each(authenticationHeaderPairs)(
            "prefers $authenticationInfo over $wwwAuthenticate without changing nonce casing",
            ({ authenticationInfo, wwwAuthenticate }) => {
                const responseHeaders = Object.freeze({
                    [authenticationInfo]: 'PoP nextnonce="NextNonce-AbC"',
                    [wwwAuthenticate]: 'PoP nonce="ChallengeNonce-XyZ"',
                });
                const parser = new AuthenticationHeaderParser(responseHeaders);

                expect(parser.getShrNonce()).toBe("NextNonce-AbC");
                expect(responseHeaders[authenticationInfo]).toBe(
                    'PoP nextnonce="NextNonce-AbC"'
                );
            }
        );

        it.each(authenticationHeaderPairs)(
            "ignores invalid $wwwAuthenticate when $authenticationInfo has a valid nextnonce",
            ({ authenticationInfo, wwwAuthenticate }) => {
                const parser = new AuthenticationHeaderParser({
                    [authenticationInfo]: 'PoP nextnonce="NextNonce-AbC"',
                    [wwwAuthenticate]:
                        TEST_AUTHENTICATION_HEADERS.invalidWwwAuthenticate,
                });

                expect(parser.getShrNonce()).toBe("NextNonce-AbC");
            }
        );

        it.each(authenticationHeaderPairs)(
            "rejects invalid $authenticationInfo instead of using valid $wwwAuthenticate",
            ({ authenticationInfo, wwwAuthenticate }) => {
                const parser = new AuthenticationHeaderParser({
                    [authenticationInfo]:
                        TEST_AUTHENTICATION_HEADERS.invalidAuthenticationInfo,
                    [wwwAuthenticate]: 'PoP nonce="ChallengeNonce-XyZ"',
                });

                expect(() => parser.getShrNonce()).toThrow(
                    createClientConfigurationError(
                        ClientConfigurationErrorCodes.invalidAuthenticationHeader,
                        ""
                    )
                );
            }
        );

        it.each(authenticationHeaderPairs)(
            "falls back from empty $authenticationInfo to valid $wwwAuthenticate",
            ({ authenticationInfo, wwwAuthenticate }) => {
                const parser = new AuthenticationHeaderParser({
                    [authenticationInfo]: "",
                    [wwwAuthenticate]: 'PoP nonce="ChallengeNonce-XyZ"',
                });

                expect(parser.getShrNonce()).toBe("ChallengeNonce-XyZ");
            }
        );

        it.each(authenticationHeaderPairs)(
            "rejects empty $authenticationInfo and $wwwAuthenticate as missing headers",
            ({ authenticationInfo, wwwAuthenticate }) => {
                const parser = new AuthenticationHeaderParser({
                    [authenticationInfo]: "",
                    [wwwAuthenticate]: "",
                });

                expect(() => parser.getShrNonce()).toThrow(
                    createClientConfigurationError(
                        ClientConfigurationErrorCodes.missingNonceAuthenticationHeader,
                        ""
                    )
                );
            }
        );

        it.each([
            ...authenticationInfoHeaderNames,
            ...wwwAuthenticateHeaderNames,
        ])("ignores an inherited %s header", (headerName) => {
            const responseHeaders: Record<string, string> = {};
            Object.setPrototypeOf(responseHeaders, {
                [headerName]: TEST_AUTHENTICATION_HEADERS.authenticationInfo,
            });
            const parser = new AuthenticationHeaderParser(responseHeaders);

            expect(() => parser.getShrNonce()).toThrow(
                createClientConfigurationError(
                    ClientConfigurationErrorCodes.missingNonceAuthenticationHeader,
                    ""
                )
            );
        });
    });
});

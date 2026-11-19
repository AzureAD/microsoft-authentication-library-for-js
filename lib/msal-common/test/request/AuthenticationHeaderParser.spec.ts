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
            'PoP nonce="shr", Digest realm="example", nonce="digest"',
            'Digest realm="example", nonce="digest", PoP nonce="shr"',
            'Basic, Digest realm="example", nonce="digest", pOp realm="resource", nonce="shr"',
            'PoP nonce="shr", Basic, Digest nonce="digest"',
            'PoP nonce="shr", PoP nonce="second"',
        ])("selects only the first PoP challenge: %s", (headerValue) => {
            const parser = new AuthenticationHeaderParser({
                [HeaderNames.WWWAuthenticate]: headerValue,
            });

            expect(parser.getShrNonce()).toBe("shr");
        });

        it.each([
            'Digest realm="example", nonce="digest"',
            'PoP realm="resource", Digest nonce="digest"',
            'PoP realm="resource", PoP nonce="second"',
            'PoP, PoP nonce="second"',
            'PoP YWJj==, Digest nonce="digest", PoP nonce="second"',
        ])(
            "does not borrow a nonce from another challenge: %s",
            (headerValue) => {
                const parser = new AuthenticationHeaderParser({
                    [HeaderNames.WWWAuthenticate]: headerValue,
                });

                expect(() => parser.getShrNonce()).toThrow(
                    createClientConfigurationError(
                        ClientConfigurationErrorCodes.invalidAuthenticationHeader,
                        ""
                    )
                );
            }
        );

        it.each([
            [
                HeaderNames.AuthenticationInfo,
                'nextnonce="dGVzdA=="',
                "dGVzdA==",
            ],
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
                '\t nextnonce \t= "abc" \t, qop="auth"',
                "abc",
            ],
            [
                HeaderNames.AuthenticationInfo,
                'PoP nextnonce="dGVzdA==", qop="auth"',
                "dGVzdA==",
            ],
            [
                HeaderNames.WWWAuthenticate,
                'PoP realm="example", nonce="dGVzdA=="',
                "dGVzdA==",
            ],
            [
                HeaderNames.WWWAuthenticate,
                'PoP\tnonce \t= "abc", error="nonce_required"',
                "abc",
            ],
            [
                HeaderNames.AuthenticationInfo,
                'qop="auth,auth-int", nextnonce="abc"',
                "abc",
            ],
            [
                HeaderNames.AuthenticationInfo,
                String.raw`nextnonce="a\",b\\c==%2F'o"`,
                "a\",b\\c==%2F'o",
            ],
            [
                HeaderNames.WWWAuthenticate,
                String.raw`PoP realm="a\",b", nonce="a,b=%2F'o"`,
                "a,b=%2F'o",
            ],
            [
                HeaderNames.AuthenticationInfo,
                "nextnonce=opaque%2F%u0041==",
                "opaque%2F%u0041==",
            ],
            [HeaderNames.AuthenticationInfo, 'NEXTNONCE="AbC"', "AbC"],
            [HeaderNames.AuthenticationInfo, 'PoP\tnextnonce="AbC"', "AbC"],
            [
                HeaderNames.WWWAuthenticate,
                "PoP nonce=opaque%2F==",
                "opaque%2F==",
            ],
            [
                HeaderNames.AuthenticationInfo,
                "nextnonce=abc/def==",
                "abc/def==",
            ],
            [
                HeaderNames.AuthenticationInfo,
                'nextnonce=" a=b c=d "',
                " a=b c=d ",
            ],
            [
                HeaderNames.WWWAuthenticate,
                'PoP realm="nonce=wrong, nonce=also-wrong", nonce=shr',
                "shr",
            ],
        ])(
            "preserves the nonce in %s: %s",
            (headerName, headerValue, expectedNonce) => {
                const parser = new AuthenticationHeaderParser({
                    [headerName]: headerValue,
                });

                expect(parser.getShrNonce()).toBe(expectedNonce);
            }
        );

        it.each([
            'nextnonce="unterminated',
            'nextnonce="dangling\\',
            'nextnonce="abc"trailing',
            "nextnonce",
            'nextnonce=""',
        ])("rejects malformed or empty nonce parameters: %s", (headerValue) => {
            const parser = new AuthenticationHeaderParser({
                [HeaderNames.AuthenticationInfo]: headerValue,
            });

            expect(() => parser.getShrNonce()).toThrow(
                createClientConfigurationError(
                    ClientConfigurationErrorCodes.invalidAuthenticationHeader,
                    ""
                )
            );
        });

        describe("additional nonce preservation cases", () => {
            it.each([
                [
                    HeaderNames.WWWAuthenticate,
                    "Basic\t, Other \t, realm=one, PoP nonce=shr",
                    "shr",
                ],
                [
                    HeaderNames.AuthenticationInfo,
                    ', , nextnonce \t= \t"shr" , , qop=auth,',
                    "shr",
                ],
                [
                    HeaderNames.WWWAuthenticate,
                    ", Basic, , PoP , , nonce \t= \tshr, ,",
                    "shr",
                ],
                [
                    HeaderNames.WWWAuthenticate,
                    "Negotiate YWJj+/==, PoP nonce=shr, Other YWJj",
                    "shr",
                ],
                [
                    HeaderNames.WWWAuthenticate,
                    "Other abc=, PoP nonce=shr, Other abc==",
                    "shr",
                ],
                [
                    HeaderNames.WWWAuthenticate,
                    'Basic realm="simple", Newauth realm="apps", type=1, title="Login to \\"apps\\"", PoP nonce=shr',
                    "shr",
                ],
                [
                    HeaderNames.WWWAuthenticate,
                    "PoP nonce=shr, Digest nonce=digest, Other nonce=other",
                    "shr",
                ],
                [
                    HeaderNames.AuthenticationInfo,
                    "nextnonce=!#$%&'*+-.^_`|~09AZaz",
                    "!#$%&'*+-.^_`|~09AZaz",
                ],
                [
                    HeaderNames.AuthenticationInfo,
                    'nextnonce="\t !#[]~\u0080\u00ff"',
                    "\t !#[]~\u0080\u00ff",
                ],
                [
                    HeaderNames.AuthenticationInfo,
                    'nextnonce="a\\\tb\\ \\\u0080"',
                    "a\tb \u0080",
                ],
                [
                    HeaderNames.WWWAuthenticate,
                    'PoP nonce=shr, Digest nonce=""',
                    "shr",
                ],
            ])(
                "preserves the nonce in %s: %s",
                (headerName, headerValue, expectedNonce) => {
                    expect(
                        new AuthenticationHeaderParser({
                            [headerName]: headerValue,
                        }).getShrNonce()
                    ).toBe(expectedNonce);
                }
            );

            it.each([
                [HeaderNames.AuthenticationInfo, "qop=auth==, nextnonce=shr"],
                [
                    HeaderNames.AuthenticationInfo,
                    "qop=one, qop=two, nextnonce=shr",
                ],
                [
                    HeaderNames.AuthenticationInfo,
                    "nextnonce=shr, NEXTNONCE=other",
                ],
                [
                    HeaderNames.WWWAuthenticate,
                    "Other\tvalue=one, PoP nonce=shr",
                ],
                [
                    HeaderNames.WWWAuthenticate,
                    "PoP error=one, ERROR=two, nonce=shr",
                ],
                [
                    HeaderNames.WWWAuthenticate,
                    'PoP nonce=shr, Other value="unfinished',
                ],
                [HeaderNames.WWWAuthenticate, "PoP nonce=shr, NONCE=other"],
                [HeaderNames.WWWAuthenticate, `${",".repeat(64)}PoP nonce=shr`],
            ])(
                "ignores unrelated validation concerns in %s: %s",
                (headerName, headerValue) => {
                    expect(
                        new AuthenticationHeaderParser({
                            [headerName]: headerValue,
                        }).getShrNonce()
                    ).toBe("shr");
                }
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

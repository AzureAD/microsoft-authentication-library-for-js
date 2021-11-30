import { AuthenticationHeaderParser } from "../../src/request/AuthenticationHeaderParser";
import { TEST_AUTHENTICATION_HEADERS, TEST_POP_VALUES } from "../test_kit/StringConstants";
import { HeaderNames } from "../../src/utils/Constants";
import { ClientConfigurationError } from "../../src";

describe("AuthenticationHeaderParser unit tests", () => {
	let headers: Record<string, string>;
	describe("getShrNonce", () => {
		beforeEach(() => {
			headers = {};
		});

		it("should return a server nonce when a valid Authenticaiton-Info header is present", () => {
			headers[HeaderNames.AuthenticationInfo] = TEST_AUTHENTICATION_HEADERS.authenticationInfo;
			const authenticationHeaderParser = new AuthenticationHeaderParser(headers);
			expect(authenticationHeaderParser.getShrNonce()).toStrictEqual(TEST_POP_VALUES.SHR_NONCE);
		});

		it("should return a server nonce when a valid WWW-Authenticate header is present", () => {
			headers[HeaderNames.WWWAuthenticate] = TEST_AUTHENTICATION_HEADERS.wwwAuthenticate;
			const authenticationHeaderParser = new AuthenticationHeaderParser(headers);
			expect(authenticationHeaderParser.getShrNonce()).toStrictEqual(TEST_POP_VALUES.SHR_NONCE);
		});

		it("should throw an error if neither Authentication-Info or WWW-Authenticate headers are present", () => {
			const authenticationHeaderParser = new AuthenticationHeaderParser({});
			expect(() => authenticationHeaderParser.getShrNonce()).toThrow(ClientConfigurationError.createMissingNonceAuthenticationHeadersError());
		});

		it ("should throw an error if Authentication-Info is present but does not contain nextnonce", () => {
			headers[HeaderNames.AuthenticationInfo] = TEST_AUTHENTICATION_HEADERS.invalidAuthenticationInfo;
			const authenticationHeaderParser = new AuthenticationHeaderParser(headers);
			expect(() => authenticationHeaderParser.getShrNonce()).toThrow(ClientConfigurationError.createInvalidAuthenticationHeaderError(HeaderNames.AuthenticationInfo, "nextnonce challenge is missing."));	
		});

		it ("should throw an error if WWWAuthenticate is present but does not contain nonce", () => {
			headers[HeaderNames.WWWAuthenticate] = TEST_AUTHENTICATION_HEADERS.invalidWwwAuthenticate;
			const authenticationHeaderParser = new AuthenticationHeaderParser(headers);
			expect(() => authenticationHeaderParser.getShrNonce()).toThrow(ClientConfigurationError.createInvalidAuthenticationHeaderError(HeaderNames.WWWAuthenticate, "nonce challenge is missing."));	
		});
	});
});

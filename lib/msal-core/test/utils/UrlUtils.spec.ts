import { expect } from "chai";
import sinon from "sinon";
import { UrlUtils } from "../../src/utils/UrlUtils";
import { TEST_CONFIG, TEST_RESPONSE_TYPE, TEST_URIS } from "../TestConstants";
import { AuthorityFactory } from "../../src/AuthorityFactory";
import { ServerRequestParameters } from "../../src/ServerRequestParameters";

describe("UrlUtils.ts class", () => {

    const TEST_ID_TOKEN = "eyJraWQiOiIxZTlnZGs3IiwiYWxnIjoiUlMyNTYifQ"
    + ".ewogImlzcyI6ICJodHRwOi8vc2VydmVyLmV4YW1wbGUuY29tIiwKICJzdWIiOiAiMjQ4Mjg5NzYxMDAxIiwKICJhdWQiOiAiczZCaGRSa3F0MyIsCiAibm9uY2UiOiAidGVzdF9ub25jZSIsCiAiZXhwIjogMTMxMTI4MTk3MCwKICJpYXQiOiAxMzExMjgwOTcwLAogIm5hbWUiOiAiSmFuZSBEb2UiLAogImdpdmVuX25hbWUiOiAiSmFuZSIsCiAiZmFtaWx5X25hbWUiOiAiRG9lIiwKICJnZW5kZXIiOiAiZmVtYWxlIiwKICJ0aWQiOiAiMTI0ZHMzMjQtNDNkZS1uODltLTc0NzctNDY2ZmVmczQ1YTg1IiwKICJiaXJ0aGRhdGUiOiAiMDAwMC0xMC0zMSIsCiAiZW1haWwiOiAiamFuZWRvZUBleGFtcGxlLmNvbSIsCiAicGljdHVyZSI6ICJodHRwOi8vZXhhbXBsZS5jb20vamFuZWRvZS9tZS5qcGciCn0="
    + ".rHQjEmBqn9Jre0OLykYNnspA10Qql2rvx4FsD00jwlB0Sym4NzpgvPKsDjn_wMkHxcp6CilPcoKrWHcipR2iAjzLvDNAReF97zoJqq880ZD1bwY82JDauCXELVR9O6_B0w3K-E7yM2macAAgNCUwtik6SjoSUZRcf-O5lygIyLENx882p6MtmwaL1hd6qn5RZOQ0TLrOYu0532g9Exxcm-ChymrB4xLykpDj3lUivJt63eEGGN6DH5K6o33TcxkIjNrCD4XB1CKKumZvCedgHHF3IAK4dVEDSUoGlH9z4pP_eWYNXvqQOjGs-rDaQzUHl6cQQWNiDpWOl_lxXjQEvQ";

    const TEST_RAW_CLIENT_INFO = "eyJ1aWQiOiIxMjMtdGVzdC11aWQiLCJ1dGlkIjoiNDU2LXRlc3QtdXRpZCJ9";

    // Test Hashes
    const TEST_SUCCESS_PARAMS = `id_token=${TEST_ID_TOKEN}&client_info=${TEST_RAW_CLIENT_INFO}&state=RANDOM-GUID-HERE|`;
    const TEST_SUCCESS_HASH_1 = `#${TEST_SUCCESS_PARAMS}`;
    const TEST_SUCCESS_HASH_2 = `#/${TEST_SUCCESS_PARAMS}`;
    const TEST_URL_NO_HASH = `http://localhost:3000/`;
    const TEST_URL_HASH_SINGLE_CHAR = `${TEST_URL_NO_HASH}${TEST_SUCCESS_HASH_1}`;
    const TEST_URL_HASH_TWO_CHAR = `${TEST_URL_NO_HASH}${TEST_SUCCESS_HASH_2}`;

    it("replaceTenantPath", () => {
        console.log(UrlUtils.replaceTenantPath("http://a.com/common/d?e=f", "1234-5678"));
        console.log(UrlUtils.replaceTenantPath("http://a.com/common/", "1234-56778"));
        console.log(UrlUtils.replaceTenantPath("http://a.com/common", "1234-5678"));
    });

    it("test getHashFromUrl returns hash from url if hash is single character", () => {
        const hash = UrlUtils.getHashFromUrl(TEST_URL_HASH_SINGLE_CHAR);

        expect(hash).to.be.equal(TEST_SUCCESS_PARAMS);
    });

    it("test getHashFromUrl returns hash from url if hash is two character", () => {
        const hash = UrlUtils.getHashFromUrl(TEST_URL_HASH_TWO_CHAR);

        expect(hash).to.be.equal(TEST_SUCCESS_PARAMS);
    });

    it("test getHashFromUrl returns original url from url if no hash is present", () => {
        const hash = UrlUtils.getHashFromUrl(TEST_URL_NO_HASH);

        expect(hash).to.be.equal(TEST_URL_NO_HASH);
    });

    it("Scopes are from serverRequestParameters are mutated, but not user-given scopes", function () {
        let scopes = ["S1"];
        let authority = AuthorityFactory.CreateInstance(TEST_CONFIG.validAuthority, false);
        sinon.stub(authority, "AuthorizationEndpoint").value(TEST_URIS.TEST_AUTH_ENDPT);
        let req = new ServerRequestParameters(
            authority,
            TEST_CONFIG.MSAL_CLIENT_ID,
            scopes,
            TEST_RESPONSE_TYPE.token,
            TEST_URIS.TEST_REDIR_URI,
            TEST_CONFIG.STATE
        );
        let uriString = UrlUtils.createNavigateUrl(req);

        expect(req.scopes).to.not.be.equal(scopes);
        expect(req.scopes.length).to.be.eql(3);
        expect(scopes.length).to.be.eql(1);
    });

});

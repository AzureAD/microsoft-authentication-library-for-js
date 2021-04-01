import { expect } from "chai";
import sinon from "sinon";
import { UrlUtils } from "../../src/utils/UrlUtils";
import { TEST_CONFIG, TEST_RESPONSE_TYPE, TEST_URIS } from "../TestConstants";
import { AuthorityFactory } from "../../src/authority/AuthorityFactory";
import { ServerRequestParameters } from "../../src/ServerRequestParameters";
import { ServerHashParamKeys, Constants } from "../../src/utils/Constants";
import { IUri } from "../../src/IUri";
import { IdToken } from "../../src/IdToken";

describe("UrlUtils.ts class", () => {

    const TEST_ID_TOKEN = "eyJraWQiOiIxZTlnZGs3IiwiYWxnIjoiUlMyNTYifQ"
    + ".ewogImlzcyI6ICJodHRwOi8vc2VydmVyLmV4YW1wbGUuY29tIiwKICJzdWIiOiAiMjQ4Mjg5NzYxMDAxIiwKICJhdWQiOiAiczZCaGRSa3F0MyIsCiAibm9uY2UiOiAidGVzdF9ub25jZSIsCiAiZXhwIjogMTMxMTI4MTk3MCwKICJpYXQiOiAxMzExMjgwOTcwLAogIm5hbWUiOiAiSmFuZSBEb2UiLAogImdpdmVuX25hbWUiOiAiSmFuZSIsCiAiZmFtaWx5X25hbWUiOiAiRG9lIiwKICJnZW5kZXIiOiAiZmVtYWxlIiwKICJ0aWQiOiAiMTI0ZHMzMjQtNDNkZS1uODltLTc0NzctNDY2ZmVmczQ1YTg1IiwKICJiaXJ0aGRhdGUiOiAiMDAwMC0xMC0zMSIsCiAiZW1haWwiOiAiamFuZWRvZUBleGFtcGxlLmNvbSIsCiAicGljdHVyZSI6ICJodHRwOi8vZXhhbXBsZS5jb20vamFuZWRvZS9tZS5qcGciCn0="
    + ".rHQjEmBqn9Jre0OLykYNnspA10Qql2rvx4FsD00jwlB0Sym4NzpgvPKsDjn_wMkHxcp6CilPcoKrWHcipR2iAjzLvDNAReF97zoJqq880ZD1bwY82JDauCXELVR9O6_B0w3K-E7yM2macAAgNCUwtik6SjoSUZRcf-O5lygIyLENx882p6MtmwaL1hd6qn5RZOQ0TLrOYu0532g9Exxcm-ChymrB4xLykpDj3lUivJt63eEGGN6DH5K6o33TcxkIjNrCD4XB1CKKumZvCedgHHF3IAK4dVEDSUoGlH9z4pP_eWYNXvqQOjGs-rDaQzUHl6cQQWNiDpWOl_lxXjQEvQ";

    const TEST_RAW_CLIENT_INFO = "eyJ1aWQiOiIxMjMtdGVzdC11aWQiLCJ1dGlkIjoiNDU2LXRlc3QtdXRpZCJ9";

    // Test Hashes
    const TEST_SUCCESS_PARAMS = `id_token=${TEST_ID_TOKEN}&client_info=${TEST_RAW_CLIENT_INFO}&state=RANDOM-GUID-HERE|`;
    const TEST_SUCCESS_HASH_1 = `#${TEST_SUCCESS_PARAMS}`;
    const TEST_SUCCESS_HASH_2 = `#/${TEST_SUCCESS_PARAMS}`;
    const TEST_URL_NO_HASH = "http://localhost:3000/";
    const TEST_URL_HASH_SINGLE_CHAR = `${TEST_URL_NO_HASH}${TEST_SUCCESS_HASH_1}`;
    const TEST_URL_HASH_TWO_CHAR = `${TEST_URL_NO_HASH}${TEST_SUCCESS_HASH_2}`;

    describe("replaceTenantPath", () => {
        it("/common", () => {
            expect(UrlUtils.replaceTenantPath("http://a.com/common/d?e=f", "1234-5678")).to.eq("http://a.com/1234-5678/d/");
            expect(UrlUtils.replaceTenantPath("http://a.com/common/", "1234-56778")).to.eq("http://a.com/1234-56778/");
            expect(UrlUtils.replaceTenantPath("http://a.com/common", "1234-5678")).to.eq("http://a.com/1234-5678/");
        });

        it("/organizations", () => {
            expect(UrlUtils.replaceTenantPath("http://a.com/organizations", "1234-5678")).to.eq("http://a.com/1234-5678/");
        });

        it("/consumers", () => {
            expect(UrlUtils.replaceTenantPath("http://login.microsoftonline.com/consumers", "9188040d-6c67-4c5b-b112-36a304b66dad")).to.eq("http://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/");
        });
    });

    it("isCommonAuthority", () => {
        expect(UrlUtils.isCommonAuthority("https://login.microsoftonline.com/common/")).to.eq(true);
        expect(UrlUtils.isCommonAuthority("https://login.microsoftonline.com/common")).to.eq(true);
        expect(UrlUtils.isCommonAuthority("https://login.microsoftonline.com/organizations/")).to.eq(false);
        expect(UrlUtils.isCommonAuthority("https://login.microsoftonline.com/consumers/")).to.eq(false);
        expect(UrlUtils.isCommonAuthority("https://login.microsoftonline.com/123456789/")).to.eq(false);
    });

    it("isOrganizationsAuthority", () => {
        expect(UrlUtils.isOrganizationsAuthority("https://login.microsoftonline.com/organizations/")).to.eq(true);
        expect(UrlUtils.isOrganizationsAuthority("https://login.microsoftonline.com/organizations")).to.eq(true);
        expect(UrlUtils.isOrganizationsAuthority("https://login.microsoftonline.com/common/")).to.eq(false);
        expect(UrlUtils.isOrganizationsAuthority("https://login.microsoftonline.com/consumers/")).to.eq(false);
        expect(UrlUtils.isOrganizationsAuthority("https://login.microsoftonline.com/123456789/")).to.eq(false);
    });

    it("isConsumersAuthority", () => {
        expect(UrlUtils.isConsumersAuthority("https://login.microsoftonline.com/consumers/")).to.eq(true);
        expect(UrlUtils.isConsumersAuthority("https://login.microsoftonline.com/consumers")).to.eq(true);
        expect(UrlUtils.isConsumersAuthority("https://login.microsoftonline.com/common/")).to.eq(false);
        expect(UrlUtils.isConsumersAuthority("https://login.microsoftonline.com/organizations/")).to.eq(false);
        expect(UrlUtils.isConsumersAuthority("https://login.microsoftonline.com/123456789/")).to.eq(false);
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
        const scopes = ["S1"];
        const authority = AuthorityFactory.CreateInstance(TEST_CONFIG.validAuthority, false);
        sinon.stub(authority, "AuthorizationEndpoint").value(TEST_URIS.TEST_AUTH_ENDPT);
        const req = new ServerRequestParameters(
            authority,
            TEST_CONFIG.MSAL_CLIENT_ID,
            TEST_RESPONSE_TYPE.token,
            TEST_URIS.TEST_REDIR_URI,
            scopes,
            TEST_CONFIG.STATE,
            TEST_CONFIG.CorrelationId
        );
        const uriString = UrlUtils.createNavigateUrl(req);

        expect(req.scopes).to.not.be.equal(scopes);
        expect(req.scopes.length).to.be.eql(3);
        expect(scopes.length).to.be.eql(1);
    });

    describe("urlContainsHash", () => {
        it(ServerHashParamKeys.ERROR_DESCRIPTION, () => {
            const urlString = `http://localhost:3000/#/${ServerHashParamKeys.ERROR_DESCRIPTION}=hello`;

            expect(UrlUtils.urlContainsHash(urlString)).to.be.true;
        });
        it(ServerHashParamKeys.ERROR, () => {
            const urlString = `http://localhost:3000/#/${ServerHashParamKeys.ERROR}=hello`;

            expect(UrlUtils.urlContainsHash(urlString)).to.be.true;
        });
        it(ServerHashParamKeys.ACCESS_TOKEN, () => {
            const urlString = `http://localhost:3000/#/${ServerHashParamKeys.ACCESS_TOKEN}=hello`;

            expect(UrlUtils.urlContainsHash(urlString)).to.be.true;
        });
        it(ServerHashParamKeys.ID_TOKEN, () => {
            const urlString = `http://localhost:3000/#/${ServerHashParamKeys.ID_TOKEN}=hello`;

            expect(UrlUtils.urlContainsHash(urlString)).to.be.true;
        });

        it("no hash", () => {
            const urlString = "http://localhost:3000/#/";

            expect(UrlUtils.urlContainsHash(urlString)).to.be.false;
        });
    });

    describe("deserializeHash", () => {
        it("properly decodes an encoded value", () => {
            // This string once encoded
            const hash = "#state=eyJpZCI6IjJkZWQwNGU5LWYzZGYtNGU0Ny04YzRlLWY0MDMyMTU3YmJlOCIsInRzIjoxNTg1OTMyNzg5LCJtZXRob2QiOiJzaWxlbnRJbnRlcmFjdGlvbiJ9%7Chello";

            const { state } = UrlUtils.deserializeHash(hash);

            const stateParts = state.split(Constants.resourceDelimiter);
            expect(stateParts[0]).to.equal("eyJpZCI6IjJkZWQwNGU5LWYzZGYtNGU0Ny04YzRlLWY0MDMyMTU3YmJlOCIsInRzIjoxNTg1OTMyNzg5LCJtZXRob2QiOiJzaWxlbnRJbnRlcmFjdGlvbiJ9");
            expect(stateParts[1]).to.equal("hello");
        });

        it("properly decodes a twice encoded value", () => {
            // This string is twice encoded
            const hash = "#state=eyJpZCI6IjJkZWQwNGU5LWYzZGYtNGU0Ny04YzRlLWY0MDMyMTU3YmJlOCIsInRzIjoxNTg1OTMyNzg5LCJtZXRob2QiOiJzaWxlbnRJbnRlcmFjdGlvbiJ9%257Chello";

            const { state } = UrlUtils.deserializeHash(hash);

            expect(state).to.equal("eyJpZCI6IjJkZWQwNGU5LWYzZGYtNGU0Ny04YzRlLWY0MDMyMTU3YmJlOCIsInRzIjoxNTg1OTMyNzg5LCJtZXRob2QiOiJzaWxlbnRJbnRlcmFjdGlvbiJ9%7Chello");
        });
    })

    describe("getUrlComponents", () => {
        let url;

        beforeEach(() => {
            url = "https://localhost:30662/";
        });

        it("properly splits up basic url", () => {
            const urlComponents = UrlUtils.GetUrlComponents(url);

            expect(urlComponents.Protocol).to.equal("https:");
            expect(urlComponents.HostNameAndPort).to.equal("localhost:30662");
            expect(urlComponents.AbsolutePath).to.equal("/");
        });

        it("properly splits up url with path", () => {
            url += "testPage1/testPage2/"
            const urlComponents = UrlUtils.GetUrlComponents(url);

            expect(urlComponents.Protocol).to.equal("https:");
            expect(urlComponents.HostNameAndPort).to.equal("localhost:30662");
            expect(urlComponents.AbsolutePath).to.equal("/testPage1/testPage2/");
        });

        it("properly splits up url with query string", () => {
            url += "?testkey1=testval1&testkey2=testval2"
            const urlComponents = UrlUtils.GetUrlComponents(url);

            expect(urlComponents.Protocol).to.equal("https:");
            expect(urlComponents.HostNameAndPort).to.equal("localhost:30662");
            expect(urlComponents.AbsolutePath).to.equal("/");
            expect(urlComponents.Search).to.equal("?testkey1=testval1&testkey2=testval2");
        });

        it("properly splits up url with hash", () => {
            url += "#testhash"
            const urlComponents = UrlUtils.GetUrlComponents(url);

            expect(urlComponents.Protocol).to.equal("https:");
            expect(urlComponents.HostNameAndPort).to.equal("localhost:30662");
            expect(urlComponents.AbsolutePath).to.equal("/");
            expect(urlComponents.Hash).to.equal("#testhash");          
        });

        it("properly splits up url with hash and query string", () => {
            url += "?testkey1=testval1&testkey2=testval2"
            url += "#testhash"
            const urlComponents = UrlUtils.GetUrlComponents(url);

            expect(urlComponents.Protocol).to.equal("https:");
            expect(urlComponents.HostNameAndPort).to.equal("localhost:30662");
            expect(urlComponents.AbsolutePath).to.equal("/");
            expect(urlComponents.Search).to.equal("?testkey1=testval1&testkey2=testval2"); 
            expect(urlComponents.Hash).to.equal("#testhash");   
        });
    });

    describe("removeHashFromUrl", () => {
        const url = "https://localhost:30662/";

        it("returns same url if hash not present in url", () => {
            expect(UrlUtils.removeHashFromUrl(url)).to.eq(url);
        });

        it("returns base url if hash is present in url", () => {
            const testUrl = url + "#testHash";
            expect(UrlUtils.removeHashFromUrl(testUrl)).to.eq(url);
        });

        it("returns url with query string if hash not present on url", () => {
            const testUrl = url + "?testPage=1";
            expect(UrlUtils.removeHashFromUrl(testUrl)).to.eq(testUrl);
        });

        it("returns url with query string if both hash and query string present in url", () => {
            const urlWithQueryString = url + "?testPage=1";
            const testUrl = urlWithQueryString + "#testHash";
            expect(UrlUtils.removeHashFromUrl(testUrl)).to.eq(urlWithQueryString);
        });
    });
});

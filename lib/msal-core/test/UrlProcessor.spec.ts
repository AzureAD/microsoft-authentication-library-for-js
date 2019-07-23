import { expect } from "chai";
import { UrlProcessor } from "../src/UrlProcessor"

describe("UrlProcessor.ts class", () => {

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
        console.log(UrlProcessor.replaceTenantPath("http://a.com/common/d?e=f", "1234-5678"));
        console.log(UrlProcessor.replaceTenantPath("http://a.com/common/", "1234-56778"));
        console.log(UrlProcessor.replaceTenantPath("http://a.com/common", "1234-5678"));
    });


    it("test getHashFromUrl returns hash from url if hash is single character", () => {
        const hash = UrlProcessor.getHashFromUrl(TEST_URL_HASH_SINGLE_CHAR);

        expect(hash).to.be.equal(TEST_SUCCESS_PARAMS);
    });

    it("test getHashFromUrl returns hash from url if hash is two character", () => {
        const hash = UrlProcessor.getHashFromUrl(TEST_URL_HASH_TWO_CHAR);

        expect(hash).to.be.equal(TEST_SUCCESS_PARAMS);
    });

    it("test getHashFromUrl returns original url from url if no hash is present", () => {
        const hash = UrlProcessor.getHashFromUrl(TEST_URL_NO_HASH);

        expect(hash).to.be.equal(TEST_URL_NO_HASH);
    });
});

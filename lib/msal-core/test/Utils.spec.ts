import { expect } from "chai";
import { Utils } from "../src/Utils";

describe("Utils.ts class", () => {

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

    it("get getLibraryVersion()", () => {
        const version: string = Utils.getLibraryVersion();

        expect(version).to.be.string;
        expect(version.split(".").length).to.be.greaterThan(2);
    });

    it("replaceTenantPath", () => {
        console.log(Utils.replaceTenantPath("http://a.com/common/d?e=f", "1234-5678"));
        console.log(Utils.replaceTenantPath("http://a.com/common/", "1234-56778"));
        console.log(Utils.replaceTenantPath("http://a.com/common", "1234-5678"));
    });

    describe("test Base64 encode decode", () => {
        it('english', () => {
            expect(Utils.base64Encode("msaljs")).to.be.equal("bXNhbGpz");
            expect(Utils.base64Decode("bXNhbGpz")).to.be.equal("msaljs");
        });

        it('Icelandic', () => {
            expect(Utils.base64Encode("Björn Ironside")).to.be.equal("QmrDtnJuIElyb25zaWRl");
            expect(Utils.base64Decode("QmrDtnJuIElyb25zaWRl")).to.be.equal("Björn Ironside");
        });

        it('hebrew', () => {
            expect(Utils.base64Encode("בְּצַלְאֵל")).to.be.equal("15HWvNaw16bWt9ec1rDXkNa115w=");
            expect(Utils.base64Decode("15HWvNaw16bWt9ec1rDXkNa115w=")).to.be.equal("בְּצַלְאֵל");
        });

        it('spanish', () => {
            expect(Utils.base64Encode("Avrán")).to.be.equal("QXZyw6Fu");
            expect(Utils.base64Decode("QXZyw6Fu")).to.be.equal("Avrán");
        });
    });

    it("test getHashFromUrl returns hash from url if hash is single character", () => {
        const hash = Utils.getHashFromUrl(TEST_URL_HASH_SINGLE_CHAR);

        expect(hash).to.be.equal(TEST_SUCCESS_PARAMS);
    });

    it("test getHashFromUrl returns hash from url if hash is two character", () => {
        const hash = Utils.getHashFromUrl(TEST_URL_HASH_TWO_CHAR);

        expect(hash).to.be.equal(TEST_SUCCESS_PARAMS);
    });

    it("test getHashFromUrl returns original url from url if no hash is present", () => {
        const hash = Utils.getHashFromUrl(TEST_URL_NO_HASH);

        expect(hash).to.be.equal(TEST_URL_NO_HASH);
    });
});

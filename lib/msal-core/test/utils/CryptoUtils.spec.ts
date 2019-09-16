import { expect } from "chai";
import { CryptoUtils } from "../../src/utils/CryptoUtils";

describe("CryptoUtils.ts class", () => {

    const EN_PLAINTEXT = "msaljs";
    const EN_B64_ENCODED = "bXNhbGpz";

    const ISL_PLAINTEXT = "Björn Ironside";
    const ISL_B64_ENCODED = "QmrDtnJuIElyb25zaWRl";

    const HE_PLAINTEXT = "בְּצַלְאֵל";
    const HE_B64_ENCODED = "15HWvNaw16bWt9ec1rDXkNa115w=";

    const ES_PLAINTEXT = "Avrán";
    const ES_B64_ENCODED = "QXZyw6Fu";

    const JA_PLAINTEXT = "日本語憂鬱髙";
    const JA_B64_ENCODED = "5pel5pys6Kqe5oaC6ayx6auZ";

    describe("test Base64 encode decode", () => {
        it('english', () => {
            expect(CryptoUtils.base64Encode(EN_PLAINTEXT)).to.be.equal(EN_B64_ENCODED);
            expect(CryptoUtils.base64Decode(EN_B64_ENCODED)).to.be.equal(EN_PLAINTEXT);
        });

        it('Icelandic', () => {
            expect(CryptoUtils.base64Encode(ISL_PLAINTEXT)).to.be.equal(ISL_B64_ENCODED);
            expect(CryptoUtils.base64Decode(ISL_B64_ENCODED)).to.be.equal(ISL_PLAINTEXT);
        });

        it('hebrew', () => {
            expect(CryptoUtils.base64Encode(HE_PLAINTEXT)).to.be.equal(HE_B64_ENCODED);
            expect(CryptoUtils.base64Decode(HE_B64_ENCODED)).to.be.equal(HE_PLAINTEXT);
        });

        it('spanish', () => {
            expect(CryptoUtils.base64Encode(ES_PLAINTEXT)).to.be.equal(ES_B64_ENCODED);
            expect(CryptoUtils.base64Decode(ES_B64_ENCODED)).to.be.equal(ES_PLAINTEXT);
        });

        it('japanese', () => {
            expect(CryptoUtils.base64Encode(JA_PLAINTEXT)).to.be.equal(JA_B64_ENCODED);
            expect(CryptoUtils.base64Decode(JA_B64_ENCODED)).to.be.equal(JA_PLAINTEXT);
        });
    });
});

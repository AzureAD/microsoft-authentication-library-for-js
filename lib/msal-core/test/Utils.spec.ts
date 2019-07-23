import { expect } from "chai";
import { Utils } from "../src/Utils";

describe("Utils.ts class", () => {

    const EN_PLAINTEXT = "msaljs";
    const EN_B64_ENCODED = "bXNhbGpz";

    const ISL_PLAINTEXT = "Björn Ironside";
    const ISL_B64_ENCODED = "QmrDtnJuIElyb25zaWRl";

    const HE_PLAINTEXT = "בְּצַלְאֵל";
    const HE_B64_ENCODED = "15HWvNaw16bWt9ec1rDXkNa115w=";

    const ES_PLAINTEXT = "Avrán";
    const ES_B64_ENCODED = "QXZyw6Fu";

    it("get getLibraryVersion()", () => {
        const version: string = Utils.getLibraryVersion();

        expect(version).to.be.string;
        expect(version.split(".").length).to.be.greaterThan(2);
    });

    describe("test Base64 encode decode", () => {
        it('english', () => {
            expect(Utils.base64Encode(EN_PLAINTEXT)).to.be.equal(EN_B64_ENCODED);
            expect(Utils.base64Decode(EN_B64_ENCODED)).to.be.equal(EN_PLAINTEXT);
        });

        it('Icelandic', () => {
            expect(Utils.base64Encode(ISL_PLAINTEXT)).to.be.equal(ISL_B64_ENCODED);
            expect(Utils.base64Decode(ISL_B64_ENCODED)).to.be.equal(ISL_PLAINTEXT);
        });

        it('hebrew', () => {
            expect(Utils.base64Encode(HE_PLAINTEXT)).to.be.equal(HE_B64_ENCODED);
            expect(Utils.base64Decode(HE_B64_ENCODED)).to.be.equal(HE_PLAINTEXT);
        });

        it('spanish', () => {
            expect(Utils.base64Encode(ES_PLAINTEXT)).to.be.equal(ES_B64_ENCODED);
            expect(Utils.base64Decode(ES_B64_ENCODED)).to.be.equal(ES_PLAINTEXT);
        });
    });

});

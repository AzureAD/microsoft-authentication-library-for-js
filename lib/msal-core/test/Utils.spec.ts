import { expect } from "chai";
import { Utils } from "../src/Utils";

describe("Utils.ts class", () => {
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
});

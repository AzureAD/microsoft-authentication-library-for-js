import { expect } from "chai";
import { Utils } from "../src/Utils";
import { IdToken } from "../src/IdToken";

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

    it.only("test Base64 encode decode", () => {
        // english
        expect(Utils.base64EncodeStringUrlSafe("msaljs")).to.be.equal("bXNhbGpz");
        expect(Utils.base64DecodeStringUrlSafe("bXNhbGpz")).to.be.equal("msaljs");

        // Icelandic
        expect(Utils.base64EncodeStringUrlSafe("Björn Ironside")).to.be.equal("QmrDtnJuIElyb25zaWRl");
        expect(Utils.base64DecodeStringUrlSafe("QmrDtnJuIElyb25zaWRl")).to.be.equal("Björn Ironside");

        // hebrew
        expect(Utils.base64EncodeStringUrlSafe("בְּצַלְאֵל")).to.be.equal("15HWvNaw16bWt9ec1rDXkNa115w=");
        expect(Utils.base64DecodeStringUrlSafe("15HWvNaw16bWt9ec1rDXkNa115w=")).to.be.equal("בְּצַלְאֵל");

         // spanish
         expect(Utils.base64EncodeStringUrlSafe("Avrán")).to.be.equal("QXZyw6Fu");
         expect(Utils.base64DecodeStringUrlSafe("QXZyw6Fu")).to.be.equal("Avrán");
    });
});

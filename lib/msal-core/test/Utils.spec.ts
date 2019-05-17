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

    it("test Base64 encode decode", () => {
        // english
        expect(Base64.encode("msaljs")).to.be.equal("bXNhbGpz");
        expect(Base64.decode("bXNhbGpz")).to.be.equal("msaljs");

        // Icelandic
        expect(Base64.encode("Björn Ironside")).to.be.equal("QmrDtnJuIElyb25zaWRl");
        expect(Base64.decode("QmrDtnJuIElyb25zaWRl")).to.be.equal("Björn Ironside");

        // hebrew
        expect(Base64.encode("בְּצַלְאֵל")).to.be.equal("15HWvNaw16bWt9ec1rDXkNa115w=");
        expect(Base64.decode("15HWvNaw16bWt9ec1rDXkNa115w=")).to.be.equal("בְּצַלְאֵל");

         // spanish
         expect(Base64.encode("Avrán")).to.be.equal("QXZyw6Fu");
         expect(Base64.decode("QXZyw6Fu")).to.be.equal("Avrán");
    });
});

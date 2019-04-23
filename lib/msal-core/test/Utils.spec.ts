import { expect } from "chai";
import { Utils } from "../src/Utils";

describe("Utils.ts", () => {
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
});

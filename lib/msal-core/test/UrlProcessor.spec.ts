import { expect } from "chai";
import { UrlProcessor } from "../src/UrlProcessor"

describe("Utils.ts class", () => {

    it("replaceTenantPath", () => {
        console.log(UrlProcessor.replaceTenantPath("http://a.com/common/d?e=f", "1234-5678"));
        console.log(UrlProcessor.replaceTenantPath("http://a.com/common/", "1234-56778"));
        console.log(UrlProcessor.replaceTenantPath("http://a.com/common", "1234-5678"));
    });

});

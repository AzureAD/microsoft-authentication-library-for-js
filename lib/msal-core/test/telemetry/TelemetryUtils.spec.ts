import { expect } from "chai";
import { scrubTenantFromUri, hashPersonalIdentifier } from "../../src/telemetry/TelemetryUtils";

describe("TelemetryUtils", () => {
    it("TelemtryUtils.scrubTenantFromUri works on regular uri", () => {
        const uri = scrubTenantFromUri("https://login.microsoftonline.com/abc-123/banana/orange");
        expect(uri).to.eq("https://login.microsoftonline.com/abc-123/<tenant>/orange");
    });
    it("TelemtryUtils.scrubTenantFromUri returns null on untrusted uri", () => {
        const uri = scrubTenantFromUri("https://pizza.burger.com/abc-123/banana/orange");
        expect(uri).to.be.null;
    });
    it("TelemtryUtils.scrubTenantFromUri doesnt change when it doesnt contain enough path params", () => {
        const uri = scrubTenantFromUri("https://login.microsoftonline.com/abc-123/");
        expect(uri).to.eq("https://login.microsoftonline.com/abc-123");
    });
    it("TelemtryUtils.scrubTenantFromUri works for b2c", () => {
        const uri = scrubTenantFromUri("https://login.microsoftonline.com/abc-123/tfp/banana");
        expect(uri).to.eq("https://login.microsoftonline.com/abc-123/tfp/<tenant>");
    });
    it("TelemetryUtils.hashPersonalIdentifier produces a result", () => {
        const result = hashPersonalIdentifier("test");
        expect(result).to.be.a.string;
    });
    it("TelemetryUtils.hashPersonalIdentifier produces a consistent result", () => {
        const result = hashPersonalIdentifier("test");
        const result2 = hashPersonalIdentifier("test");
        expect(result).to.equal(result2);
    });
    it("TelemetryUtils.hashPersonalIdentifier produces a varied result", () => {
        const result = hashPersonalIdentifier("test");
        const result2 = hashPersonalIdentifier("test2");
        expect(result).to.not.equal(result2);
    });
});

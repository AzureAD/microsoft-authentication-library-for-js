import { expect } from "chai";
import { scrubTenantFromUri, hashPersonalIdentifier, prependEventNamePrefix } from "../../src/telemetry/TelemetryUtils";
import { EVENT_NAME_PREFIX } from "../../src/telemetry/TelemetryConstants";

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
        expect(result).to.be.string;
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
    it("TelemetryUtils.prependEventNamePrefix works", () => {
        const result = prependEventNamePrefix("a");
        const result2 = prependEventNamePrefix("b_c");
        const result3 = prependEventNamePrefix(" d e ");
        expect(result).to.eql(`${EVENT_NAME_PREFIX}a`);
        expect(result2).to.eql(`${EVENT_NAME_PREFIX}b_c`);
        expect(result3).to.eql(`${EVENT_NAME_PREFIX} d e `);
    });
    it("TelemetryUtils.prependEventNamePrefix handles non / empty strings", () => {
        const result = prependEventNamePrefix("");
        const result2 = prependEventNamePrefix(null);
        // @ts-ignore
        const result3 = prependEventNamePrefix(44);
        expect(result).to.eql(`${EVENT_NAME_PREFIX}`);
        expect(result2).to.eql(`${EVENT_NAME_PREFIX}`);
        expect(result3).to.eql(`${EVENT_NAME_PREFIX}44`);
    });
});

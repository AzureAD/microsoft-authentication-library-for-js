import { expect } from "chai";
import { scrubTenantFromUri } from "../../../src/telemetry/TelemetryUtils";

describe("TelemetryUtils", () => {
    it("TelemtryUtils.scrubTenantFromUri works on regular uri", () => {
        const uri = scrubTenantFromUri("https://login.microsoftonline.com/abc-123/banana/orange");
        expect(uri).to.eq("https://login.microsoftonline.com/abc-123/<tenant>/orange")
    });
});
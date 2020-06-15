import { expect } from "chai";
import { scrubTenantFromUri, hashPersonalIdentifier, prependEventNamePrefix, supportsBrowserPerformance, startBrowserPerformanceMeasurement, endBrowserPerformanceMeasurement } from "../../src/telemetry/TelemetryUtils";
import { EVENT_NAME_PREFIX } from "../../src/telemetry/TelemetryConstants";
import { spy } from "sinon";
import sinon from "sinon";
import { TEST_CONFIG } from "../TestConstants";
import { TrustedAuthority } from "../../src/authority/TrustedAuthority";

describe("TelemetryUtils", () => {
    before(function() {
        // Ensure TrustedHostList is set
        sinon.stub(TrustedAuthority, "getTrustedHostList").callsFake(function() {return TEST_CONFIG.knownAuthorities});
    });

    after(function() {
        sinon.restore();
    });

    it("TelemtryUtils.scrubTenantFromUri works on regular uri", () => {
        const uri = scrubTenantFromUri("https://login.microsoftonline.com/abc-123/banana/orange");
        expect(uri).to.eq("https://login.microsoftonline.com/abc-123/<tenant>/orange");
    });
    it("TelemtryUtils.scrubTenantFromUri returns uri on untrusted uri", () => {
        const uri = scrubTenantFromUri("https://pizza.burger.com/abc-123/banana/orange");
        expect(uri).to.eql(uri);
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

    describe("Browser Performance", () => {
        const originalWindow = global["window"];

        afterEach(() => {
            global["window"] = originalWindow;
        });

        describe("supportsBrowserPerformance", () => {
            it("returns false when window is undefined", () => {
                expect(supportsBrowserPerformance()).to.be.false;
            });
            
            it("returns false when window.performance is undefined", () => {
                global["window"] = {};
                expect(supportsBrowserPerformance()).to.be.false;
            });
            
            it("returns false when window.performance.mark is undefined", () => {
                global["window"] = {
                    performance: {}
                };

                expect(supportsBrowserPerformance()).to.be.false;
            });
            
            it("returns false when window.performance.measure is undefined", () => {
                global["window"] = {
                    performance: {
                        mark: () => {},
                    }
                };
                
                expect(supportsBrowserPerformance()).to.be.false;
            });

            it("returns true when performance APIs are available", () => {
                global["window"] = {
                    performance: {
                        mark: () => {},
                        measure: () => {}
                    }
                }
                expect(supportsBrowserPerformance()).to.be.true;
            });
        });

        describe("startBrowserPerformanceMeasurement", () => {
            it("starts performance measurement", () => {
                const markSpy = spy();
                global["window"] = {
                    performance: {
                        measure: () => {},
                        mark: markSpy
                    }
                };

                startBrowserPerformanceMeasurement("mark");

                expect(markSpy.firstCall.args).to.deep.equal([ "mark" ]);
            });
        });

        describe("endBrowserPerformanceMeasurement", () => {
            it("ends performance measurement", () => {
                const markSpy = spy();
                const measureSpy = spy();
                const clearMeasuresSpy = spy();
                const clearMarksSpy = spy();

                global["window"] = {
                    performance: {
                        mark: markSpy,
                        measure: measureSpy,
                        clearMeasures: clearMeasuresSpy,
                        clearMarks: clearMarksSpy
                    }
                }

                endBrowserPerformanceMeasurement("measureName", "startMark", "endMark");

                expect(markSpy.firstCall.args).to.deep.equal([ "endMark" ]);
                expect(measureSpy.firstCall.args).to.deep.equal(["measureName", "startMark", "endMark"]);
                expect(clearMeasuresSpy.firstCall.args).to.deep.equal([ "measureName" ]);
                expect(clearMarksSpy.firstCall.args).to.deep.equal([ "startMark"]);
                expect(clearMarksSpy.secondCall.args).to.deep.equal([ "endMark"]);
            });
        });
    });
});

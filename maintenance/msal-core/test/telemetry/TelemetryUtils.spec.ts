import { scrubTenantFromUri, hashPersonalIdentifier, prependEventNamePrefix, supportsBrowserPerformance, startBrowserPerformanceMeasurement, endBrowserPerformanceMeasurement } from "../../src/telemetry/TelemetryUtils";
import { EVENT_NAME_PREFIX } from "../../src/telemetry/TelemetryConstants";
import { spy } from "sinon";
import sinon from "sinon";
import { TEST_CONFIG } from "../TestConstants";
import { TrustedAuthority } from "../../src/authority/TrustedAuthority";

describe("TelemetryUtils", () => {
    beforeAll(function() {
        // Ensure TrustedHostList is set
        sinon.stub(TrustedAuthority, "getTrustedHostList").callsFake(function() {return TEST_CONFIG.knownAuthorities});
    });

    afterAll(function() {
        sinon.restore();
    });

    it("TelemtryUtils.scrubTenantFromUri works on regular uri", () => {
        const uri = scrubTenantFromUri("https://login.microsoftonline.com/abc-123/banana/orange");
        expect(uri).toBe("https://login.microsoftonline.com/abc-123/<tenant>/orange");
    });
    it("TelemtryUtils.scrubTenantFromUri returns uri on untrusted uri", () => {
        const uri = scrubTenantFromUri("https://pizza.burger.com/abc-123/banana/orange");
        expect(uri).toEqual(uri);
    });
    it("TelemtryUtils.scrubTenantFromUri doesnt change when it doesnt contain enough path params", () => {
        const uri = scrubTenantFromUri("https://login.microsoftonline.com/abc-123/");
        expect(uri).toBe("https://login.microsoftonline.com/abc-123");
    });
    it("TelemtryUtils.scrubTenantFromUri works for b2c", () => {
        const uri = scrubTenantFromUri("https://login.microsoftonline.com/abc-123/tfp/banana");
        expect(uri).toBe("https://login.microsoftonline.com/abc-123/tfp/<tenant>");
    });
    it("TelemetryUtils.hashPersonalIdentifier produces a result", () => {
        const result = hashPersonalIdentifier("test");
        expect(typeof result).toBe("string");
    });
    it("TelemetryUtils.hashPersonalIdentifier produces a consistent result", () => {
        const result = hashPersonalIdentifier("test");
        const result2 = hashPersonalIdentifier("test");
        expect(result).toBe(result2);
    });
    it("TelemetryUtils.hashPersonalIdentifier produces a varied result", () => {
        const result = hashPersonalIdentifier("test");
        const result2 = hashPersonalIdentifier("test2");
        expect(result).not.toBe(result2);
    });
    it("TelemetryUtils.prependEventNamePrefix works", () => {
        const result = prependEventNamePrefix("a");
        const result2 = prependEventNamePrefix("b_c");
        const result3 = prependEventNamePrefix(" d e ");
        expect(result).toEqual(`${EVENT_NAME_PREFIX}a`);
        expect(result2).toEqual(`${EVENT_NAME_PREFIX}b_c`);
        expect(result3).toEqual(`${EVENT_NAME_PREFIX} d e `);
    });
    it("TelemetryUtils.prependEventNamePrefix handles non / empty strings", () => {
        const result = prependEventNamePrefix("");
        const result2 = prependEventNamePrefix(null);
        // @ts-ignore
        const result3 = prependEventNamePrefix(44);
        expect(result).toEqual(`${EVENT_NAME_PREFIX}`);
        expect(result2).toEqual(`${EVENT_NAME_PREFIX}`);
        expect(result3).toEqual(`${EVENT_NAME_PREFIX}44`);
    });

    describe("Browser Performance", () => {
        afterEach(() => {
            sinon.restore();
        });

        describe("supportsBrowserPerformance", () => {
            it("returns false when window is undefined", () => {
                const windowStub = sinon.stub(window, "window").value(undefined);
                expect(supportsBrowserPerformance()).toBe(false);
                windowStub.restore();
            });
            
            it("returns false when window.performance is undefined", () => {
                const oldWindow = window;
                const windowStub = sinon.stub(window, "window").value({
                    ...oldWindow
                });
                expect(supportsBrowserPerformance()).toBe(false);
                windowStub.restore();
            });
            
            it("returns false when window.performance.mark is undefined", () => {
                const performanceStub = sinon.stub(window, "performance").value({});
                expect(supportsBrowserPerformance()).toBe(false);
                performanceStub.restore();
            });
            
            it("returns false when window.performance.measure is undefined", () => {
                const performanceStub = sinon.stub(window, "performance").value({
                    mark: () => {}
                });
                
                expect(supportsBrowserPerformance()).toBe(false);
                performanceStub.restore();
            });

            it("returns true when performance APIs are available", () => {
                const performanceStub = sinon.stub(window, "performance").value({
                    mark: () => {},
                    measure: () => {}
                })
                expect(supportsBrowserPerformance()).toBe(true);
                performanceStub.restore();
            });
        });

        describe("startBrowserPerformanceMeasurement", () => {
            it("starts performance measurement", () => {
                const markSpy = spy();
                const performanceStub = sinon.stub(window, "performance").value({
                        measure: () => {},
                        mark: markSpy
                });

                startBrowserPerformanceMeasurement("mark");

                expect(markSpy.firstCall.args).toEqual([ "mark" ]);
                performanceStub.restore();
            });
        });

        describe("endBrowserPerformanceMeasurement", () => {
            it("ends performance measurement", () => {
                const markSpy = spy();
                const measureSpy = spy();
                const clearMeasuresSpy = spy();
                const clearMarksSpy = spy();

                const performanceStub = sinon.stub(window, "performance").value({
                        mark: markSpy,
                        measure: measureSpy,
                        clearMeasures: clearMeasuresSpy,
                        clearMarks: clearMarksSpy
                });

                endBrowserPerformanceMeasurement("measureName", "startMark", "endMark");

                expect(markSpy.firstCall.args).toEqual([ "endMark" ]);
                expect(measureSpy.firstCall.args).toEqual(["measureName", "startMark", "endMark"]);
                expect(clearMeasuresSpy.firstCall.args).toEqual([ "measureName" ]);
                expect(clearMarksSpy.firstCall.args).toEqual([ "startMark"]);
                expect(clearMarksSpy.secondCall.args).toEqual([ "endMark"]);
                performanceStub.restore();
            });
        });
    });
});

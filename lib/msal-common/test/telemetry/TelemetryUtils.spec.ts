import { expect } from "chai";
import { prependEventNamePrefix, supportsBrowserPerformance, startBrowserPerformanceMeasurement, endBrowserPerformanceMeasurement } from "../../src/telemetry/TelemetryUtils";
import { EVENT_NAME_PREFIX } from "../../src/telemetry/TelemetryConstants";
import { spy } from "sinon";

describe("TelemetryUtils", () => {
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

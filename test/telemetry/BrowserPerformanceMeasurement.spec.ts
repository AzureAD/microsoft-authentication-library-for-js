import { BrowserPerformanceMeasurement } from "../../src/telemetry/BrowserPerformanceMeasurement";

const eventName = "test-event";
const correlationId = "correlation-id";

describe("BrowserPerformanceMeasurement.ts", () => {
    beforeAll(() => {
        // These APIs are not implemented in JSDOM, empty functions enable them to be mocked.

        // @ts-ignore
        window.performance.mark = () => {};
        
        // @ts-ignore
        window.performance.measure = () => {};

        // @ts-ignore
        window.performance.clearMeasures = () => {};

        // @ts-ignore
        window.performance.clearMarks = () => {};

        // @ts-ignore
        window.performance.getEntriesByName = () => {};
    });

    afterEach(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks();
    })

    it("startMeasurement calls window.performance.mark", () => {
        const markSpy = jest.spyOn(window.performance, "mark");
        const measurement = new BrowserPerformanceMeasurement(eventName, correlationId);

        measurement.startMeasurement();

        expect(markSpy).toBeCalledWith(`msal.start.${eventName}.${correlationId}`);
    });

    it("endMeasurement calls window.performance.mark and measure", () => {
        const markSpy = jest.spyOn(window.performance, "mark");
        const measureSpy = jest.spyOn(window.performance, "measure");
        const measurement = new BrowserPerformanceMeasurement(eventName, correlationId);

        measurement.endMeasurement();

        expect(markSpy).toBeCalledWith(`msal.end.${eventName}.${correlationId}`);
        expect(measureSpy).toBeCalledWith(
            `msal.measure.${eventName}.${correlationId}`,
            `msal.start.${eventName}.${correlationId}`,
            `msal.end.${eventName}.${correlationId}`
        );
    });

    it("flushMeasurement calls window.performance.getEntriesByName and clear APIs", () => {
        const expectedDuration = 5;
        const getEntriesByNameSpy = jest.spyOn(window.performance, "getEntriesByName").mockReturnValue([
            {
                duration: expectedDuration,
                entryType: "",
                startTime: 0,
                toJSON: () => "",
                name: ""
            }
        ]);

        const markSpy = jest.spyOn(window.performance, "clearMarks");
        const measureSpy = jest.spyOn(window.performance, "clearMeasures");

        const measurement = new BrowserPerformanceMeasurement(eventName, correlationId);

        const realDuration = measurement.flushMeasurement();

        expect(realDuration).toBe(expectedDuration);
        expect(getEntriesByNameSpy).toBeCalledWith(`msal.measure.${eventName}.${correlationId}`, "measure");
        expect(measureSpy).toBeCalledWith(`msal.measure.${eventName}.${correlationId}`),
        expect(markSpy).toBeCalledWith(`msal.start.${eventName}.${correlationId}`);
        expect(markSpy).toBeCalledWith(`msal.end.${eventName}.${correlationId}`);
    });

    it("flushMeasurement returns null if performance APIs not present", () => {
        // @ts-ignore
        jest.spyOn(window, "performance", "get").mockReturnValue(undefined);

        const measurement = new BrowserPerformanceMeasurement(eventName, correlationId);

        const realDuration = measurement.flushMeasurement();

        expect(realDuration).toBe(null);
    });

    it("supportsBrowserPerformance returns false if window.performance not present", () => {
        // @ts-ignore
        jest.spyOn(window, "performance", "get").mockReturnValue(undefined);

        expect(BrowserPerformanceMeasurement.supportsBrowserPerformance()).toBe(false);
    });

    describe("measurement APIs dont throw if performance APIs throw", () => {
        describe("startMeasurement", () => {
            it("mark", () => {
                jest.spyOn(window.performance, "mark").mockImplementation(() => {
                    throw "markError"
                });

                const measurement = new BrowserPerformanceMeasurement(eventName, correlationId);

                expect(() => measurement.startMeasurement()).not.toThrow("markError");

            });
        });

        describe("endMeasurement", () => {
            it("mark", () => {
                const measurement = new BrowserPerformanceMeasurement(eventName, correlationId);
                
                jest.spyOn(window.performance, "mark").mockImplementation(() => {
                    throw "markError"
                });

                expect(() => measurement.endMeasurement()).not.toThrow("markError");
            });

            it("measure", () => {
                const measurement = new BrowserPerformanceMeasurement(eventName, correlationId);
                
                jest.spyOn(window.performance, "measure").mockImplementation(() => {
                    throw "measureError"
                });
    
                expect(() => measurement.endMeasurement()).not.toThrow("measureError");
            });
        });

        describe("flushMeasurements", () => {
            it("getEntriesByName", () => {
                const measurement = new BrowserPerformanceMeasurement(eventName, correlationId);
                
                jest.spyOn(window.performance, "getEntriesByName").mockImplementation(() => {
                    throw "getEntriesByNameError"
                });

                expect(() => measurement.flushMeasurement()).not.toThrow("getEntriesByNameError");
            });

            it("clearMeasures", () => {
                const measurement = new BrowserPerformanceMeasurement(eventName, correlationId);

                jest.spyOn(window.performance, "clearMeasures").mockImplementation(() => {
                    throw "clearMeasuresError"
                });

                expect(() => measurement.flushMeasurement()).not.toThrow("clearMeasuresError");
            });

            it("clearMarks", () => {
                const measurement = new BrowserPerformanceMeasurement(eventName, correlationId);

                jest.spyOn(window.performance, "clearMarks").mockImplementation(() => {
                    throw "clearMarksError"
                });

                expect(() => measurement.flushMeasurement()).not.toThrow("clearMarksError");
            });
        });
    });
});

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
});

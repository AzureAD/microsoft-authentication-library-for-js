import { BrowserPerformanceMeasurement } from "../../src/telemetry/BrowserPerformanceMeasurement";

const eventName = "test-event";
const correlationId = "correlation-id";

describe("BrowserPerformanceMeasurement.ts", () => {
    beforeAll(() => {
        // @ts-ignore
        window.performance.mark = () => {};
        
        // @ts-ignore
        window.performance.measure = () => {};
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
});

import { ApplicationTelemetry, Logger, PerformanceEvents } from "@azure/msal-common";
import { name, version } from "../../src/packageMetadata";
import { BrowserPerformanceClient } from "../../src/telemetry/BrowserPerformanceClient";

const clientId = "test-client-id";
const authority = "https://login.microsoftonline.com";
const logger = new Logger({});
const correlationId = "correlation-id";
const applicationTelemetry: ApplicationTelemetry = {
    appName: "Test App",
    appVersion: "1.0.0-test.0"
}
const cryptoOptions = {
    useMsrCrypto: false,
    entropy: undefined
}
const perfTimeNow = 1234567890;

jest.mock("../../src/telemetry/BrowserPerformanceMeasurement", () => {
    return {
        BrowserPerformanceMeasurement: jest.fn().mockImplementation(() => {
            return {
                startMeasurement: () => {},
                endMeasurement: () => {},
                flushMeasurement: () => 50
            }
        })
    }
});

describe("BrowserPerformanceClient.ts", () => {

    beforeAll(() => {
        // These APIs are not implemented in JSDOM, empty functions enable them to be mocked.

        // @ts-ignore
        window.performance.now = () => { return perfTimeNow };
    });

    afterAll(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    describe("generateId", () => {
        it("returns a string", () => {
            const browserPerfClient = new BrowserPerformanceClient(clientId, authority, logger, name, version, applicationTelemetry, cryptoOptions);

            expect(typeof browserPerfClient.generateId()).toBe("string");
        });
    });
    describe("startPerformanceMeasuremeant", () => {
        it("calculate performance duration", () => {
            const browserPerfClient = new BrowserPerformanceClient(clientId, authority, logger, name, version, applicationTelemetry, cryptoOptions);

            const measurement = browserPerfClient.startMeasurement(PerformanceEvents.AcquireTokenSilent, correlationId);

            const result = measurement.endMeasurement();

            expect(result?.durationMs).toBe(50);
        });

        it("captures page visibilityState", () => {
            const spy = jest.spyOn(Document.prototype,"visibilityState", "get").mockReturnValue("visible");

            const browserPerfClient = new BrowserPerformanceClient(clientId, authority, logger, name, version, applicationTelemetry, cryptoOptions);

            const measurement = browserPerfClient.startMeasurement(PerformanceEvents.AcquireTokenSilent, correlationId);

            const result = measurement.endMeasurement();

            expect(result?.startPageVisibility).toBe("visible");
            expect(result?.endPageVisibility).toBe("visible");

            spy.mockClear();
        });
    });

    it("supportsBrowserPerformanceNow returns false if window.performance not present", () => {
        const browserPerfClient = new BrowserPerformanceClient(clientId, authority, logger, name, version, applicationTelemetry, cryptoOptions);

        // @ts-ignore
        jest.spyOn(window, "performance", "get").mockReturnValue(undefined);

        expect(browserPerfClient.supportsBrowserPerformanceNow()).toBe(false);
    });

    it("sets pre-queue time", () => {
        const browserPerfClient = new BrowserPerformanceClient(clientId, authority, logger, name, version, applicationTelemetry, cryptoOptions);
        const eventName = PerformanceEvents.AcquireTokenSilent;
        const correlationId = 'test-correlation-id';

        browserPerfClient.setPreQueueTime(eventName, correlationId);
        // @ts-ignore
        expect(browserPerfClient.getPreQueueTime(eventName, correlationId)).toEqual(perfTimeNow);
        // @ts-ignore
        expect(browserPerfClient.preQueueTimeByCorrelationId.get(correlationId)).toEqual({name: eventName, time: perfTimeNow});
    });
});

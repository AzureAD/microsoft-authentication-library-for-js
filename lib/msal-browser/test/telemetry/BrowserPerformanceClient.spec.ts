import { ApplicationTelemetry, Logger, PerformanceClient, PerformanceEvents, QueueMeasurement } from "@azure/msal-common";
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

    describe("addQueueMeasurement", () => {
        it("returns if no preQueueTime", () => {
            const spy = jest.spyOn(PerformanceClient.prototype, "addQueueMeasurement");

            const browserPerfClient = new BrowserPerformanceClient(clientId, authority, logger, name, version, applicationTelemetry, cryptoOptions);
            const preQueueObject = {
                eventName: PerformanceEvents.AcquireTokenSilent,
                correlationId
            } as QueueMeasurement;

            browserPerfClient.addQueueMeasurement(preQueueObject);

            expect(spy).toHaveBeenCalledTimes(0);
        });

        it("calls calculateQueuedTime and addQueueMeasuremnets", () => {
            const calculateTimeSpy = jest.spyOn(PerformanceClient.prototype, "calculateQueuedTime");
            const addQueueSpy = jest.spyOn(PerformanceClient.prototype, "addQueueMeasurement");

            const browserPerfClient = new BrowserPerformanceClient(clientId, authority, logger, name, version, applicationTelemetry, cryptoOptions);
            const preQueueObject = {
                eventName: PerformanceEvents.AcquireTokenSilent,
                correlationId,
                preQueueTime: 12345
            } as QueueMeasurement;

            browserPerfClient.addQueueMeasurement(preQueueObject);

            expect(calculateTimeSpy).toHaveBeenCalledTimes(1);
            expect(addQueueSpy).toHaveBeenCalledTimes(1);
        });

    });
});

import {ApplicationTelemetry, ICrypto, Logger, PerformanceClient, PerformanceEvents} from "@azure/msal-common";
import { name, version } from "../../src/packageMetadata";
import { BrowserPerformanceClient } from "../../src/telemetry/BrowserPerformanceClient";
import {BrowserTelemetryFactory} from "../../src/telemetry/BrowserTelemetryFactory";
import {CryptoOps} from "../../src/crypto/CryptoOps";

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
    beforeAll(() => {
        const crypto: ICrypto = new CryptoOps(logger, cryptoOptions);

        BrowserTelemetryFactory.initClient({
            clientId,
            authority,
            logger,
            name,
            version,
            application: applicationTelemetry,
            crypto,
            isBrowserEnv: true
        })
    })

    afterAll(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    describe("generateId", () => {
        it("returns a string", () => {
            expect(typeof BrowserTelemetryFactory.client().generateId()).toBe("string");
        });
    });
    describe("startPerformanceMeasuremeant", () => {
        it("calculate performance duration", () => {
            const measurement = BrowserTelemetryFactory.client().startMeasurement(PerformanceEvents.AcquireTokenSilent, correlationId);

            const result = measurement.endMeasurement();

            expect(result?.durationMs).toBe(50);
        });

        it("captures page visibilityState", () => {
            const spy = jest.spyOn(Document.prototype,"visibilityState", "get").mockReturnValue("visible");

            const measurement = BrowserTelemetryFactory.client().startMeasurement(PerformanceEvents.AcquireTokenSilent, correlationId);

            const result = measurement.endMeasurement();

            expect(result?.startPageVisibility).toBe("visible");
            expect(result?.endPageVisibility).toBe("visible");

            spy.mockClear();
        });
    });

    it("supportsBrowserPerformanceNow returns false if window.performance not present", () => {
        // @ts-ignore
        jest.spyOn(window, "performance", "get").mockReturnValue(undefined);

        expect(BrowserTelemetryFactory.client() instanceof BrowserPerformanceClient).toBeTruthy();
        expect((BrowserTelemetryFactory.client() as BrowserPerformanceClient).supportsBrowserPerformanceNow()).toBeFalsy();
    });
});

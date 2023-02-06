import sinon from "sinon";
import {BrowserTelemetryFactory} from "../../src/telemetry/BrowserTelemetryFactory";
import {TEST_CONFIG} from "./StringConstants";
import {IPerformanceClient, Logger} from "@azure/msal-common";
import {CryptoOps} from "../../src/crypto/CryptoOps";

export function stubPerformanceClient(performanceClient?: IPerformanceClient): IPerformanceClient {
    const client = performanceClient || {
        startMeasurement: jest.fn(),
        endMeasurement: jest.fn(),
        addStaticFields: jest.fn(),
        flushMeasurements: jest.fn(),
        discardMeasurements: jest.fn(),
        removePerformanceCallback: jest.fn(),
        addPerformanceCallback: jest.fn(),
        emitEvents: jest.fn(),
        startPerformanceMeasurement: jest.fn(),
        startPerformanceMeasuremeant: jest.fn(),
        generateId: jest.fn(),
        calculateQueuedTime: jest.fn(),
        addQueueMeasurement: jest.fn(),
        setPreQueueTime: jest.fn()
    };

    sinon.stub(BrowserTelemetryFactory, "client").returns(client);

    return client;
}

export function mockPerformanceClient(): void {
    const logger = new Logger({});
    BrowserTelemetryFactory.initClient({
        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
        logger,
        name: TEST_CONFIG.applicationName,
        version: TEST_CONFIG.applicationVersion,
        application: {
            appName: TEST_CONFIG.applicationName,
            appVersion: TEST_CONFIG.applicationVersion,
        },
        authority: "test-authority",
        isBrowserEnv: true,
        crypto: new CryptoOps(logger)
    });
}

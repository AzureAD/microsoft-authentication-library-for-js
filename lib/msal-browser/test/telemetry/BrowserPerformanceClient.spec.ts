/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ApplicationTelemetry,
    Logger,
    PerformanceEvents,
} from "@azure/msal-common";
import { name, version } from "../../src/packageMetadata";
import { BrowserPerformanceClient } from "../../src/telemetry/BrowserPerformanceClient";
import { TEST_CONFIG } from "../utils/StringConstants";

const correlationId = "correlation-id";

let testAppConfig = {
    auth: {
        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
    },
};

jest.mock("../../src/telemetry/BrowserPerformanceMeasurement", () => {
    return {
        BrowserPerformanceMeasurement: jest.fn().mockImplementation(() => {
            return {
                startMeasurement: () => {},
                endMeasurement: () => {},
                flushMeasurement: () => 50,
            };
        }),
    };
});

describe("BrowserPerformanceClient.ts", () => {
    afterAll(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    it("sets pre-queue time", () => {
        const browserPerfClient = new BrowserPerformanceClient(testAppConfig);
        const eventName = PerformanceEvents.AcquireTokenSilent;
        const correlationId = "test-correlation-id";
        const perfTimeNow = 1234567890;

        jest.spyOn(window.performance, "now").mockReturnValue(perfTimeNow);

        browserPerfClient.setPreQueueTime(eventName, correlationId);
        // @ts-ignore
        expect(
            browserPerfClient.getPreQueueTime(eventName, correlationId)
        ).toEqual(perfTimeNow);
        expect(
            // @ts-ignore
            browserPerfClient.preQueueTimeByCorrelationId.get(correlationId)
        ).toEqual({ name: eventName, time: perfTimeNow });
    });

    describe("generateId", () => {
        it("returns a string", () => {
            const browserPerfClient = new BrowserPerformanceClient(
                testAppConfig
            );

            expect(typeof browserPerfClient.generateId()).toBe("string");
        });
    });
    describe("startPerformanceMeasurement", () => {
        it("calculate performance duration", () => {
            const browserPerfClient = new BrowserPerformanceClient(
                testAppConfig
            );

            const measurement = browserPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenSilent,
                correlationId
            );

            const result = measurement.end();

            expect(result?.durationMs).toBe(50);
        });

        it("captures page visibilityState", () => {
            const spy = jest
                .spyOn(Document.prototype, "visibilityState", "get")
                .mockReturnValue("visible");

            const browserPerfClient = new BrowserPerformanceClient(
                testAppConfig
            );

            const measurement = browserPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenSilent,
                correlationId
            );

            const result = measurement.end();

            expect(result?.startPageVisibility).toBe("visible");
            expect(result?.endPageVisibility).toBe("visible");

            spy.mockClear();
        });
    });

    it("supportsBrowserPerformanceNow returns false if window.performance not present", () => {
        const browserPerfClient = new BrowserPerformanceClient(testAppConfig);

        // @ts-ignore
        jest.spyOn(window, "performance", "get").mockReturnValue(undefined);

        expect(browserPerfClient.supportsBrowserPerformanceNow()).toBe(false);
    });
});

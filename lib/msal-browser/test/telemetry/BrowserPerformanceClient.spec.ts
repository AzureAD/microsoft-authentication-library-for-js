/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PerformanceEvents } from "@azure/msal-common";
import { BrowserPerformanceClient } from "../../src/telemetry/BrowserPerformanceClient.js";
import { TEST_CONFIG } from "../utils/StringConstants.js";

const correlationId = "correlation-id";
const perfTimeNow = 1234567890;

let testAppConfig = {
    auth: {
        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
    },
};

describe("BrowserPerformanceClient.ts", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("sets pre-queue time", () => {
        const browserPerfClient = new BrowserPerformanceClient(testAppConfig);
        const eventName = PerformanceEvents.AcquireTokenSilent;
        const correlationId = "test-correlation-id";

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

            jest.spyOn(window.performance, "now")
                .mockReturnValueOnce(perfTimeNow)
                .mockReturnValue(perfTimeNow + 50);

            const measurement = browserPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenSilent,
                correlationId
            );

            const result = measurement.end();

            expect(result?.durationMs).toBe(50);
            expect(
                // @ts-ignore
                BrowserPerformanceClient.PERF_MEASUREMENT_MODULE
            ).toBeUndefined();
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
        });
    });

    describe("setPreQueueTime", () => {
        it("setPreQueueTime returns if window.performance is not available", () => {
            const addQueueMeasurementSpy = jest.spyOn(
                BrowserPerformanceClient.prototype,
                "addQueueMeasurement"
            );

            const browserPerfClient = new BrowserPerformanceClient(
                testAppConfig
            );
            const correlationId = "dummy-correlation-id";
            // @ts-ignore
            browserPerfClient.preQueueTimeByCorrelationId.set(correlationId, {
                name: PerformanceEvents.AcquireTokenSilent,
                time: 12345,
            });

            jest.spyOn(window, "performance", "get") // @ts-ignore
                .mockReturnValue(undefined);

            browserPerfClient.setPreQueueTime(
                PerformanceEvents.AcquireTokenSilent,
                "dummy-correlation-id"
            );
            expect(addQueueMeasurementSpy).toBeCalledTimes(0);
        });

        it("setPreQueueTime adds queue measurement if window.performance available", () => {
            // @ts-ignore
            jest.spyOn(window, "performance", "get").mockReturnValue({
                now: jest.fn(),
            });
            jest.spyOn(window.performance, "now").mockReturnValue(perfTimeNow);
            const addQueueMeasurementSpy = jest.spyOn(
                BrowserPerformanceClient.prototype,
                "addQueueMeasurement"
            );

            const browserPerfClient = new BrowserPerformanceClient(
                testAppConfig
            );
            const correlationId = "dummy-correlation-id";
            // @ts-ignore
            browserPerfClient.preQueueTimeByCorrelationId.set(correlationId, {
                name: PerformanceEvents.AcquireTokenSilent,
                time: 12345,
            });

            browserPerfClient.setPreQueueTime(
                PerformanceEvents.AcquireTokenSilent,
                "dummy-correlation-id"
            );
            expect(addQueueMeasurementSpy).toBeCalledTimes(1);
        });
    });
});

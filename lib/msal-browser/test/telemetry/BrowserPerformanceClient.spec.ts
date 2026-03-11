/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrowserPerformanceClient } from "../../src/telemetry/BrowserPerformanceClient.js";
import { TEST_CONFIG } from "../utils/StringConstants.js";
import * as BrowserPerformanceEvents from "../../src/telemetry/BrowserRootPerformanceEvents.js";

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

    describe("generateId", () => {
        it("returns a string", () => {
            const browserPerfClient = new BrowserPerformanceClient(
                testAppConfig
            );

            expect(typeof browserPerfClient.generateId()).toBe("string");
        });
    });

    describe("startMeasurement", () => {
        let originalConnectionDescriptor: PropertyDescriptor | undefined;

        beforeEach(() => {
            originalConnectionDescriptor = Object.getOwnPropertyDescriptor(
                navigator,
                "connection"
            );
        });

        afterEach(() => {
            if (originalConnectionDescriptor !== undefined) {
                Object.defineProperty(
                    navigator,
                    "connection",
                    originalConnectionDescriptor
                );
            } else {
                try {
                    delete (navigator as any).connection;
                } catch {
                    // ignore if non-deletable
                }
            }
        });

        it("calculate performance duration", () => {
            const browserPerfClient = new BrowserPerformanceClient(
                testAppConfig
            );

            jest.spyOn(window.performance, "now")
                .mockReturnValueOnce(perfTimeNow)
                .mockReturnValue(perfTimeNow + 50);

            const measurement = browserPerfClient.startMeasurement(
                BrowserPerformanceEvents.AcquireTokenSilent,
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
                BrowserPerformanceEvents.AcquireTokenSilent,
                correlationId
            );

            const result = measurement.end();

            expect(result?.startPageVisibility).toBe("visible");
            expect(result?.endPageVisibility).toBe("visible");
        });

        it("captures online status at measurement start", () => {
            jest.spyOn(
                Object.getPrototypeOf(navigator),
                "onLine",
                "get"
            ).mockReturnValue(true);
        });

        it("includes network information in performance event result", () => {
            const browserPerfClient = new BrowserPerformanceClient(
                testAppConfig
            );

            const mockConnection = {
                effectiveType: "4g",
                rtt: 50,
            };
            Object.defineProperty(navigator, "connection", {
                value: mockConnection,
                configurable: true,
            });

            jest.spyOn(window.performance, "now")
                .mockReturnValueOnce(perfTimeNow)
                .mockReturnValue(perfTimeNow + 75);

            const measurement = browserPerfClient.startMeasurement(
                BrowserPerformanceEvents.AcquireTokenSilent,
                correlationId
            );

            const result = measurement.end();

            expect(result?.startOnlineStatus).toBe(true);
            expect(result?.networkEffectiveType).toBe("4g");
            expect(result?.networkRtt).toBe(50);
        });

        it("handles missing navigator.connection without throwing", () => {
            const browserPerfClient = new BrowserPerformanceClient(
                testAppConfig
            );

            Object.defineProperty(navigator, "connection", {
                value: undefined,
                configurable: true,
            });

            jest.spyOn(window.performance, "now")
                .mockReturnValueOnce(perfTimeNow)
                .mockReturnValue(perfTimeNow + 100);

            const measurement = browserPerfClient.startMeasurement(
                BrowserPerformanceEvents.AcquireTokenSilent,
                correlationId
            );

            let result;
            expect(() => {
                result = measurement.end();
            }).not.toThrow();
            expect(result).not.toBeNull();
        });
    });
});

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ApplicationTelemetry,
    IGuidGenerator,
    IPerformanceClient,
    Logger,
    PerformanceEvents,
    PerformanceEventStatus,
} from "../../src";
import crypto from "crypto";
import {
    compactStack,
    compactStackLine,
} from "../../src/telemetry/performance/PerformanceClient";
import * as PerformanceClient from "../../src/telemetry/performance/PerformanceClient";

const sampleClientId = "test-client-id";
const authority = "https://login.microsoftonline.com/common";
const libraryName = "@azure/msal-common";
const libraryVersion = "1.0.0";
const samplePerfDuration = 50.25;
const sampleApplicationTelemetry: ApplicationTelemetry = {
    appName: "Test Comon App",
    appVersion: "1.0.0-test.1",
};

const logger = new Logger({
    loggerCallback: () => {},
});

class MockGuidGenerator implements IGuidGenerator {
    generateGuid(): string {
        return crypto["randomUUID"]();
    }
    isGuid(guid: string): boolean {
        return true;
    }
}

// @ts-ignore
export class MockPerformanceClient
    extends PerformanceClient.PerformanceClient
    implements IPerformanceClient
{
    private guidGenerator: MockGuidGenerator;

    constructor() {
        super(
            sampleClientId,
            authority,
            logger,
            libraryName,
            libraryVersion,
            sampleApplicationTelemetry
        );
        this.guidGenerator = new MockGuidGenerator();
    }

    generateId(): string {
        return this.guidGenerator.generateGuid();
    }

    setPreQueueTime(
        eventName: PerformanceEvents,
        correlationId?: string | undefined
    ): void {
        return;
    }

    getDurationMs(startTimeMs: number): number {
        return samplePerfDuration;
    }
}

describe("PerformanceClient.spec.ts", () => {
    afterEach(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    it("Adds and removes a callback", () => {
        const mockPerfClient = new MockPerformanceClient();

        const callbackId = mockPerfClient.addPerformanceCallback((events) => {
            console.log(events);
        });

        const result = mockPerfClient.removePerformanceCallback(callbackId);

        expect(result).toBe(true);
    });

    it("starts, ends, and emits an event", (done) => {
        const mockPerfClient = new MockPerformanceClient();

        const correlationId = "test-correlation-id";

        mockPerfClient.addPerformanceCallback((events) => {
            expect(events.length).toBe(1);
            expect(events[0].correlationId).toBe(correlationId);
            expect(events[0].authority).toBe(authority);
            expect(events[0].durationMs).toBe(Math.floor(samplePerfDuration));
            expect(events[0].clientId).toBe(sampleClientId);
            expect(events[0].libraryName).toBe(libraryName);
            expect(events[0].libraryVersion).toBe(libraryVersion);
            expect(events[0].success).toBe(true);
            expect(events[0].appName).toBe(sampleApplicationTelemetry.appName);
            expect(events[0].appVersion).toBe(
                sampleApplicationTelemetry.appVersion
            );
            expect(events[0]["acquireTokenSilentAsyncDurationMs"]).toBe(
                Math.floor(samplePerfDuration)
            );
            done();
        });

        // Start and end top-level measurement
        const topLevelEvent = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            correlationId
        );

        // Start and end submeasurement
        const subMeasurement = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilentAsync,
            correlationId
        );
        subMeasurement.end({
            success: true,
        });

        topLevelEvent.end({
            success: true,
        });
    });

    it("adds fields", (done) => {
        const mockPerfClient = new MockPerformanceClient();

        const correlationId = "test-correlation-id";
        const authority = "test-authority";
        const extensionId = "test-extension-id";

        mockPerfClient.addPerformanceCallback((events) => {
            expect(events.length).toBe(1);
            expect(events[0].correlationId).toBe(correlationId);
            expect(events[0].extensionId).toBe(extensionId);
            done();
        });

        const topLevelEvent = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            correlationId
        );
        topLevelEvent.add({
            httpVerAuthority: authority,
            extensionId: extensionId,
        });
        topLevelEvent.end({
            success: true,
        });
    });

    it("increments", (done) => {
        const mockPerfClient = new MockPerformanceClient();

        const correlationId = "test-correlation-id";

        mockPerfClient.addPerformanceCallback((events) => {
            expect(events.length).toBe(1);

            expect(events[0].correlationId).toBe(correlationId);
            expect(events[0].visibilityChangeCount).toBe(8);
            done();
        });

        const topLevelEvent = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            correlationId
        );
        topLevelEvent.increment({ visibilityChangeCount: 5 });
        topLevelEvent.increment({ visibilityChangeCount: 3 });
        topLevelEvent.end({
            success: true,
        });
    });

    it("captures submeasurements", (done) => {
        const mockPerfClient = new MockPerformanceClient();
        const correlationId = "test-correlation-id";

        mockPerfClient.addPerformanceCallback((events) => {
            expect(events.length).toEqual(1);
            const event = events[0];
            expect(event["acquireTokenSilentAsyncDurationMs"]).toBe(
                Math.floor(samplePerfDuration)
            );
            expect(event["silentIframeClientAcquireTokenDurationMs"]).toBe(
                Math.floor(samplePerfDuration)
            );
            expect(event.incompleteSubsCount).toEqual(0);
            done();
        });

        // Start and end top-level measurement
        const topLevelEvent = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            correlationId
        );

        // Start and complete submeasurements
        mockPerfClient
            .startMeasurement(
                PerformanceEvents.AcquireTokenSilentAsync,
                correlationId
            )
            .end({ status: PerformanceEventStatus.Completed });
        mockPerfClient
            .startMeasurement(
                PerformanceEvents.SilentIframeClientAcquireToken,
                correlationId
            )
            .end({ status: PerformanceEventStatus.Completed });

        // End top level event without ending submeasurement
        topLevelEvent.end({
            success: true,
        });
    });

    it("discards incomplete submeasurements", (done) => {
        const mockPerfClient = new MockPerformanceClient();
        const correlationId = "test-correlation-id";

        mockPerfClient.addPerformanceCallback((events) => {
            expect(events.length).toEqual(1);
            const event = events[0];
            expect(event["acquireTokenSilentAsyncDurationMs"]).toBeUndefined();
            expect(event["silentIframeClientAcquireTokenDurationMs"]).toBe(
                Math.floor(samplePerfDuration)
            );
            expect(
                event["silentCacheClientAcquireTokenDurationMs"]
            ).toBeUndefined();
            expect(event.incompleteSubsCount).toEqual(2);
            done();
        });

        // Start and end top-level measurement
        const topLevelEvent = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            correlationId
        );

        // Start submeasurement but dont end it
        mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilentAsync,
            correlationId
        );
        mockPerfClient
            .startMeasurement(
                PerformanceEvents.SilentIframeClientAcquireToken,
                correlationId
            )
            .end({ status: PerformanceEventStatus.Completed });
        mockPerfClient.startMeasurement(
            PerformanceEvents.SilentCacheClientAcquireToken,
            correlationId
        );

        // End top level event without ending submeasurement
        topLevelEvent.end({
            success: true,
        });
    });

    it("only records the first measurement for a subMeasurement", (done) => {
        const mockPerfClient = new MockPerformanceClient();

        const correlationId = "test-correlation-id";
        const durationMs = 1;

        mockPerfClient.addPerformanceCallback((events) => {
            expect(events.length).toBe(1);
            const event = events[0];
            expect(events[0]["acquireTokenSilentAsyncDurationMs"]).toBe(
                Math.floor(durationMs)
            );
            expect(event.incompleteSubsCount).toEqual(0);
            expect(event.durationMs).toEqual(Math.floor(samplePerfDuration));
            done();
        });

        // Start and end top-level measurement
        const topLevelEvent = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            correlationId
        );

        // Start and end submeasurements
        const subMeasure1 = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilentAsync,
            correlationId
        );
        subMeasure1.end({
            success: true,
        });

        const subMeasure2 = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilentAsync,
            correlationId
        );
        subMeasure2.end({
            success: true,
            durationMs: durationMs,
        });

        topLevelEvent.end({
            success: true,
        });
    });

    it("gracefully handles two requests with the same correlation id", (done) => {
        const mockPerfClient = new MockPerformanceClient();

        const correlationId = "test-correlation-id";
        let event1Id: string;

        mockPerfClient.addPerformanceCallback((events) => {
            expect(events.length).toBe(1);
            expect(events[0].eventId).toBe(event1Id);
            expect(events[0].success).toBeFalsy();
            expect(events[0]["acquireTokenSilentDurationMs"]).toBe(
                Math.floor(samplePerfDuration)
            );

            done();
        });

        // Start and end top-level measurement
        const topLevelEvent1 = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            correlationId
        );
        event1Id = topLevelEvent1.event.eventId;
        const topLevelEvent2 = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            correlationId
        );

        topLevelEvent2.end({
            success: true,
            startTimeMs: topLevelEvent1.event.startTimeMs + 5,
        });
        topLevelEvent1.end({
            success: false,
        });
    });

    it("truncates integral fields", (done) => {
        const mockPerfClient = new MockPerformanceClient();

        const correlationId = "test-correlation-id";
        const accessTokenSize = 12345.67;
        const refreshTokenSize = 23456.78;
        const idTokenSize = undefined;

        function isIntegral(val: number | undefined) {
            return val && Math.floor(val) === val;
        }

        mockPerfClient.addPerformanceCallback((events) => {
            expect(events.length).toBe(1);
            expect(isIntegral(events[0].startTimeMs)).toBeTruthy();
            expect(isIntegral(events[0].durationMs)).toBeTruthy();
            expect(isIntegral(events[0].accessTokenSize)).toBeTruthy();
            expect(isIntegral(events[0].refreshTokenSize)).toBeTruthy();
            expect(isIntegral(events[0].idTokenSize)).toBeUndefined();

            done();
        });

        // Start and end top-level measurement
        const topLevelEvent = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            correlationId
        );
        topLevelEvent.add({
            accessTokenSize,
            refreshTokenSize,
            idTokenSize,
        });
        topLevelEvent.end({
            success: true,
        });
    });

    it("captures total count of manually completed queue events", (done) => {
        const mockPerfClient = new MockPerformanceClient();
        const correlationId = "test-correlation-id";

        mockPerfClient.addPerformanceCallback((events) => {
            expect(events.length).toEqual(1);
            const event = events[0];
            expect(event.queuedCount).toEqual(4);
            expect(event.queuedManuallyCompletedCount).toEqual(2);
            expect(event.queuedTimeMs).toEqual(3);
            done();
        });

        const topLevelEvent = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            correlationId
        );

        mockPerfClient.addQueueMeasurement(
            PerformanceEvents.SilentCacheClientAcquireToken,
            topLevelEvent.event.correlationId,
            1,
            false
        );
        mockPerfClient.addQueueMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            topLevelEvent.event.correlationId,
            2,
            false
        );
        mockPerfClient.addQueueMeasurement(
            PerformanceEvents.AcquireTokenByRefreshToken,
            topLevelEvent.event.correlationId,
            3,
            true
        );
        mockPerfClient.addQueueMeasurement(
            PerformanceEvents.GetAuthCodeUrl,
            topLevelEvent.event.correlationId,
            4,
            true
        );

        topLevelEvent.end({
            success: true,
        });
    });

    describe("addError", () => {
        it("adds error", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";
            const error = new Error("Non-auth test error");

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(event.errorStack?.length).toEqual(5);
                expect(event.errorName).toEqual("Error");
                expect(
                    event.errorStack?.some((v) => v.includes("Test error"))
                ).toBeFalsy();
                done();
            });

            const topLevelEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenSilent,
                correlationId
            );
            topLevelEvent.end(
                {
                    success: false,
                },
                error
            );
        });

        it("does not override error stack", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(event.errorStack?.length).toEqual(5);
                expect(event.errorName).toEqual("Error");
                done();
            });

            const topLevelEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenSilent,
                correlationId
            );
            PerformanceClient.addError(
                new Error("Test error"),
                logger,
                // @ts-ignore
                mockPerfClient.eventsByCorrelationId.get(correlationId)
            );
            const newError = new Error("Test error 2");
            newError.stack = "Test message\n at line1 \n at line 2";
            topLevelEvent.end(
                {
                    success: false,
                },
                newError
            );
        });
    });

    describe("compactStackTrace", () => {
        it("compacts error stack", () => {
            const error = new Error("test error");
            error.stack = "";
            for (let ix = 1; ix <= 20; ix++) {
                error.stack += `  at testFunction${ix} (microsoft-authentication-library-for-js/lib/msal-browser/testFile${ix}.js:10:1)\n`;
            }

            const result1 = compactStack(error.stack!, 3);
            expect(result1.length).toEqual(3);
            expect(result1).toEqual([
                "at testFunction18 (testFile18.js:10:1)",
                "at testFunction19 (testFile19.js:10:1)",
                "at testFunction20 (testFile20.js:10:1)",
            ]);

            expect(compactStack(error.stack!, -2)).toEqual([]);

            expect(
                compactStack(
                    "Test error message\n   at testFunction (microsoft-authentication-library-for-js/lib/msal-browser/testFile.js:10:1)",
                    3
                )
            ).toEqual(["at testFunction (testFile.js:10:1)"]);
        });

        it("handles empty error stack", () => {
            expect(compactStack("", 3)).toEqual([]);
        });

        it("handles error stack with a single error message", () => {
            expect(compactStack("Test error message", 3)).toEqual([]);
        });
    });

    describe("compactStackLine", () => {
        it("compacts stack line", () => {
            expect(
                compactStackLine(
                    "testFunction at (/microsoft-authentication-library-for-js/lib/msal-browser/app/PublicClientApplication.spec.ts:1234:56)"
                )
            ).toEqual(
                "testFunction at (PublicClientApplication.spec.ts:1234:56)"
            );

            expect(
                compactStackLine(
                    "testFunction at /microsoft-authentication-library-for-js/lib/msal-browser/app/PublicClientApplication.spec.ts:1234:56"
                )
            ).toEqual(
                "testFunction at (PublicClientApplication.spec.ts:1234:56)"
            );

            expect(
                compactStackLine(
                    "testFunction at (PublicClientApplication.spec.ts:1234:56)"
                )
            ).toEqual(
                "testFunction at (PublicClientApplication.spec.ts:1234:56)"
            );
        });

        it("compacts minified bundle stack line", () => {
            expect(
                compactStackLine(
                    "testFunction at (https://localhost/something/testMinified.jsbundle:1234:56)"
                )
            ).toEqual("testFunction at (testMinified.jsbundle:1234:56)");

            expect(
                compactStackLine(
                    "testFunction at (testMinified.jsbundle:1234:56)"
                )
            ).toEqual("testFunction at (testMinified.jsbundle:1234:56)");
        });
    });

    describe("calculateQueuedTime", () => {
        it("returns the queuedTime calculation", () => {
            const mockPerfClient = new MockPerformanceClient();
            const result = mockPerfClient.calculateQueuedTime(1, 2);
            expect(result).toBe(1);
        });

        it("returns 0 if preQueueTime is not positive integer", () => {
            const mockPerfClient = new MockPerformanceClient();
            const result = mockPerfClient.calculateQueuedTime(-1, 1);
            expect(result).toBe(0);
        });

        it("returns 0 if currentTime is not positive integer", () => {
            const mockPerfClient = new MockPerformanceClient();
            const result = mockPerfClient.calculateQueuedTime(1, -1);
            expect(result).toBe(0);
        });

        it("returns 0 if preQueueTime is greater than currentTime", () => {
            const mockPerfClient = new MockPerformanceClient();
            const result = mockPerfClient.calculateQueuedTime(2, 1);
            expect(result).toBe(0);
        });
    });
});

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ApplicationTelemetry,
    IGuidGenerator,
    IPerformanceClient,
    IPerformanceMeasurement,
    Logger,
    PerformanceClient,
    PerformanceEvents,
    PerformanceEventStatus,
} from "../../src";
import crypto from "crypto";

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

class MockPerformanceMeasurement implements IPerformanceMeasurement {
    startMeasurement(): void {}
    endMeasurement(): void {}
    flushMeasurement(): number | null {
        return samplePerfDuration;
    }
}

class UnsupportedBrowserPerformanceMeasurement extends MockPerformanceMeasurement {
    flushMeasurement(): number | null {
        return null;
    }
}

class MockGuidGenerator implements IGuidGenerator {
    generateGuid(): string {
        return crypto["randomUUID"]();
    }
    isGuid(guid: string): boolean {
        return true;
    }
}

export class MockPerformanceClient
    extends PerformanceClient
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

    startPerformanceMeasurement(
        measureName: string,
        correlationId?: string
    ): IPerformanceMeasurement {
        return new MockPerformanceMeasurement();
    }

    setPreQueueTime(
        eventName: PerformanceEvents,
        correlationId?: string | undefined
    ): void {
        return;
    }
}

class UnsupportedBrowserPerformanceClient extends MockPerformanceClient {
    startPerformanceMeasurement(
        measureName: string,
        correlationId?: string
    ): IPerformanceMeasurement {
        return new UnsupportedBrowserPerformanceMeasurement();
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

        mockPerfClient.addPerformanceCallback((events) => {
            expect(events.length).toBe(1);
            const event = events[0];
            expect(events[0]["acquireTokenSilentAsyncDurationMs"]).toBe(
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
            durationMs: 1,
        });

        topLevelEvent.end({
            success: true,
        });
    });

    it("Events are not emittted for unsupported browsers", () => {
        const mockPerfClient = new UnsupportedBrowserPerformanceClient();

        const correlationId = "test-correlation-id";

        mockPerfClient.addPerformanceCallback((events) => {
            expect(events.length).toBe(0);
        });

        // Start and end top-level measurement
        const measure = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            correlationId
        );
        const result = measure.end({
            success: true,
        });

        expect(result).toBe(null);
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

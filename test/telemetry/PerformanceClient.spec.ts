/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ApplicationTelemetry, IGuidGenerator, IPerformanceMeasurement, Logger, PerformanceEvents } from "../../src";
import { IPerformanceClient } from "../../src/telemetry/performance/IPerformanceClient";
import { PerformanceClient } from "../../src/telemetry/performance/PerformanceClient";
import { randomUUID } from 'crypto';

const sampleClientId = "test-client-id";
const authority = "https://login.microsoftonline.com/common";
const libraryName = "@azure/msal-common";
const libraryVersion = "1.0.0";
const samplePerfDuration = 50;
const sampleApplicationTelemetry: ApplicationTelemetry = {
    appName: "Test Comon App",
    appVersion: "1.0.0-test.1"
}

const logger = new Logger({
    loggerCallback: () => {}
});

class MockPerformanceMeasurement implements IPerformanceMeasurement {
    startMeasurement(): void {
        
    }
    endMeasurement(): void {
        
    }
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
        return randomUUID();
    }
    isGuid(guid: string): boolean {
        return true;
    }
}

class MockPerformanceClient extends PerformanceClient implements IPerformanceClient {
    private guidGenerator: MockGuidGenerator;

    constructor() {
        super(sampleClientId, authority, logger, libraryName, libraryVersion, sampleApplicationTelemetry);
        this.guidGenerator = new MockGuidGenerator();
    }

    generateId(): string {
        return this.guidGenerator.generateGuid();
    }

    startPerformanceMeasuremeant(measureName: string, correlationId?: string): IPerformanceMeasurement {
        return new MockPerformanceMeasurement();
    }
}

class UnsupportedBrowserPerformanceClient extends MockPerformanceClient {
    startPerformanceMeasuremeant(measureName: string, correlationId?: string): IPerformanceMeasurement {
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

        const callbackId = mockPerfClient.addPerformanceCallback((events =>{
            console.log(events);
        }));

        const result = mockPerfClient.removePerformanceCallback(callbackId);

        expect(result).toBe(true);
    });

    it("starts, ends, and emits an event", done => {
        const mockPerfClient = new MockPerformanceClient();

        const correlationId = "test-correlation-id";

        mockPerfClient.addPerformanceCallback((events =>{
            expect(events.length).toBe(1);

            expect(events[0].correlationId).toBe(correlationId);
            expect(events[0].authority).toBe(authority);
            expect(events[0].durationMs).toBe(samplePerfDuration);
            expect(events[0].clientId).toBe(sampleClientId);
            expect(events[0].libraryName).toBe(libraryName);
            expect(events[0].libraryVersion).toBe(libraryVersion);
            expect(events[0].success).toBe(true);
            expect(events[0].appName).toBe(sampleApplicationTelemetry.appName);
            expect(events[0].appVersion).toBe(sampleApplicationTelemetry.appVersion);
            expect(events[0]["acquireTokenSilentAsyncDurationMs"]).toBe(samplePerfDuration);
            done();
        }));

        // Start and end top-level measurement
        const topLevelEvent = mockPerfClient.startMeasurement(PerformanceEvents.AcquireTokenSilent, correlationId)
        topLevelEvent.endMeasurement({
            success: true
        });

        // Start and end submeasurement
        const subMeasurement = mockPerfClient.startMeasurement(PerformanceEvents.AcquireTokenSilentAsync, correlationId)
        subMeasurement.endMeasurement({
            success: true
        });

        topLevelEvent.flushMeasurement();
    });
    it("gracefully handles a submeasurement not being ended before top level measurement", done => {
        const mockPerfClient = new MockPerformanceClient();

        const endMeasurementSpy = jest.spyOn(mockPerfClient, "endMeasurement");

        const correlationId = "test-correlation-id";

        mockPerfClient.addPerformanceCallback((events =>{
            expect(events[0]["acquireTokenSilentAsyncDurationMs"]).toBe(50);

            // Ensure endMeasurement was called for the incomplete event
            expect(endMeasurementSpy.mock.calls[1][0].name).toBe(PerformanceEvents.AcquireTokenSilentAsync);
            done();
        }));

        // Start and end top-level measurement
        const topLevelEvent = mockPerfClient.startMeasurement(PerformanceEvents.AcquireTokenSilent, correlationId);

        // Start submeasurement but dont end it
        mockPerfClient.startMeasurement(PerformanceEvents.AcquireTokenSilentAsync, correlationId);

        // End top level event without ending submeasurement
        topLevelEvent.endMeasurement({
            success: true
        });

        // Emit events for this operation
        topLevelEvent.flushMeasurement();
    });

    it("only records the first measurement for a subMeasurement", done => {
        const mockPerfClient = new MockPerformanceClient();

        const correlationId = "test-correlation-id";

        mockPerfClient.addPerformanceCallback((events =>{
            expect(events.length).toBe(1);

            expect(events[0]["acquireTokenSilentAsyncDurationMs"]).toBe(samplePerfDuration);
            done();
        }));

        // Start and end top-level measurement
        const topLevelEvent = mockPerfClient.startMeasurement(PerformanceEvents.AcquireTokenSilent, correlationId);
        topLevelEvent.endMeasurement({
            success: true
        });

        // Start and end submeasurements
        const subMeasure1 = mockPerfClient.startMeasurement(PerformanceEvents.AcquireTokenSilentAsync, correlationId)
        subMeasure1.endMeasurement({
            success: true
        });

        const subMeasure2 = mockPerfClient.startMeasurement(PerformanceEvents.AcquireTokenSilentAsync, correlationId);
        subMeasure2.endMeasurement({
            success: true,
            durationMs: 1
        });

        topLevelEvent.flushMeasurement();
    });

    it("Events are not emittted for unsupported browsers", () => {
        const mockPerfClient = new UnsupportedBrowserPerformanceClient();

        const correlationId = "test-correlation-id";

        mockPerfClient.addPerformanceCallback((events =>{
            expect(events.length).toBe(0);
        }));

        // Start and end top-level measurement
        const measure = mockPerfClient.startMeasurement(PerformanceEvents.AcquireTokenSilent, correlationId);
        const result = measure.endMeasurement({
            success: true
        });
        
        mockPerfClient.flushMeasurements(PerformanceEvents.AcquireTokenSilent, correlationId);

        expect(result).toBe(null);
    });
    
    it("gracefully handles two requests with teh same correlation id", done => {
        const mockPerfClient = new MockPerformanceClient();

        const correlationId = "test-correlation-id";
        let event1Id: string;

        mockPerfClient.addPerformanceCallback((events =>{
            expect(events.length).toBe(1);

            expect(events[0].eventId).toBe(event1Id);

            done();
        }));

        // Start and end top-level measurement
        const topLevelEvent1 = mockPerfClient.startMeasurement(PerformanceEvents.AcquireTokenSilent, correlationId);
        const topLevelEvent2 = mockPerfClient.startMeasurement(PerformanceEvents.AcquireTokenSilent, correlationId);


        topLevelEvent1.endMeasurement({
            success: false
        });
        event1Id = topLevelEvent1.event.eventId;

        topLevelEvent2.endMeasurement({
            success: true,
            startTimeMs: topLevelEvent1.event.startTimeMs + 5
        });

        topLevelEvent2.flushMeasurement();
        topLevelEvent1.flushMeasurement();
    });
});

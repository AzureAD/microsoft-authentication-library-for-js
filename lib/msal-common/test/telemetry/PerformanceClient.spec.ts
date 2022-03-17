/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IGuidGenerator, IPerformanceMeasurement, Logger, PerformanceEvents } from "../../src";
import { IPerformanceClient } from "../../src/telemetry/performance/IPerformanceClient";
import { PerformanceClient } from "../../src/telemetry/performance/PerformanceClient";

const sampleClientId = "test-client-id";
const authority = "https://login.microsoftonline.com/common";
const libraryName = "@azure/msal-common";
const libraryVersion = "1.0.0";
const sampleGuid = "new-guid";
const samplePerfDuration = 50;

const logger = new Logger({
    loggerCallback: () => {}
});

class MockPerformanceMeasurement implements IPerformanceMeasurement {
    startMeasurement(): void {
        
    }
    endMeasurement(): void {
        
    }
    flushMeasurement(): number {
        return samplePerfDuration;
    }
}

class MockGuidGenerator implements IGuidGenerator {
    generateGuid(): string {
        return sampleGuid;
    }
    isGuid(guid: string): boolean {
        return true;
    }
}

class MockPerformanceClient extends PerformanceClient implements IPerformanceClient {
    private guidGenerator: MockGuidGenerator;

    constructor() {
        super(sampleClientId, authority, logger, libraryName, libraryVersion);
        this.guidGenerator = new MockGuidGenerator();
    }

    generateCallbackId(): string {
        return this.guidGenerator.generateGuid();
    }

    startPerformanceMeasuremeant(measureName: string, correlationId?: string): IPerformanceMeasurement {
        return new MockPerformanceMeasurement();
    }
}

describe("PerformanceClient.spec.ts", () => {
    it("Adds and removes a callback", () => {
        const mockPerfClient = new MockPerformanceClient();

        const callbackId = mockPerfClient.addPerformanceCallback((events =>{
            console.log(events);
        }));

        expect(callbackId).toBe(sampleGuid);

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
            expect(events[0]["acquireTokenSilentAsyncDurationMs"]).toBe(samplePerfDuration);
            done();
        }));

        // Start and end top-level measurement
        mockPerfClient.startMeasurement(PerformanceEvents.AcquireTokenSilent, correlationId)({
            success: true
        });

        // Start and end submeasurement
        mockPerfClient.startMeasurement(PerformanceEvents.AcquireTokenSilentAsync, correlationId)({
            success: true
        });

        mockPerfClient.flushMeasurements(PerformanceEvents.AcquireTokenSilent, correlationId);
    });
});

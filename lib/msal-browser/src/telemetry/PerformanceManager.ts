/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICrypto, Logger } from "@azure/msal-common";
import { PerformanceMeasurement } from "./PerformanceMeasurement";

export type PerformanceCallbackFunction = (events: PerformanceEvent[]) => void;

export type PerformanceEvent = {
    clientId: string
    durationMs: number,
    startTimeMs: number,
    name: string,
    correlationId?: string,
    success: boolean | null,
    startPageVisibility: VisibilityState | null,
    endPageVisibility: VisibilityState | null,
    fromCache: boolean | null,
};

export class PerformanceManager {
    private clientId: string;
    private logger: Logger;
    private crypto: ICrypto;
    private callbacks: Map<string, PerformanceCallbackFunction>;
    private eventsByCorrelationId: Map<string, PerformanceEvent[]>;
    
    constructor(clientId:string, logger: Logger, crypto: ICrypto) {
        this.clientId= clientId;
        this.logger = logger;
        this.crypto = crypto;
        this.callbacks = new Map();
        this.eventsByCorrelationId = new Map();
    }

    startMeasurement(measureName: string, correlationId?: string): (event?: Partial<PerformanceEvent>) => PerformanceEvent {
        this.logger.trace(`Performance measurement started for ${measureName}`, correlationId);
        const performanceMeasure = new PerformanceMeasurement(measureName, correlationId);
        performanceMeasure.startMeasurement();
        const startTimeMs = Date.now();
        const startPageVisibility = document.visibilityState || null;

        return (event?: Partial<PerformanceEvent>): PerformanceEvent => {
            return this.endMeasurement(performanceMeasure, {
                startTimeMs,
                startPageVisibility,
                ...event
            }, measureName, correlationId);
        };
    }

    endMeasurement(performanceMeasure: PerformanceMeasurement, additionalEventData: Partial<PerformanceEvent>, measureName: string, correlationId?: string): PerformanceEvent {
        performanceMeasure.endMeasurement();
        const durationMs = Math.round(performanceMeasure.flushMeasurement());
        this.logger.trace(`Performance measurement ended for ${measureName}: ${durationMs} ms`, correlationId);
        const event: PerformanceEvent = {
            clientId: this.clientId,
            success: null,
            fromCache: null,
            startTimeMs: 0,
            startPageVisibility: null,
            endPageVisibility: document.visibilityState || null,
            durationMs,
            name: measureName,
            correlationId,
            ...additionalEventData,
        };

        // Immediately flush events without correlation ids
        if (!correlationId) {
            this.emitEvents([event]);
        } else {
            const events = this.eventsByCorrelationId.get(correlationId);
            if (events) {
                this.logger.trace(`Performance measurement for ${measureName} added`, correlationId);
                events.push(event);
            } else {
                this.logger.trace(`Performance measurement for ${measureName} started`, correlationId);
                this.eventsByCorrelationId.set(correlationId, [event]);
            }
        }

        return event;
    }

    flushMeasurements(correlationId?: string): void {
        if (correlationId) {
            this.logger.trace("Performance measurements flushed", correlationId);
            const events = this.eventsByCorrelationId.get(correlationId);
            if (events) {
                this.emitEvents(events);
            }
        } else {
            // TODO: Flush all?
        }
    }

    addPerformanceCallback(callback: PerformanceCallbackFunction): string | null {
        if (typeof window !== "undefined") {
            const callbackId = this.crypto.createNewGuid();
            this.callbacks.set(callbackId, callback);
            this.logger.verbose(`Performance callback registered with id: ${callbackId}`);
    
            return callbackId;
        }
        
        return null;
    }

    removePerformanceCallback(callbackId: string): void {
        this.callbacks.delete(callbackId);
        this.logger.verbose(`Performance callback ${callbackId} removed.`);
    }

    emitEvents(events: PerformanceEvent[], correlationId?: string): void {
        if (typeof window !== "undefined") {
            this.logger.verbose("Emitting performance events", correlationId);

            this.callbacks.forEach((callback: PerformanceCallbackFunction, callbackId: string) => {
                this.logger.verbose(`Emitting event to callback ${callbackId}`, correlationId);
                callback.apply(null, [events]);
            });
        }
    }
}

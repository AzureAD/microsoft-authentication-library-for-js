/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICrypto, Logger } from "@azure/msal-common";
import { PerformanceMeasurement } from "./PerformanceMeasurement";

export type PerformanceCallbackFunction = (event: PerformanceEvent) => void;

export type PerformanceEvent = {
    durationMs: number,
    startTimeMs: number,
    name: string,
    correlationId?: string,
    success: boolean | null,
    visible: boolean | null,
    network: boolean | null,
};

export class PerformanceManager {
    private logger: Logger;
    private crypto: ICrypto;
    private callbacks: Map<string, PerformanceCallbackFunction>;
    
    constructor(logger: Logger, crypto: ICrypto) {
        this.logger = logger;
        this.crypto = crypto;
        this.callbacks = new Map();
    }

    startMeasurement(measureName: string, correlationId?: string): (event?: Partial<PerformanceEvent>) => PerformanceEvent {
        this.logger.trace(`Performance measurement started for ${measureName}`, correlationId);
        const performanceMeasure = new PerformanceMeasurement(measureName, correlationId);
        performanceMeasure.startMeasurement();
        const startTimeMs = Date.now();

        return (event?: Partial<PerformanceEvent>): PerformanceEvent => {
            return this.endMeasurement(performanceMeasure, {
                startTimeMs,
                ...event
            }, measureName, correlationId);
        };
    }

    endMeasurement(performanceMeasure: PerformanceMeasurement, additionalEventData: Partial<PerformanceEvent>, measureName: string, correlationId?: string): PerformanceEvent {
        performanceMeasure.endMeasurement();
        const durationMs = Math.round(performanceMeasure.flushMeasurement());
        this.logger.trace(`Performance measurement ended for ${measureName}: ${durationMs} ms`, correlationId);
        const event: PerformanceEvent = {
            success: null,
            network: null,
            startTimeMs: 0,
            ...additionalEventData,
            visible: document.visibilityState === "visible",
            durationMs,
            name: measureName,
            correlationId
        };

        this.emitEvent(event);

        return event;
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

    emitEvent(event: PerformanceEvent): void {
        if (typeof window !== "undefined") {
            this.logger.verbose(`Emitting performance event: ${event.name}`, event.correlationId);

            this.callbacks.forEach((callback: PerformanceCallbackFunction, callbackId: string) => {
                this.logger.verbose(`Emitting event to callback ${callbackId}: ${event.name}`, event.correlationId);
                callback.apply(null, [event]);
            });
        }
    }
}

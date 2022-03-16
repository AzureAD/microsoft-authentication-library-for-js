/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IGuidGenerator } from "../../crypto/IGuidGenerator";
import { Logger } from "../../logger/Logger";
import { IPerformanceClient, PerformanceCallbackFunction } from "./IPerformanceClient";
import { IPerformanceMeasurement } from "./IPerformanceMeasurement";
import { PerformanceEvent, PerformanceEvents } from "./PerformanceEvent";

export abstract class PerformanceClient implements IPerformanceClient {
    protected authority: string;
    protected libraryName: string;
    protected libraryVersion: string;
    protected clientId: string;
    protected logger: Logger;
    protected guidGenerator: IGuidGenerator;
    protected callbacks: Map<string, PerformanceCallbackFunction>;
    protected eventsByCorrelationId: Map<string, PerformanceEvent[]>;

    constructor(clientId: string, authority: string, logger: Logger, libraryName: string, libraryVersion: string) {
        this.authority = authority;
        this.libraryName = libraryName;
        this.libraryVersion = libraryVersion;
        this.clientId = clientId;
        this.logger = logger;
        this.callbacks = new Map();
        this.eventsByCorrelationId = new Map();
    }

    abstract startPerformanceMeasuremeant(measureName: string, correlationId?: string): IPerformanceMeasurement;

    startMeasurement(measureName: PerformanceEvents, correlationId?: string): (event?: Partial<PerformanceEvent>) => PerformanceEvent {
        this.logger.trace(`PerformanceManager: Performance measurement started for ${measureName}`, correlationId);
        const performanceMeasurement = this.startPerformanceMeasuremeant(measureName, correlationId);
        performanceMeasurement.startMeasurement();
        const startTimeMs = Date.now();

        return (event?: Partial<PerformanceEvent>): PerformanceEvent => {
            return this.endMeasurement(performanceMeasurement, {
                startTimeMs,
                ...event
            }, measureName, correlationId);
        };
    }

    endMeasurement(performanceMeasure: IPerformanceMeasurement, additionalEventData: Partial<PerformanceEvent>, measureName: PerformanceEvents, correlationId?: string): PerformanceEvent {
        performanceMeasure.endMeasurement();
        const durationMs = Math.round(performanceMeasure.flushMeasurement());
        this.logger.trace(`PerformanceManager: Performance measurement ended for ${measureName}: ${durationMs} ms`, correlationId);
        const event: PerformanceEvent = {
            authority: this.authority,
            libraryName: this.libraryName,
            libraryVersion: this.libraryVersion,
            clientId: this.clientId,
            success: null,
            fromCache: null,
            startTimeMs: 0,
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
                this.logger.trace(`PerformanceManager: Performance measurement for ${measureName} added`, correlationId);
                events.push(event);
            } else {
                this.logger.trace(`PerformanceManager: Performance measurement for ${measureName} started`, correlationId);
                this.eventsByCorrelationId.set(correlationId, [event]);
            }
        }

        return event;
    }

    flushMeasurements(measureName: PerformanceEvents, correlationId?: string): void {
        if (correlationId) {
            this.logger.trace("PerformanceManager: Performance measurements flushed", correlationId);
            const events = this.eventsByCorrelationId.get(correlationId);
            if (events) {
                const topLevelEvent = events.find(event => event.name === measureName);
                if (topLevelEvent) {
                    this.logger.verbose(`PerformanceManager: Measurement found for ${measureName}`, correlationId);
                    const subMeasurements = events.filter(event => event.name !== measureName);
                    subMeasurements.forEach(event => {
                        this.logger.verbose(`PerformanceManager: Sub measurement found for ${event.name}`, correlationId);
                        // TODO: Emit additional properties for each subMeasurement
                        const subMeasurementName = `${event.name}DurationMs`;
                        /*
                         * Some code paths, such as resolving an authority, can occur multiple times.
                         * Only take the first measurement since the second is often read from the cache.
                         */
                        if (!topLevelEvent[subMeasurementName]) {
                            topLevelEvent[subMeasurementName] = event.durationMs;
                        }
                    });

                    this.emitEvents([topLevelEvent]);
                }
            } else {
                this.logger.verbose("PerformanceManager: No measurements found", correlationId);
            }
        } else {
            // TODO: Flush all?
        }
    }

    discardMeasurements(measureName: PerformanceEvents, correlationId?: string): void {
        if (correlationId) {
            this.logger.trace("PerformanceManager: Performance measurements discarded", correlationId);
            this.eventsByCorrelationId.delete(correlationId);
        }
    }

    addPerformanceCallback(callback: PerformanceCallbackFunction): string {
        const callbackId = this.guidGenerator.generateGuid();
        this.callbacks.set(callbackId, callback);
        this.logger.verbose(`PerformanceManager: Performance callback registered with id: ${callbackId}`);

        return callbackId;
    }

    removePerformanceCallback(callbackId: string): boolean {
        const result = this.callbacks.delete(callbackId);

        if (result) {
            this.logger.verbose(`PerformanceManager: Performance callback ${callbackId} removed.`);
        } else {
            this.logger.verbose(`PerformanceManager: Performance callback ${callbackId} not removed.`);
        }
        
        return result;
    }

    emitEvents(events: PerformanceEvent[], correlationId?: string): void {
        this.logger.verbose("PerformanceManager: Emitting performance events", correlationId);

        this.callbacks.forEach((callback: PerformanceCallbackFunction, callbackId: string) => {
            this.logger.verbose(`PerformanceManager: Emitting event to callback ${callbackId}`, correlationId);
            callback.apply(null, [events]);
        });
    }
}

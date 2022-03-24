/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "../../logger/Logger";
import { IPerformanceClient, PerformanceCallbackFunction } from "./IPerformanceClient";
import { IPerformanceMeasurement } from "./IPerformanceMeasurement";
import { PerformanceEvent, PerformanceEvents, PerformanceEventStatus } from "./PerformanceEvent";

export abstract class PerformanceClient implements IPerformanceClient {
    protected authority: string;
    protected libraryName: string;
    protected libraryVersion: string;
    protected clientId: string;
    protected logger: Logger;
    protected callbacks: Map<string, PerformanceCallbackFunction>;
    
    /**
     * Multiple events with the same correlation id
     * @protected
     * @type {Map<string, PerformanceEvent[]>}
     */
    protected eventsByCorrelationId: Map<string, PerformanceEvent[]>;
    
    /**
     * Underlying performance measurements for each operation
     *
     * @protected
     * @type {Map<string, IPerformanceMeasurement>}
     */
    protected measurementsById: Map<string, IPerformanceMeasurement>;

    constructor(clientId: string, authority: string, logger: Logger, libraryName: string, libraryVersion: string) {
        this.authority = authority;
        this.libraryName = libraryName;
        this.libraryVersion = libraryVersion;
        this.clientId = clientId;
        this.logger = logger;
        this.callbacks = new Map();
        this.eventsByCorrelationId = new Map();
        this.measurementsById = new Map();
    }

    abstract startPerformanceMeasuremeant(measureName: string, correlationId: string): IPerformanceMeasurement;
    abstract generateId(): string;
    
    /**
     * Starts measuring performance for a given operation. Returns a function that should be used to end the measurement.
     *
     * @param {PerformanceEvents} measureName
     * @param {?string} [correlationId]
     * @returns {((event?: Partial<PerformanceEvent>) => PerformanceEvent | null)}
     */
    startMeasurement(measureName: PerformanceEvents, correlationId?: string): (event?: Partial<PerformanceEvent>) => PerformanceEvent | null {
        // Generate a placeholder correlation if the request does not provide one
        const eventCorrelationId = correlationId || this.generateId();
        if (!correlationId) {
            this.logger.info(`PerformanceClient: No correlation id provided for ${measureName}, generating`, eventCorrelationId);
        }

        this.logger.trace(`PerformanceManager: Performance measurement started for ${measureName}`, eventCorrelationId);
        const performanceMeasurement = this.startPerformanceMeasuremeant(measureName, eventCorrelationId);
        performanceMeasurement.startMeasurement();

        const inProgressEvent: PerformanceEvent = {
            eventId: this.generateId(),
            status: PerformanceEventStatus.InProgress,
            authority: this.authority,
            libraryName: this.libraryName,
            libraryVersion: this.libraryVersion,
            clientId: this.clientId,
            name: measureName,
            startTimeMs: Date.now(),
            correlationId: eventCorrelationId
        };

        // Store in progress events so they can be discarded if not ended properly
        this.cacheEventByCorrelationId(inProgressEvent);
        this.cacheMeasurement(inProgressEvent, performanceMeasurement);

        // Return a function the caller can use to properly end the measurement
        return (event?: Partial<PerformanceEvent>): PerformanceEvent | null => {
            const completedEvent = this.endMeasurement({
                // Initial set of event properties
                ...inProgressEvent,
                // Properties set when event ends
                ...event
            });

            if (completedEvent) {
                // Cache event so that submeasurements can be added downstream
                this.cacheEventByCorrelationId(completedEvent);
            }

            return completedEvent;
        };
    }
    
    /**
     * Stops measuring the performance for an operation. Should only be called directly by PerformanceClient classes,
     * as consumers should instead use the function returned by startMeasurement.
     *
     * @param {PerformanceEvent} event
     * @returns {(PerformanceEvent | null)}
     */
    endMeasurement(event: PerformanceEvent): PerformanceEvent | null {
        const performanceMeasurement = this.measurementsById.get(event.eventId);
        if (performanceMeasurement) {
            performanceMeasurement.endMeasurement();
            const durationMs = performanceMeasurement.flushMeasurement();
            // null indicates no measurement was taken (e.g. needed performance APIs not present)
            if (durationMs !== null) {
                this.logger.trace(`PerformanceManager: Performance measurement ended for ${event.name}: ${durationMs} ms`, event.correlationId);
    
                const completedEvent: PerformanceEvent = {
                    // Allow duration to be overwritten when event ends (e.g. testing), but not status
                    durationMs: Math.round(durationMs),
                    ...event,
                    status: PerformanceEventStatus.Completed,
                };
        
                return completedEvent;
            } else {
                this.logger.trace("PerformanceManager: Performance measurement not taken", event.correlationId);
            }

            this.measurementsById.delete(event.eventId);
        } else {
            this.logger.trace(`PerformanceManager: Measurement not found for ${event.eventId}`, event.correlationId);
        }

        return null;
    }

    private cacheEventByCorrelationId(event: PerformanceEvent) {
        const events = this.eventsByCorrelationId.get(event.correlationId);
        if (events) {
            this.logger.trace(`PerformanceManager: Performance measurement for ${event.name} added`, event.correlationId);
            events.push(event);
        } else {
            this.logger.trace(`PerformanceManager: Performance measurement for ${event.name} started`, event.correlationId);
            this.eventsByCorrelationId.set(event.correlationId, [event]);
        }
    }

    private cacheMeasurement(event: PerformanceEvent, measurement: IPerformanceMeasurement) {
        this.measurementsById.set(event.eventId, measurement);
    }
    
    /**
     * Gathers and emits performance events for measurements taked for the given top-level API and correlation ID.
     *
     * @param {PerformanceEvents} measureName
     * @param {string} correlationId
     */
    flushMeasurements(measureName: PerformanceEvents, correlationId: string): void {
        this.logger.trace(`PerformanceManager: Performance measurements flushed for ${measureName}`, correlationId);
        const eventsForCorrelationId = this.eventsByCorrelationId.get(correlationId);
        if (eventsForCorrelationId) {
            const completedTopLevelEvent = eventsForCorrelationId.find(event => event.name === measureName && event.status === PerformanceEventStatus.Completed);
            if (completedTopLevelEvent) {
                this.logger.verbose(`PerformanceManager: Measurement found for ${measureName}`, correlationId);

                // End incomplete submeasurements
                const incompleteSubMeasurements = eventsForCorrelationId.filter(event => event.name !== measureName && event.status !== PerformanceEventStatus.Completed);
                if (incompleteSubMeasurements.length > 0) {
                    this.logger.error(`PerformanceManager: Incomplete submeasurements found for ${measureName}`, correlationId);
                }
                /*
                 * Manually end incomplete submeasurements to ensure there arent orphaned/never ending events.
                 * Incomplete submeasurements are likely an instrumentation bug that should be fixed.
                 */
                incompleteSubMeasurements.forEach((event) => {
                    this.logger.trace(`PerformanceManager: Incomplete submeasurement found for ${event.name}`, correlationId);

                    // TODO: have these get emitted? or dropped
                    this.endMeasurement(event);
                });

                // Emit completed submeasurements
                const completedSubMeasurements = eventsForCorrelationId.filter(event => event.name !== measureName && event.status === PerformanceEventStatus.Completed);
                completedSubMeasurements.forEach(event => {
                    this.logger.trace(`PerformanceManager: Complete submeasurement found for ${event.name}`, correlationId);
                    // TODO: Emit additional properties for each subMeasurement
                    const subMeasurementName = `${event.name}DurationMs`;
                    /*
                     * Some code paths, such as resolving an authority, can occur multiple times.
                     * Only take the first measurement since the second is often read from the cache.
                     */
                    if (!completedTopLevelEvent[subMeasurementName]) {
                        completedTopLevelEvent[subMeasurementName] = event.durationMs;
                    }
                });

                this.emitEvents([completedTopLevelEvent], completedTopLevelEvent.correlationId);
            }

            // Remove events once they have been flushed
            this.discardMeasurements(correlationId);
        } else {
            this.logger.verbose("PerformanceManager: No measurements found", correlationId);
        }
    }
    
    /**
     * Removes measurements for a given correlation id.
     *
     * @param {string} correlationId
     */
    discardMeasurements(correlationId: string): void {
        this.logger.trace("PerformanceManager: Performance measurements discarded", correlationId);
        this.eventsByCorrelationId.delete(correlationId);
    }
    
    /**
     * Registers a callback function to receive performance events.
     *
     * @param {PerformanceCallbackFunction} callback
     * @returns {string}
     */
    addPerformanceCallback(callback: PerformanceCallbackFunction): string {
        const callbackId = this.generateId();
        this.callbacks.set(callbackId, callback);
        this.logger.verbose(`PerformanceManager: Performance callback registered with id: ${callbackId}`);

        return callbackId;
    }
    
    /**
     * Removes a callback registered with addPerformanceCallback.
     *
     * @param {string} callbackId
     * @returns {boolean}
     */
    removePerformanceCallback(callbackId: string): boolean {
        const result = this.callbacks.delete(callbackId);

        if (result) {
            this.logger.verbose(`PerformanceManager: Performance callback ${callbackId} removed.`);
        } else {
            this.logger.verbose(`PerformanceManager: Performance callback ${callbackId} not removed.`);
        }
        
        return result;
    }
    
    /**
     * Emits events to all registered callbacks.
     *
     * @param {PerformanceEvent[]} events
     * @param {?string} [correlationId]
     */
    emitEvents(events: PerformanceEvent[], correlationId: string): void {
        this.logger.verbose("PerformanceManager: Emitting performance events", correlationId);

        this.callbacks.forEach((callback: PerformanceCallbackFunction, callbackId: string) => {
            this.logger.trace(`PerformanceManager: Emitting event to callback ${callbackId}`, correlationId);
            callback.apply(null, [events]);
        });
    }
}

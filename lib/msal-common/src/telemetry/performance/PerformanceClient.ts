/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ApplicationTelemetry } from "../../config/ClientConfiguration";
import { Logger } from "../../logger/Logger";
import { InProgressPerformanceEvent, IPerformanceClient, PerformanceCallbackFunction } from "./IPerformanceClient";
import { IPerformanceMeasurement } from "./IPerformanceMeasurement";
import { PerformanceEvent, PerformanceEvents, PerformanceEventStatus, StaticFields } from "./PerformanceEvent";

export abstract class PerformanceClient implements IPerformanceClient {
    protected authority: string;
    protected libraryName: string;
    protected libraryVersion: string;
    protected applicationTelemetry: ApplicationTelemetry;
    protected clientId: string;
    protected logger: Logger;
    protected callbacks: Map<string, PerformanceCallbackFunction>;

    /**
     * Multiple events with the same correlation id.
     * Double keyed by correlation id and event id.
     * @protected
     * @type {Map<string, Map<string, PerformanceEvent>>}
     */
    protected eventsByCorrelationId: Map<string, Map<string, PerformanceEvent>>;

    /**
     * Fields to be emitted which are scoped to the top level request and whose value will not change in submeasurements
     * For example: App name, version, etc.
     */
    protected staticFieldsByCorrelationId: Map<string, StaticFields>;

    /**
     * Underlying performance measurements for each operation
     *
     * @protected
     * @type {Map<string, IPerformanceMeasurement>}
     */
    protected measurementsById: Map<string, IPerformanceMeasurement>;

    /**
     * Creates an instance of PerformanceClient, 
     * an abstract class containing core performance telemetry logic.
     *
     * @constructor
     * @param {string} clientId Client ID of the application
     * @param {string} authority Authority used by the application
     * @param {Logger} logger Logger used by the application
     * @param {string} libraryName Name of the library
     * @param {string} libraryVersion Version of the library
     */
    constructor(clientId: string, authority: string, logger: Logger, libraryName: string, libraryVersion: string, applicationTelemetry: ApplicationTelemetry) {
        this.authority = authority;
        this.libraryName = libraryName;
        this.libraryVersion = libraryVersion;
        this.applicationTelemetry = applicationTelemetry;
        this.clientId = clientId;
        this.logger = logger;
        this.callbacks = new Map();
        this.eventsByCorrelationId = new Map();
        this.staticFieldsByCorrelationId = new Map();
        this.measurementsById = new Map();
    }

    /**
     * Starts and returns an platform-specific implementation of IPerformanceMeasurement.
     *
     * @abstract
     * @param {string} measureName
     * @param {string} correlationId
     * @returns {IPerformanceMeasurement}
     */
    abstract startPerformanceMeasuremeant(measureName: string, correlationId: string): IPerformanceMeasurement;

    /**
     * Generates and returns a unique id, typically a guid.
     *
     * @abstract
     * @returns {string}
     */
    abstract generateId(): string;

    /**
     * Starts measuring performance for a given operation. Returns a function that should be used to end the measurement.
     *
     * @param {PerformanceEvents} measureName
     * @param {?string} [correlationId]
     * @returns {InProgressPerformanceEvent}
     */
    startMeasurement(measureName: PerformanceEvents, correlationId?: string): InProgressPerformanceEvent {
        // Generate a placeholder correlation if the request does not provide one
        const eventCorrelationId = correlationId || this.generateId();
        if (!correlationId) {
            this.logger.info(`PerformanceClient: No correlation id provided for ${measureName}, generating`, eventCorrelationId);
        }

        this.logger.trace(`PerformanceClient: Performance measurement started for ${measureName}`, eventCorrelationId);
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
            correlationId: eventCorrelationId,
        };

        // Store in progress events so they can be discarded if not ended properly
        this.cacheEventByCorrelationId(inProgressEvent);

        const staticFields: StaticFields = {
            appName: this.applicationTelemetry?.appName,
            appVersion: this.applicationTelemetry?.appVersion,
        };
        this.addStaticFields(staticFields, eventCorrelationId);
        this.cacheMeasurement(inProgressEvent, performanceMeasurement);

        // Return the event and functions the caller can use to properly end/flush the measurement
        return {
            endMeasurement: (event?: Partial<PerformanceEvent>): PerformanceEvent | null => {
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
            },
            flushMeasurement: () => {
                return this.flushMeasurements(inProgressEvent.name, inProgressEvent.correlationId);
            },
            discardMeasurement: () => {
                return this.discardMeasurements(inProgressEvent.correlationId);
            },
            addStaticFields: (fields: StaticFields) => {
                return this.addStaticFields(fields, inProgressEvent.correlationId);
            },
            measurement: performanceMeasurement,
            event: inProgressEvent
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
            // Immediately delete so that the same event isnt ended twice
            this.measurementsById.delete(event.eventId);
            performanceMeasurement.endMeasurement();
            const durationMs = performanceMeasurement.flushMeasurement();
            // null indicates no measurement was taken (e.g. needed performance APIs not present)
            if (durationMs !== null) {
                this.logger.trace(`PerformanceClient: Performance measurement ended for ${event.name}: ${durationMs} ms`, event.correlationId);

                const completedEvent: PerformanceEvent = {
                    // Allow duration to be overwritten when event ends (e.g. testing), but not status
                    durationMs: Math.round(durationMs),
                    ...event,
                    status: PerformanceEventStatus.Completed,
                };

                return completedEvent;
            } else {
                this.logger.trace("PerformanceClient: Performance measurement not taken", event.correlationId);
            }
        } else {
            this.logger.trace(`PerformanceClient: Measurement not found for ${event.eventId}`, event.correlationId);
        }

        return null;
    }

    /**
     * Saves extra information to be emitted when the measurements are flushed
     * @param fields 
     * @param correlationId 
     */
    addStaticFields(fields: StaticFields, correlationId: string) : void{
        const existingStaticFields = this.staticFieldsByCorrelationId.get(correlationId);
        if (existingStaticFields) {
            this.logger.trace("PerformanceClient: Updating static fields");
            this.staticFieldsByCorrelationId.set(correlationId, {...existingStaticFields, ...fields});
        } else {
            this.logger.trace("PerformanceClient: Adding static fields");
            this.staticFieldsByCorrelationId.set(correlationId, fields);
        }
    }

    /**
     * Upserts event into event cache.
     * First key is the correlation id, second key is the event id.
     * Allows for events to be grouped by correlation id,
     * and to easily allow for properties on them to be updated.
     *
     * @private
     * @param {PerformanceEvent} event
     */
    private cacheEventByCorrelationId(event: PerformanceEvent) {
        const existingEvents = this.eventsByCorrelationId.get(event.correlationId);
        if (existingEvents) {
            this.logger.trace(`PerformanceClient: Performance measurement for ${event.name} added/updated`, event.correlationId);
            existingEvents.set(event.eventId, event);
        } else {
            this.logger.trace(`PerformanceClient: Performance measurement for ${event.name} started`, event.correlationId);
            this.eventsByCorrelationId.set(event.correlationId, new Map().set(event.eventId, event));
        }
    }

    /**
     * Cache measurements by their id.
     *
     * @private
     * @param {PerformanceEvent} event
     * @param {IPerformanceMeasurement} measurement
     */
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
        this.logger.trace(`PerformanceClient: Performance measurements flushed for ${measureName}`, correlationId);
        const eventsForCorrelationId = this.eventsByCorrelationId.get(correlationId);
        if (eventsForCorrelationId) {
            this.discardMeasurements(correlationId);

            /*
             * Manually end incomplete submeasurements to ensure there arent orphaned/never ending events.
             * Incomplete submeasurements are likely an instrumentation bug that should be fixed.
             * IE only supports Map.forEach.
             */
            const completedEvents: PerformanceEvent[] = [];
            eventsForCorrelationId.forEach(event => {
                if (event.name !== measureName && event.status !== PerformanceEventStatus.Completed) {
                    this.logger.trace(`PerformanceClient: Incomplete submeasurement ${event.name} found for ${measureName}`, correlationId);

                    const completedEvent = this.endMeasurement(event);
                    if (completedEvent) {
                        completedEvents.push(completedEvent);
                    }
                }

                completedEvents.push(event);
            });

            // Sort events by start time (earliest first)
            const sortedCompletedEvents = completedEvents.sort((eventA, eventB) => eventA.startTimeMs - eventB.startTimeMs);

            // Take completed top level event and add completed submeasurements durations as properties
            const topLevelEvents = sortedCompletedEvents.filter(event => event.name === measureName && event.status === PerformanceEventStatus.Completed);
            if (topLevelEvents.length > 0) {
                /*
                 * Only take the first top-level event if there are multiple events with the same correlation id.
                 * This greatly simplifies logic for submeasurements.
                 */
                if (topLevelEvents.length > 1) {
                    this.logger.verbose("PerformanceClient: Multiple distinct top-level performance events found, using the first", correlationId);
                }
                const topLevelEvent = topLevelEvents[0];

                this.logger.verbose(`PerformanceClient: Measurement found for ${measureName}`, correlationId);

                // Build event object with top level and sub measurements
                const eventToEmit = sortedCompletedEvents.reduce((previous, current) => {
                    if (current.name !== measureName) {
                        this.logger.trace(`PerformanceClient: Complete submeasurement found for ${current.name}`, correlationId);
                        // TODO: Emit additional properties for each subMeasurement
                        const subMeasurementName = `${current.name}DurationMs`;
                        /*
                         * Some code paths, such as resolving an authority, can occur multiple times.
                         * Only take the first measurement, since the second could be read from the cache,
                         * or due to the same correlation id being used for two distinct requests.
                         */
                        if (!previous[subMeasurementName]) {
                            previous[subMeasurementName] = current.durationMs;
                        } else {
                            this.logger.verbose(`PerformanceClient: Submeasurement for ${measureName} already exists for ${current.name}, ignoring`, correlationId);
                        }
                    }

                    return previous;
                }, topLevelEvent);

                const staticFields = this.staticFieldsByCorrelationId.get(correlationId);
                const finalEvent: PerformanceEvent = {
                    ...eventToEmit,
                    ...staticFields
                };

                this.emitEvents([finalEvent], eventToEmit.correlationId);
            } else {
                this.logger.verbose(`PerformanceClient: No completed top-level measurements found for ${measureName}`, correlationId);
            }
        } else {
            this.logger.verbose("PerformanceClient: No measurements found", correlationId);
        }
    }

    /**
     * Removes measurements for a given correlation id.
     *
     * @param {string} correlationId
     */
    discardMeasurements(correlationId: string): void {
        this.logger.trace("PerformanceClient: Performance measurements discarded", correlationId);
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
        this.logger.verbose(`PerformanceClient: Performance callback registered with id: ${callbackId}`);

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
            this.logger.verbose(`PerformanceClient: Performance callback ${callbackId} removed.`);
        } else {
            this.logger.verbose(`PerformanceClient: Performance callback ${callbackId} not removed.`);
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
        this.logger.verbose("PerformanceClient: Emitting performance events", correlationId);

        this.callbacks.forEach((callback: PerformanceCallbackFunction, callbackId: string) => {
            this.logger.trace(`PerformanceClient: Emitting event to callback ${callbackId}`, correlationId);
            callback.apply(null, [events]);
        });
    }

}

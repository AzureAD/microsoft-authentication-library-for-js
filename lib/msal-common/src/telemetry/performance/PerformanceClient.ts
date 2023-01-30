/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ApplicationTelemetry } from "../../config/ClientConfiguration";
import { Logger } from "../../logger/Logger";
import { InProgressPerformanceEvent, IPerformanceClient, PerformanceCallbackFunction, QueueMeasurement } from "./IPerformanceClient";
import { IPerformanceMeasurement } from "./IPerformanceMeasurement";
import { Counters, PerformanceEvent, PerformanceEvents, PerformanceEventStatus, StaticFields } from "./PerformanceEvent";

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
     * Counters to be emitted which are scoped to the top level request and whose value may change in sub-measurements
     */
    protected countersByCorrelationId: Map<string, Counters>;

    /**
     * Underlying performance measurements for each operation
     *
     * @protected
     * @type {Map<string, IPerformanceMeasurement>}
     */
    protected measurementsById: Map<string, IPerformanceMeasurement>;

    /**
     * Map of pre-queue times by correlation Id
     *
     * @protected
     * @type {Map<string, Map<string, number>>}
     */
    protected preQueueTimeByCorrelationId: Map<string, Map<string, number>>;

    /**
     * Map of queue measurements by correlation Id
     *
     * @protected
     * @type {Map<string, Array<QueueMeasurement>>}
     */
    protected queueMeasurements: Map<string, Array<QueueMeasurement>>;

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
        this.queueMeasurements = new Map();
        this.preQueueTimeByCorrelationId = new Map();
        this.countersByCorrelationId = new Map();
    }

    /**
     * Generates and returns a unique id, typically a guid.
     *
     * @abstract
     * @returns {string}
     */
    abstract generateId(): string;

    /**
     * Starts and returns an platform-specific implementation of IPerformanceMeasurement.
     * Note: this function can be changed to abstract at the next major version bump.
     *
     * @param {string} measureName
     * @param {string} correlationId
     * @returns {IPerformanceMeasurement}
     */
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    startPerformanceMeasurement(measureName: string, correlationId: string): IPerformanceMeasurement {
        return {} as IPerformanceMeasurement;
    }

    /**
     * Starts and returns an platform-specific implementation of IPerformanceMeasurement.
     * Note: this incorrectly-named function will be removed at the next major version bump.
     *
     * @param {string} measureName
     * @param {string} correlationId
     * @returns {IPerformanceMeasurement}
     */
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    startPerformanceMeasuremeant(measureName: string, correlationId: string): IPerformanceMeasurement {
        return {} as IPerformanceMeasurement;
    }

    /**
     * Sets pre-queue time by correlation Id
     *
     * @abstract
     * @param {PerformanceEvents} eventName
     * @param {string} correlationId
     * @returns
     */
    abstract setPreQueueTime(eventName: PerformanceEvents, correlationId?: string): void;

    /**
     * Gets map of pre-queue times by correlation Id
     *
     * @param {PerformanceEvents} eventName
     * @param {string} correlationId
     * @returns {number}
     */
    getPreQueueTime(eventName: PerformanceEvents, correlationId: string): number | void {
        const preQueueTimesByEvents = this.preQueueTimeByCorrelationId.get(correlationId);

        if (!preQueueTimesByEvents) {
            this.logger.trace(`PerformanceClient.getPreQueueTime: no pre-queue times found for correlationId: ${correlationId}, unable to add queue measurement`);
            return;
        } else if (!preQueueTimesByEvents.get(eventName)) {
            this.logger.trace(`PerformanceClient.getPreQueueTime: no pre-queue time found for ${eventName}, unable to add queue measurement`);
            return;
        }

        return preQueueTimesByEvents.get(eventName);
    }

    /**
     * Calculates the difference between current time and time when function was queued.
     * Note: It is possible to have 0 as the queue time if the current time and the queued time was the same.
     *
     * @param {number} preQueueTime
     * @param {number} currentTime
     * @returns {number}
     */
    calculateQueuedTime(preQueueTime: number, currentTime: number): number {
        if (preQueueTime < 1) {
            this.logger.trace(`PerformanceClient: preQueueTime should be a positive integer and not ${preQueueTime}`);
            return 0;
        }

        if (currentTime < 1) {
            this.logger.trace(`PerformanceClient: currentTime should be a positive integer and not ${currentTime}`);
            return 0;
        }

        if (currentTime < preQueueTime) {
            this.logger.trace("PerformanceClient: currentTime is less than preQueueTime, check how time is being retrieved");
            return 0;
        }

        return currentTime-preQueueTime;
    }

    /**
     * Adds queue measurement time to QueueMeasurements array for given correlation ID.
     *
     * @param {PerformanceEvents} name
     * @param {?string} correlationId
     * @param {?number} time
     * @returns
     */
    addQueueMeasurement(eventName: PerformanceEvents, correlationId?: string, queueTime?: number): void {
        if (!correlationId) {
            this.logger.trace(`PerformanceClient.addQueueMeasurement: correlationId not provided for ${eventName}, cannot add queue measurement`);
            return;
        }

        if (queueTime === 0) {
            // Possible for there to be no queue time after calculation
            this.logger.trace(`PerformanceClient.addQueueMeasurement: queue time provided for ${eventName} is ${queueTime}`);
        } else if (!queueTime) {
            this.logger.trace(`PerformanceClient.addQueueMeasurement: no queue time provided for ${eventName}`);
            return;
        }

        const queueMeasurement = {eventName, queueTime} as QueueMeasurement;

        // Adds to existing correlation Id if present in queueMeasurements
        const existingMeasurements = this.queueMeasurements.get(correlationId);
        if (existingMeasurements) {
            existingMeasurements.push(queueMeasurement);
            this.queueMeasurements.set(correlationId, existingMeasurements);
        } else {
            // Sets new correlation Id if not present in queueMeasurements
            this.logger.trace(`PerformanceClient.addQueueMeasurement: adding correlationId ${correlationId} to queue measurements`);
            const measurementArray = [queueMeasurement];
            this.queueMeasurements.set(correlationId, measurementArray);
        }
    }

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

        // Duplicate code to address spelling error will be removed at the next major version bump.
        this.logger.trace(`PerformanceClient: Performance measurement started for ${measureName}`, eventCorrelationId);
        let validMeasurement: IPerformanceMeasurement;
        const performanceMeasuremeant = this.startPerformanceMeasuremeant(measureName, eventCorrelationId);
        if (performanceMeasuremeant.startMeasurement) {
            performanceMeasuremeant.startMeasurement();
            validMeasurement = performanceMeasuremeant;
        } else {
            const performanceMeasurement = this.startPerformanceMeasurement(measureName, eventCorrelationId);
            performanceMeasurement.startMeasurement();
            validMeasurement = performanceMeasurement;
        }

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
        this.cacheMeasurement(inProgressEvent, validMeasurement);

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
            increment: (counters: Counters) => {
                return this.increment(counters, inProgressEvent.correlationId);
            },
            measurement: validMeasurement,
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
     * Increment counters to be emitted when the measurements are flushed
     * @param counters {Counters}
     * @param correlationId {string} correlation identifier
     */
    increment(counters: Counters, correlationId: string): void {
        const existing: Counters | undefined = this.countersByCorrelationId.get(correlationId);
        if (!existing) {
            this.logger.trace("PerformanceClient: Setting counters");
            this.countersByCorrelationId.set(correlationId, { ...counters });
            return;
        }

        this.logger.trace("PerformanceClient: Updating counters");
        for (const counter in counters) {
            if (!existing.hasOwnProperty(counter)) {
                existing[counter] = 0;
            }
            existing[counter] += counters[counter];
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

        /**
         * Adds all queue time and count measurements for given correlation ID
         * then deletes queue times for given correlation ID from queueMeasurements map.
         */

        const queueMeasurementForCorrelationId = this.queueMeasurements.get(correlationId);
        if (!queueMeasurementForCorrelationId) {
            this.logger.trace(`PerformanceClient: no queue measurements found for for correlationId: ${correlationId}`);
        }

        let totalQueueTime = 0;
        let totalQueueCount = 0;
        queueMeasurementForCorrelationId?.forEach((measurement) => {
            totalQueueTime += measurement.queueTime;
            totalQueueCount++;
        });

        this.queueMeasurements.delete(correlationId);

        const eventsForCorrelationId = this.eventsByCorrelationId.get(correlationId);
        const staticFields = this.staticFieldsByCorrelationId.get(correlationId);
        const counters = this.countersByCorrelationId.get(correlationId);

        if (eventsForCorrelationId) {
            this.discardCache(correlationId);

            /*
             * Manually end incomplete submeasurements to ensure there arent orphaned/never ending events.
             * Incomplete submeasurements are likely an instrumentation bug that should be fixed.
             * IE only supports Map.forEach.
             */
            const completedEvents: PerformanceEvent[] = [];
            let incompleteSubsCount: number = 0;

            eventsForCorrelationId.forEach(event => {
                if (event.name !== measureName && event.status !== PerformanceEventStatus.Completed) {
                    this.logger.trace(`PerformanceClient: Incomplete submeasurement ${event.name} found for ${measureName}`, correlationId);
                    incompleteSubsCount++;

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

                const finalEvent: PerformanceEvent = {
                    ...eventToEmit,
                    ...staticFields,
                    ...counters,
                    queuedTimeMs: totalQueueTime,
                    queuedCount: totalQueueCount,
                    incompleteSubsCount
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
     * Removes cache for a given correlation id.
     *
     * @param {string} correlation identifier
     */
    private discardCache(correlationId: string): void {
        this.discardMeasurements(correlationId);

        this.logger.trace("PerformanceClient: Static fields discarded", correlationId);
        this.staticFieldsByCorrelationId.delete(correlationId);

        this.logger.trace("PerformanceClient: Counters discarded", correlationId);
        this.countersByCorrelationId.delete(correlationId);
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

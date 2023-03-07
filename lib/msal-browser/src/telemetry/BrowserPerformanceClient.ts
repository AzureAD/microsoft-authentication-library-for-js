/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Logger,
    PerformanceEvent,
    PerformanceEvents,
    IPerformanceClient,
    PerformanceClient,
    IPerformanceMeasurement,
    InProgressPerformanceEvent,
    ApplicationTelemetry,
    SubMeasurement,
    PreQueueEvent
} from "@azure/msal-common";
import { CryptoOptions } from "../config/Configuration";
import { BrowserCrypto } from "../crypto/BrowserCrypto";
import { GuidGenerator } from "../crypto/GuidGenerator";
import { BrowserPerformanceMeasurement } from "./BrowserPerformanceMeasurement";

export class BrowserPerformanceClient extends PerformanceClient implements IPerformanceClient {
    private browserCrypto: BrowserCrypto;
    private guidGenerator: GuidGenerator;

    constructor(clientId: string, authority: string, logger: Logger, libraryName: string, libraryVersion: string, applicationTelemetry: ApplicationTelemetry, cryptoOptions: CryptoOptions) {
        super(clientId, authority, logger, libraryName, libraryVersion, applicationTelemetry);
        this.browserCrypto = new BrowserCrypto(this.logger, cryptoOptions);
        this.guidGenerator = new GuidGenerator(this.browserCrypto);
    }

    startPerformanceMeasuremeant(measureName: string, correlationId: string): IPerformanceMeasurement {
        return new BrowserPerformanceMeasurement(measureName, correlationId);
    }

    generateId() : string {
        return this.guidGenerator.generateGuid();
    }

    private getPageVisibility(): string | null {
        return document.visibilityState?.toString() || null;
    }

    private deleteIncompleteSubMeasurements(inProgressEvent: InProgressPerformanceEvent): void {
        const rootEvent = this.eventsByCorrelationId.get(inProgressEvent.event.correlationId);
        const isRootEvent = rootEvent && rootEvent.eventId === inProgressEvent.event.eventId;
        const incompleteMeasurements: SubMeasurement[] = [];
        if (isRootEvent && rootEvent?.incompleteSubMeasurements) {
            rootEvent.incompleteSubMeasurements.forEach((subMeasurement) => {
                incompleteMeasurements.push({...subMeasurement});
            });
        }
        // Clean up remaining marks for incomplete sub-measurements
        if (incompleteMeasurements.length > 0) {
            BrowserPerformanceMeasurement.flushMeasurements(inProgressEvent.event.correlationId, incompleteMeasurements);
        }
    }

    supportsBrowserPerformanceNow(): boolean {
        return typeof window !== "undefined" &&
            typeof window.performance !== "undefined" &&
            typeof window.performance.now === "function";
    }

    /**
     * Starts measuring performance for a given operation. Returns a function that should be used to end the measurement.
     * Also captures browser page visibilityState.
     *
     * @param {PerformanceEvents} measureName
     * @param {?string} [correlationId]
     * @returns {((event?: Partial<PerformanceEvent>) => PerformanceEvent| null)}
     */
    startMeasurement(measureName: PerformanceEvents, correlationId?: string): InProgressPerformanceEvent {
        // Capture page visibilityState and then invoke start/end measurement
        const startPageVisibility = this.getPageVisibility();

        const inProgressEvent = super.startMeasurement(measureName, correlationId);

        return {
            ...inProgressEvent,
            endMeasurement: (event?: Partial<PerformanceEvent>): PerformanceEvent | null => {
                const res = inProgressEvent.endMeasurement({
                    startPageVisibility,
                    endPageVisibility: this.getPageVisibility(),
                    ...event
                });
                this.deleteIncompleteSubMeasurements(inProgressEvent);

                return res;
            },
            discardMeasurement: () => {
                inProgressEvent.discardMeasurement();
                this.deleteIncompleteSubMeasurements(inProgressEvent);
                inProgressEvent.measurement.flushMeasurement();
            }
        };
    }

    /**
     * Adds pre-queue time to preQueueTimeByCorrelationId map.
     * @param {PerformanceEvents} eventName
     * @param {?string} correlationId
     * @returns
     */
    setPreQueueTime(eventName: PerformanceEvents, correlationId?: string): void {
        if (!this.supportsBrowserPerformanceNow()) {
            this.logger.trace(`BrowserPerformanceClient: window performance API not available, unable to set telemetry queue time for ${eventName}`);
            return;
        }

        if (!correlationId) {
            this.logger.trace(`BrowserPerformanceClient: correlationId for ${eventName} not provided, unable to set telemetry queue time`);
            return;
        }

        const preQueueEvent: PreQueueEvent | undefined = this.preQueueTimeByCorrelationId.get(correlationId);
        /**
         * Manually complete queue measurement if there is an incomplete pre-queue event.
         * Incomplete pre-queue events are instrumentation bugs that should be fixed.
         */
        if (preQueueEvent) {
            this.logger.trace(`BrowserPerformanceClient: Incomplete pre-queue ${preQueueEvent.name} found`, correlationId);
            this.addQueueMeasurement(preQueueEvent.name, correlationId, undefined, true);
        }
        this.preQueueTimeByCorrelationId.set(eventName, { name: eventName, time: window.performance.now() });
    }

    /**
     * Calculates and adds queue time measurement for given performance event.
     *
     * @param {PerformanceEvents} eventName
     * @param {?string} correlationId
     * @param {?number} queueTime
     * @param {?boolean} manuallyCompleted - indicator for manually completed queue measurements
     * @returns
     */
    addQueueMeasurement(eventName: PerformanceEvents, correlationId?: string, queueTime?: number, manuallyCompleted?: boolean): void {
        if (!this.supportsBrowserPerformanceNow()) {
            this.logger.trace(`BrowserPerformanceClient: window performance API not available, unable to add queue measurement for ${eventName}`);
            return;
        }

        if (!correlationId) {
            this.logger.trace(`BrowserPerformanceClient: correlationId for ${eventName} not provided, unable to add queue measurement`);
            return;
        }

        const preQueueTime = super.getPreQueueTime(eventName, correlationId);
        if (!preQueueTime) {
            return;
        }

        const currentTime = window.performance.now();
        const resQueueTime = queueTime || super.calculateQueuedTime(preQueueTime, currentTime);

        return super.addQueueMeasurement(eventName, correlationId, resQueueTime, manuallyCompleted);
    }
}

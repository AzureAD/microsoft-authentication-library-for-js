/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Counters, PerformanceEvent, PerformanceEvents, StaticFields } from "./PerformanceEvent";
import { IPerformanceMeasurement } from "./IPerformanceMeasurement";

export type PerformanceCallbackFunction = (events: PerformanceEvent[]) => void;

export type InProgressPerformanceEvent = {
    endMeasurement: (event?: Partial<PerformanceEvent>) => PerformanceEvent | null,
    discardMeasurement: () => void,
    addStaticFields: (staticFields: StaticFields) => void,
    increment: (counters: Counters) => void,
    event: PerformanceEvent,
    measurement: IPerformanceMeasurement
};

export interface IPerformanceClient {
    startMeasurement(measureName: PerformanceEvents, correlationId?: string): InProgressPerformanceEvent;
    endMeasurement(event: PerformanceEvent): PerformanceEvent | null;
    discardMeasurements(correlationId: string): void;
    addStaticFields(staticFields: StaticFields, correlationId: string): void;
    removePerformanceCallback(callbackId: string): boolean;
    addPerformanceCallback(callback: PerformanceCallbackFunction): string;
    emitEvents(events: PerformanceEvent[], correlationId: string): void;
    startPerformanceMeasuremeant(measureName: string, correlationId: string): IPerformanceMeasurement;
    startPerformanceMeasurement(measureName: string, correlationId: string): IPerformanceMeasurement;
    generateId(): string;
    calculateQueuedTime(preQueueTime: number, currentTime: number): number;
    addQueueMeasurement(eventName: PerformanceEvents, correlationId?: string, queueTime?: number, manuallyCompleted?: boolean): void;
    setPreQueueTime(eventName: PerformanceEvents, correlationId?: string): void;
}

/**
 * Queue measurement type
 */
export type QueueMeasurement = {
    /**
     * Name of performance event
     */
    eventName: PerformanceEvents,

    /**
     * Time spent in JS queue
     */
    queueTime: number,

    /**
     * Incomplete pre-queue events are instrumentation bugs that should be fixed.
     */
    manuallyCompleted?: boolean;
};

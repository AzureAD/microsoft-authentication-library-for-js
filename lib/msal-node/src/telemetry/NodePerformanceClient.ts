/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger, PerformanceEvent, PerformanceEvents, IPerformanceClient, PerformanceClient, IPerformanceMeasurement, InProgressPerformanceEvent, ApplicationTelemetry } from "@azure/msal-common";
import { GuidGenerator } from "../crypto/GuidGenerator";
import { NodePerformanceMeasurement } from "./NodePerformanceMeasurement";

export class NodePerformanceClient extends PerformanceClient implements IPerformanceClient {
    private guidGenerator: GuidGenerator;
    
    constructor(clientId: string, authority: string, logger: Logger, libraryName: string, libraryVersion: string, applicationTelemetry: ApplicationTelemetry) {
        super(clientId, authority, logger, libraryName, libraryVersion, applicationTelemetry);
                this.guidGenerator = new GuidGenerator();
    }
    
    startPerformanceMeasuremeant(measureName: string, correlationId: string): IPerformanceMeasurement {
        return new NodePerformanceMeasurement(measureName, correlationId);
    }

    generateId() : string {
        return this.guidGenerator.generateGuid();
    }

    
    /**
     * Starts measuring performance for a given operation. Returns a function that should be used to end the measurement.
     *
     * @param {PerformanceEvents} measureName
     * @param {?string} [correlationId]
     * @returns {((event?: Partial<PerformanceEvent>) => PerformanceEvent| null)}
     */
    startMeasurement(measureName: PerformanceEvents, correlationId?: string): InProgressPerformanceEvent {
        // Capture page visibilityState and then invoke start/end measurement
        
        const inProgressEvent = super.startMeasurement(measureName, correlationId);

        return {
            ...inProgressEvent,
            endMeasurement: (event?: Partial<PerformanceEvent>): PerformanceEvent | null => {
                return inProgressEvent.endMeasurement({
                    ...event
                });
            }
        };
    }
}

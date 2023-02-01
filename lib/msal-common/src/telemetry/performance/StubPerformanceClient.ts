/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IPerformanceClient } from "./IPerformanceClient";
import { IPerformanceMeasurement } from "./IPerformanceMeasurement";
import { PerformanceClient } from "./PerformanceClient";
import { PerformanceEvents } from "./PerformanceEvent";

export class StubPerformanceMeasurement implements IPerformanceMeasurement {
    /* eslint-disable-next-line @typescript-eslint/no-empty-function */
    startMeasurement(): void { }
    /* eslint-disable-next-line @typescript-eslint/no-empty-function */
    endMeasurement(): void { }
    flushMeasurement(): number | null {
        return null;
    }
    
}

export class StubPerformanceClient extends PerformanceClient implements IPerformanceClient {
    generateId(): string {
        return "callback-id";
    }
    
    startPerformanceMeasuremeant(): IPerformanceMeasurement {
        return new StubPerformanceMeasurement();
    }

    startPerformanceMeasurement(): IPerformanceMeasurement {
        return new StubPerformanceMeasurement();
    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    calculateQueuedTime(preQueueTime: number, currentTime: number): number {
        return 0;
    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    addQueueMeasurement(eventName: PerformanceEvents, correlationId: string, queueTime: number): void {
        return;
    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    setPreQueueTime(eventName: PerformanceEvents, correlationId?: string | undefined): void {
        return;
    }

}

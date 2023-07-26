/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IPerformanceClient } from "./IPerformanceClient";
import { IPerformanceMeasurement } from "./IPerformanceMeasurement";
import { PerformanceClient } from "./PerformanceClient";

export class StubPerformanceMeasurement implements IPerformanceMeasurement {
    startMeasurement(): void {
        return;
    }
    endMeasurement(): void {
        return;
    }
    flushMeasurement(): number | null {
        return null;
    }
}

export class StubPerformanceClient
    extends PerformanceClient
    implements IPerformanceClient
{
    generateId(): string {
        return "callback-id";
    }

    startPerformanceMeasurement(): IPerformanceMeasurement {
        return new StubPerformanceMeasurement();
    }

    calculateQueuedTime(): number {
        return 0;
    }

    addQueueMeasurement(): void {
        return;
    }

    setPreQueueTime(): void {
        return;
    }
}

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @deprecated This class will be removed in a future major version
 */
export interface IPerformanceMeasurement {
    startMeasurement(): void;
    endMeasurement(): void;
    flushMeasurement(): number | null;
}

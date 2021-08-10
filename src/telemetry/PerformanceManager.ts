/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-common";
import { PerformanceMeasurement } from "./PerformanceMeasurement";

export class PerformanceManager {
    private logger: Logger;
    
    constructor(logger: Logger) {
        this.logger = logger;
    }

    startMeasurement(measureName: string): Function {
        this.logger.trace(`Performance measurement started for ${measureName}`);
        const performanceMeasure = new PerformanceMeasurement(measureName);
        performanceMeasure.startMeasurement();

        return () => {
            performanceMeasure.endMeasurement();
            const duration = Math.round(performanceMeasure.flushMeasurement());
            this.logger.trace(`Performance measurement ended for ${measureName}: ${duration} ms`);
            return duration;
        };
    }
}

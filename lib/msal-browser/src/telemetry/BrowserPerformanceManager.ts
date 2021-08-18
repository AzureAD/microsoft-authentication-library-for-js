/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-common";
import { PerformanceMeasurement } from "./PerformanceMeasurement";

export class BrowserPerformanceManager {
    private logger: Logger;
    
    constructor(logger: Logger) {
        this.logger = logger;
    }

    startMeasurement(measureName: string): Function {
        this.logger.verbose(`Performance measurement started for ${measureName}`);
        const performanceMeasure = new PerformanceMeasurement(measureName);
        performanceMeasure.start();

        return () => {
            performanceMeasure.end();
            const duration = Math.round(performanceMeasure.flush());
            this.logger.verbose(`Performance measurement ended for ${measureName}: ${duration} ms`);
            return duration;
        };
    }
}

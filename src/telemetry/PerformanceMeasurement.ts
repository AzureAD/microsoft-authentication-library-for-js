/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PerformanceEvents } from "./PerformanceManager";

export class PerformanceMeasurement {
    private measureName: string;
    private correlationId: string;
    private startMark: string;
    private endMark: string;

    constructor(name: PerformanceEvents, correlationId?: string) {
        this.correlationId = correlationId || "";
        this.measureName = `msal.measure.${name}.${this.correlationId}`;
        this.startMark = `msal.start.${name}.${this.correlationId}`;
        this.endMark = `msal.end.${name}.${this.correlationId}`;
    }

    static supportsBrowserPerformance(): boolean {
        return typeof window !== "undefined" &&
            "performance" in window &&
            !!window.performance.mark && 
            !!window.performance.measure;
    }

    startMeasurement(): void {
        if (PerformanceMeasurement.supportsBrowserPerformance()) {
            window.performance.mark(this.startMark);
        }
    }

    endMeasurement():void {
        if (PerformanceMeasurement.supportsBrowserPerformance()) {
            window.performance.mark(this.endMark);
            window.performance.measure(this.measureName, this.startMark, this.endMark);
        }
    }

    flushMeasurement(): number {
        if (PerformanceMeasurement.supportsBrowserPerformance()) {
            const durationMs = window.performance.getEntriesByName(this.measureName, "measure")[0].duration;
            window.performance.clearMeasures(this.measureName);
            window.performance.clearMarks(this.startMark);
            window.performance.clearMarks(this.endMark);
            return durationMs;
        }
        return 0;
    }
}

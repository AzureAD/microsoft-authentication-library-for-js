/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export class PerformanceMeasurement {
    private measureName: string;
    private startMark: string;
    private endMark: string;

    constructor(measureName: string) {
        this.measureName = `msal.measure.${measureName}`;
        this.startMark = `msal.start.${measureName}`;
        this.endMark = `msal.end.${measureName}`;
    }

    static supportsBrowserPerformance(): boolean {
        return typeof window !== "undefined" &&
            "performance" in window &&
            !!window.performance.mark && 
            !!window.performance.measure;
    }

    start(): void {
        if (PerformanceMeasurement.supportsBrowserPerformance()) {
            window.performance.mark(this.startMark);
        }
    }

    end():void {
        if (PerformanceMeasurement.supportsBrowserPerformance()) {
            window.performance.mark(this.endMark);
            window.performance.measure(this.measureName, this.startMark, this.endMark);
        }
    }

    flush(): number {
        if (PerformanceMeasurement.supportsBrowserPerformance()) {
            const duration = window.performance.getEntriesByName(this.measureName, "measure")[0].duration;
            window.performance.clearMeasures(this.measureName);
            window.performance.clearMarks(this.startMark);
            window.performance.clearMarks(this.endMark);
            return duration;
        }
        return 0;
    }
}

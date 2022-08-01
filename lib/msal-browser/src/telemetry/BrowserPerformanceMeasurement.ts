/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IPerformanceMeasurement } from "@azure/msal-common";

export class BrowserPerformanceMeasurement implements IPerformanceMeasurement {
    private measureName: string;
    private correlationId: string;
    private startMark: string;
    private endMark: string;

    constructor(name: string, correlationId: string) {
        this.correlationId = correlationId;
        this.measureName = `msal.measure.${name}.${this.correlationId}`;
        this.startMark = `msal.start.${name}.${this.correlationId}`;
        this.endMark = `msal.end.${name}.${this.correlationId}`;
    }

    static supportsBrowserPerformance(): boolean {
        return typeof window !== "undefined" &&
            typeof window.performance !== "undefined" &&
            typeof window.performance.mark === "function" && 
            typeof window.performance.measure === "function" &&
            typeof window.performance.clearMarks === "function" &&
            typeof window.performance.clearMeasures === "function" &&
            typeof window.performance.getEntriesByName === "function";
    }

    startMeasurement(): void {
        if (BrowserPerformanceMeasurement.supportsBrowserPerformance()) {
            try {
                window.performance.mark(this.startMark);
            } catch (e) {
                // Silently catch
            }
        }
    }

    endMeasurement():void {
        if (BrowserPerformanceMeasurement.supportsBrowserPerformance()) {
            try {
                window.performance.mark(this.endMark);
                window.performance.measure(this.measureName, this.startMark, this.endMark);
            } catch (e) {
                // Silently catch
            }
        }
    }

    flushMeasurement(): number | null {
        if (BrowserPerformanceMeasurement.supportsBrowserPerformance()) {
            try {
                const entriesForMeasurement = window.performance.getEntriesByName(this.measureName, "measure");
                if (entriesForMeasurement.length > 0) {
                    const durationMs = entriesForMeasurement[0].duration;
                    window.performance.clearMeasures(this.measureName);
                    window.performance.clearMarks(this.startMark);
                    window.performance.clearMarks(this.endMark);
                    return durationMs;
                }
            } catch (e) {
                // Silently catch and return null
            }
        }
        return null;
    }
}

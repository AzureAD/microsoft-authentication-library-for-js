/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IPerformanceMeasurement } from "@azure/msal-common";
import { BrowserUtils } from "../utils/BrowserUtils";

export class BrowserPerformanceMeasurement implements IPerformanceMeasurement {
    private measureName: string;
    private correlationId: string;
    private startMark: string;
    private endMark: string;
    private window: Window | null;

    constructor(name: string, correlationId: string) {
        this.correlationId = correlationId;
        this.measureName = `msal.measure.${name}.${this.correlationId}`;
        this.startMark = `msal.start.${name}.${this.correlationId}`;
        this.endMark = `msal.end.${name}.${this.correlationId}`;

        /*
         * Use window.performance if available (for browser windows),
         * otherwise self.performance (for service workers)
         */
        this.window = BrowserUtils.getWindowObject();
    }

    supportsBrowserPerformance(): boolean {
        return !!this.window &&
            typeof this.window.performance !== "undefined" &&
            typeof this.window.performance.mark === "function" && 
            typeof this.window.performance.measure === "function" &&
            typeof this.window.performance.clearMarks === "function" &&
            typeof this.window.performance.clearMeasures === "function" &&
            typeof this.window.performance.getEntriesByName === "function";
    }

    startMeasurement(): void {
        if (this.supportsBrowserPerformance()) {
            try {
                this.window?.performance.mark(this.startMark);
            } catch (e) {
                // Silently catch
            }
        }
    }

    endMeasurement():void {
        if (this.supportsBrowserPerformance()) {
            try {
                this.window?.performance.mark(this.endMark);
                this.window?.performance.measure(this.measureName, this.startMark, this.endMark);
            } catch (e) {
                // Silently catch
            }
        }
    }

    flushMeasurement(): number | null {
        if (this.supportsBrowserPerformance()) {
            try {
                const entriesForMeasurement = window.performance.getEntriesByName(this.measureName, "measure");
                if (entriesForMeasurement.length > 0) {
                    const durationMs = entriesForMeasurement[0].duration;
                    this.window?.performance.clearMeasures(this.measureName);
                    this.window?.performance.clearMarks(this.startMark);
                    this.window?.performance.clearMarks(this.endMark);
                    return durationMs;
                }
            } catch (e) {
                // Silently catch and return null
            }
        }
        return null;
    }
}

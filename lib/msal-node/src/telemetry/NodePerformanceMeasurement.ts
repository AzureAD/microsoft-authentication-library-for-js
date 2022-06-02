/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IPerformanceMeasurement } from "@azure/msal-common";
import { performance, PerformanceObserver } from "perf_hooks";

export class NodePerformanceMeasurement implements IPerformanceMeasurement {
    private measureName: string;
    private correlationId: string;
    private startMark: string;
    private endMark: string;
    private perfObserver: PerformanceObserver;


    constructor(name: string, correlationId: string) {
        this.correlationId = correlationId;
        this.measureName = `msal.measure.${name}.${this.correlationId}`;
        this.startMark = `msal.start.${name}.${this.correlationId}`;
        this.endMark = `msal.end.${name}.${this.correlationId}`;
        this.perfObserver = new PerformanceObserver((items) => {
            items.getEntries().forEach((entry) => {
                console.log(entry);
            })
          })
        this.perfObserver.observe({ entryTypes: ["measure"], buffered: true })

    }

    
    startMeasurement(): void {   
        try {
            performance.mark(this.startMark);
        } catch (e) {
            // Silently catch
        }
        
    }

    endMeasurement():void {        
        try {
            performance.mark(this.endMark);
            performance.measure(this.measureName, this.startMark, this.endMark);
        } catch (e) {
            // Silently catch
        }
        
    }

    flushMeasurement(): number | null {        
        try {
            const entriesForMeasurement = window.performance.getEntriesByName(this.measureName, "measure");
            if (entriesForMeasurement.length > 0) {
                const durationMs = entriesForMeasurement[0].duration;
                performance.clearMarks(this.startMark);
                performance.clearMarks(this.endMark);
                return durationMs;
            }
        } catch (e) {
            // Silently catch and return null
        }
    
    return null;
    }
}

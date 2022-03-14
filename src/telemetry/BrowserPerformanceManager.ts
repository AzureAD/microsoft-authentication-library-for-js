/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger, PerformanceCallbackFunction, PerformanceEvent, PerformanceEvents, IPerformanceManager, IGuidGenerator, PerformanceManager, IPerformanceMeasurement } from "@azure/msal-common";
import { BrowserCrypto } from "../crypto/BrowserCrypto";
import { GuidGenerator } from "../crypto/GuidGenerator";
import { BrowserPerformanceMeasurement } from "./BrowserPerformanceMeasurement";

export class BrowserPerformanceManager extends PerformanceManager implements IPerformanceManager {
    private browserCrypto: BrowserCrypto;
    
    constructor(clientId: string, authority: string, logger: Logger, libraryName: string, libraryVersion: string) {
        super(clientId, authority, logger, libraryName, libraryVersion);
        this.browserCrypto = new BrowserCrypto(this.logger);
        this.guidGenerator = new GuidGenerator(this.browserCrypto);
    }
    
    startPerformanceMeasuremeant(measureName: string, correlationId?: string): IPerformanceMeasurement {
        return new BrowserPerformanceMeasurement(measureName, correlationId);
    }

    private getPageVisibility(): string | null {
        return document.visibilityState?.toString() || null;
    }

    startMeasurement(measureName: PerformanceEvents, correlationId?: string): (event?: Partial<PerformanceEvent>) => PerformanceEvent {
        // Capture page visibilityState and then invoke start/end measurement
        const startPageVisibility = this.getPageVisibility();
        
        const endMeasurement = super.startMeasurement(measureName, correlationId);

        return (event?: Partial<PerformanceEvent>) => {
            return endMeasurement({
                startPageVisibility,
                endPageVisibility: this.getPageVisibility(),
                ...event
            });
        };
    }

    addPerformanceCallback(callback: PerformanceCallbackFunction): string | null {
        if (typeof window !== "undefined") {
            super.addPerformanceCallback(callback);
        }

        return null;
    }

    emitEvents(events: PerformanceEvent[], correlationId?: string): void {
        if (typeof window !== "undefined") {
            super.emitEvents(events);
        }
    }
}

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger, PerformanceCallbackFunction, PerformanceEvent, PerformanceEvents, IPerformanceClient, PerformanceClient, IPerformanceMeasurement } from "@azure/msal-common";
import { BrowserCrypto } from "../crypto/BrowserCrypto";
import { GuidGenerator } from "../crypto/GuidGenerator";
import { BrowserPerformanceMeasurement } from "./BrowserPerformanceMeasurement";

export class BrowserPerformanceClient extends PerformanceClient implements IPerformanceClient {
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

    addPerformanceCallback(callback: PerformanceCallbackFunction): string {
        if (typeof window !== "undefined") {
            return super.addPerformanceCallback(callback);
        }

        return "";
    }

    emitEvents(events: PerformanceEvent[], correlationId?: string): void {
        if (typeof window !== "undefined") {
            super.emitEvents(events, correlationId);
        }
    }
}

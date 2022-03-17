/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger, PerformanceEvent, PerformanceEvents, IPerformanceClient, PerformanceClient, IPerformanceMeasurement } from "@azure/msal-common";
import { BrowserCrypto } from "../crypto/BrowserCrypto";
import { GuidGenerator } from "../crypto/GuidGenerator";
import { BrowserPerformanceMeasurement } from "./BrowserPerformanceMeasurement";

export class BrowserPerformanceClient extends PerformanceClient implements IPerformanceClient {
    private browserCrypto: BrowserCrypto;
    private guidGenerator: GuidGenerator;
    
    constructor(clientId: string, authority: string, logger: Logger, libraryName: string, libraryVersion: string) {
        super(clientId, authority, logger, libraryName, libraryVersion);
        this.browserCrypto = new BrowserCrypto(this.logger);
        this.guidGenerator = new GuidGenerator(this.browserCrypto);
    }
    
    startPerformanceMeasuremeant(measureName: string, correlationId?: string): IPerformanceMeasurement {
        return new BrowserPerformanceMeasurement(measureName, correlationId);
    }

    generateCallbackId() : string {
        return this.guidGenerator.generateGuid();
    }

    private getPageVisibility(): string | null {
        return document.visibilityState?.toString() || null;
    }

    startMeasurement(measureName: PerformanceEvents, correlationId?: string): (event?: Partial<PerformanceEvent>) => PerformanceEvent| null {
        // Capture page visibilityState and then invoke start/end measurement
        const startPageVisibility = this.getPageVisibility();
        
        const endMeasurement = super.startMeasurement(measureName, correlationId);

        return (event?: Partial<PerformanceEvent>): PerformanceEvent | null => {
            return endMeasurement({
                startPageVisibility,
                endPageVisibility: this.getPageVisibility(),
                ...event
            });
        };
    }
}

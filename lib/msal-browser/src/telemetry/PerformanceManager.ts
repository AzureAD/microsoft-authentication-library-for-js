/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-common";
import { BrowserCrypto } from "../crypto/BrowserCrypto";
import { GuidGenerator } from "../crypto/GuidGenerator";
import { PerformanceMeasurement } from "./PerformanceMeasurement";

export enum PerformanceEvents {
    AcquireTokenSilent = "acquireTokenSilent",
    SsoSilent = "ssoSilent",
    AcquireTokenByCode = "acquireTokenByCode",
    AcquireTokenSilentAsync = "acquireTokenSilentAsync",
    AcquireTokenByRefreshToken = "acquireTokenByRefreshToken",
    CryptoOptsGetPublicKeyThumbprint = "cryptoOptsGetPublicKeyThumbprint",
    CryptoOptsSignJwt = "cryptoOptsSignJwt"
}

export type PerformanceCallbackFunction = (events: PerformanceEvent[]) => void;

export type PerformanceEvent = {
    authority: string,
    clientId: string
    correlationId?: string,
    durationMs: number,
    endPageVisibility: VisibilityState | null,
    fromCache: boolean | null,
    name: PerformanceEvents,
    startPageVisibility: VisibilityState | null,
    startTimeMs: number,
    success: boolean | null,
    libraryName: string,
    libraryVersion: string
};

export type AcquireTokenSilentPerformanceEvent = PerformanceEvent & {
    proofOfPossesionDurationMs: number,
    cacheLookupDurationMs: number
}
export class PerformanceManager {
    private authority: string;
    private libraryName: string;
    private libraryVersion: string;
    private clientId: string;
    private logger: Logger;
    private browserCrypto: BrowserCrypto;
    private guidGenerator: GuidGenerator;
    private callbacks: Map<string, PerformanceCallbackFunction>;
    private eventsByCorrelationId: Map<string, PerformanceEvent[]>;

    constructor(clientId: string, authority: string, logger: Logger, libraryName: string, libraryVersion: string) {
        this.authority = authority;
        this.libraryName = libraryName;
        this.libraryVersion = libraryVersion;
        this.clientId = clientId;
        this.logger = logger;
        this.browserCrypto = new BrowserCrypto(this.logger);
        this.guidGenerator = new GuidGenerator(this.browserCrypto);
        this.callbacks = new Map();
        this.eventsByCorrelationId = new Map();
    }

    startMeasurement(measureName: PerformanceEvents, correlationId?: string): (event?: Partial<PerformanceEvent>) => PerformanceEvent {
        this.logger.trace(`PerformanceManager: Performance measurement started for ${measureName}`, correlationId);
        const performanceMeasure = new PerformanceMeasurement(measureName, correlationId);
        performanceMeasure.startMeasurement();
        const startTimeMs = Date.now();
        const startPageVisibility = document.visibilityState || null;

        return (event?: Partial<PerformanceEvent>): PerformanceEvent => {
            return this.endMeasurement(performanceMeasure, {
                startTimeMs,
                startPageVisibility,
                ...event
            }, measureName, correlationId);
        };
    }

    endMeasurement(performanceMeasure: PerformanceMeasurement, additionalEventData: Partial<PerformanceEvent>, measureName: PerformanceEvents, correlationId?: string): PerformanceEvent {
        performanceMeasure.endMeasurement();
        const durationMs = Math.round(performanceMeasure.flushMeasurement());
        this.logger.trace(`PerformanceManager: Performance measurement ended for ${measureName}: ${durationMs} ms`, correlationId);
        const event: PerformanceEvent = {
            authority: this.authority,
            libraryName: this.libraryName,
            libraryVersion: this.libraryVersion,
            clientId: this.clientId,
            success: null,
            fromCache: null,
            startTimeMs: 0,
            startPageVisibility: null,
            endPageVisibility: document.visibilityState || null,
            durationMs,
            name: measureName,
            correlationId,
            ...additionalEventData,
        };

        // Immediately flush events without correlation ids
        if (!correlationId) {
            this.emitEvents([event]);
        } else {
            const events = this.eventsByCorrelationId.get(correlationId);
            if (events) {
                this.logger.trace(`PerformanceManager: Performance measurement for ${measureName} added`, correlationId);
                events.push(event);
            } else {
                this.logger.trace(`PerformanceManager: Performance measurement for ${measureName} started`, correlationId);
                this.eventsByCorrelationId.set(correlationId, [event]);
            }
        }

        return event;
    }

    flushMeasurements(measureName: PerformanceEvents, correlationId?: string): void {
        if (correlationId) {
            this.logger.trace("PerformanceManager: Performance measurements flushed", correlationId);
            const events = this.eventsByCorrelationId.get(correlationId);
            if (events) {
                const topLevelEvent = events.find(event => event.name === measureName);
                if (topLevelEvent) {
                    const subMeasurements = events.filter(event => event.name !== measureName);
                    subMeasurements.forEach(event => {
                        // TODO: Emit additional properties for each subMeasurement
                        topLevelEvent[`${event.name}DurationMs`] = event.durationMs;
                    })

                    this.emitEvents([topLevelEvent]);
                };
            }
        } else {
            // TODO: Flush all?
        }
    }

    discardMeasurements(measureName: PerformanceEvents, correlationId?: string): void {
        if (correlationId) {
            this.logger.trace("PerformanceManager: Performance measurements discarded", correlationId);
            this.eventsByCorrelationId.delete(correlationId);
        }
    }

    addPerformanceCallback(callback: PerformanceCallbackFunction): string | null {
        if (typeof window !== "undefined") {
            const callbackId = this.guidGenerator.generateGuid();
            this.callbacks.set(callbackId, callback);
            this.logger.verbose(`PerformanceManager: Performance callback registered with id: ${callbackId}`);

            return callbackId;
        }

        return null;
    }

    removePerformanceCallback(callbackId: string): void {
        this.callbacks.delete(callbackId);
        this.logger.verbose(`PerformanceManager: Performance callback ${callbackId} removed.`);
    }

    emitEvents(events: PerformanceEvent[], correlationId?: string): void {
        if (typeof window !== "undefined") {
            this.logger.verbose("PerformanceManager: Emitting performance events", correlationId);

            this.callbacks.forEach((callback: PerformanceCallbackFunction, callbackId: string) => {
                this.logger.verbose(`PerformanceManager: Emitting event to callback ${callbackId}`, correlationId);
                callback.apply(null, [events]);
            });
        }
    }
}

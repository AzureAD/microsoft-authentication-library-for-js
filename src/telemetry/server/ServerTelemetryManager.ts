/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SERVER_TELEM_CONSTANTS, CacheSchemaType, Separators } from "../../utils/Constants";
import { CacheManager } from "../../cache/CacheManager";
import { AuthError } from "../../error/AuthError";
import { ServerTelemetryRequest } from "./ServerTelemetryRequest";
import { ServerTelemetryEntity } from "../../cache/entities/ServerTelemetryEntity";

export class ServerTelemetryManager {
    private cacheManager: CacheManager;
    private apiId: number;
    private correlationId: string;
    private forceRefresh: boolean;
    private telemetryCacheKey: string;

    constructor(telemetryRequest: ServerTelemetryRequest, cacheManager: CacheManager) {
        this.cacheManager = cacheManager;
        this.apiId = telemetryRequest.apiId;
        this.correlationId = telemetryRequest.correlationId;
        this.forceRefresh = telemetryRequest.forceRefresh || false;

        this.telemetryCacheKey = SERVER_TELEM_CONSTANTS.CACHE_KEY + Separators.CACHE_KEY_SEPARATOR + telemetryRequest.clientId;
    }

    // API to add MSER Telemetry to request
    generateCurrentRequestHeaderValue(): string {
        const forceRefreshInt = this.forceRefresh ? 1 : 0;
        const request = `${this.apiId}${SERVER_TELEM_CONSTANTS.VALUE_SEPARATOR}${forceRefreshInt}`;
        const platformFields = ""; // TODO: Determine what we want to include

        return [SERVER_TELEM_CONSTANTS.SCHEMA_VERSION, request, platformFields].join(SERVER_TELEM_CONSTANTS.CATEGORY_SEPARATOR);
    }

    // API to add MSER Telemetry for the last failed request
    generateLastRequestHeaderValue(): string {
        const lastRequests = this.getLastRequests();
        
        const failedRequests = lastRequests.failedRequests.join(SERVER_TELEM_CONSTANTS.VALUE_SEPARATOR);
        const errors = lastRequests.errors.join(SERVER_TELEM_CONSTANTS.VALUE_SEPARATOR);
        const overflow = lastRequests.maxErrorsToSend < lastRequests.errorCount ? "1" : "0"; // Indicate whether this header contains all data or partial data
        const platformFields = overflow;

        return [SERVER_TELEM_CONSTANTS.SCHEMA_VERSION, lastRequests.cacheHits, failedRequests, errors, platformFields].join(SERVER_TELEM_CONSTANTS.CATEGORY_SEPARATOR);
    }

    // API to cache token failures for MSER data capture
    cacheFailedRequest(error: AuthError): void {
        const lastRequests = this.getLastRequests();
        lastRequests.failedRequests.push(this.apiId, this.correlationId);
        lastRequests.errors.push(error.errorCode);
        lastRequests.errorCount += 1;
        lastRequests.dataSize += this.apiId.toString().length + this.correlationId.length + error.errorCode.length + 3 // Add 3 to account for commas

        if (lastRequests.dataSize < SERVER_TELEM_CONSTANTS.MAX_HEADER_BYTES) {
            // Prevent request headers from becoming too large due to excessive failures
            lastRequests.maxErrorsToSend += 1;
        }

        this.cacheManager.setItem(this.telemetryCacheKey, lastRequests, CacheSchemaType.TELEMETRY);

        return;
    }

    incrementCacheHits(): number {
        const lastRequests = this.getLastRequests();
        lastRequests.cacheHits += 1;

        this.cacheManager.setItem(this.telemetryCacheKey, lastRequests, CacheSchemaType.TELEMETRY);
        return lastRequests.cacheHits;
    }

    getLastRequests(): ServerTelemetryEntity { 
        const initialValue: ServerTelemetryEntity = ServerTelemetryEntity.initializeServerTelemetryEntity();
        const lastRequests = this.cacheManager.getItem(this.telemetryCacheKey, CacheSchemaType.TELEMETRY) as ServerTelemetryEntity;
        
        return lastRequests || initialValue;
    }

    clearTelemetryCache(): void {
        const lastRequests = this.getLastRequests();
        const serverTelemEntity = ServerTelemetryEntity.initializeServerTelemetryEntity();
        if (lastRequests.maxErrorsToSend === lastRequests.errorCount) {
            // All errors were sent on last request, clear Telemetry cache
            this.cacheManager.removeItem(this.telemetryCacheKey);
        } else {
            // Partial data was flushed to server, construct a new telemetry cache item with errors that were not flushed
            let i = lastRequests.maxErrorsToSend;
            while (i < lastRequests.errorCount) {
                const apiId = lastRequests.failedRequests[2*i];
                const correlationId = lastRequests.failedRequests[2*i + 1];
                const errorCode = lastRequests.errors[i];

                serverTelemEntity.failedRequests.push(apiId); // apiId
                serverTelemEntity.failedRequests.push(correlationId); // correlationId
                serverTelemEntity.errors.push(errorCode);
                serverTelemEntity.errorCount += 1;
                serverTelemEntity.dataSize += apiId.toString().length + correlationId.toString().length + errorCode.length + 3; // Add 3 to account for commas

                if (serverTelemEntity.dataSize < SERVER_TELEM_CONSTANTS.MAX_HEADER_BYTES) {
                    serverTelemEntity.maxErrorsToSend += 1;
                }
                i++;
            }
            this.cacheManager.setItem(this.telemetryCacheKey, serverTelemEntity, CacheSchemaType.TELEMETRY);
        }
    }
}

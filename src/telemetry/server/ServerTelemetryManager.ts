/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SERVER_TELEM_CONSTANTS, CacheSchemaType, Separators } from "../../utils/Constants";
import { CacheManager } from "../../cache/CacheManager";
import { ServerTelemetryCacheValue } from "./ServerTelemetryCacheValue";
import { AuthError } from "../../error/AuthError";
import { ServerTelemetryRequest } from "./ServerTelemetryRequest";
import { StringUtils } from "../../utils/StringUtils";

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
        const platformFields = lastRequests.errorCount;

        return [SERVER_TELEM_CONSTANTS.SCHEMA_VERSION, lastRequests.cacheHits, failedRequests, errors, platformFields].join(SERVER_TELEM_CONSTANTS.CATEGORY_SEPARATOR);
    }

    // API to cache token failures for MSER data capture
    cacheFailedRequest(error: AuthError): void {
        const lastRequests = this.getLastRequests();
        lastRequests.failedRequests.push(this.apiId, this.correlationId);
        lastRequests.errors.push(StringUtils.isEmpty(error.suberror)? error.errorCode: error.suberror);
        lastRequests.errorCount += 1;

        if (lastRequests.errors.length > SERVER_TELEM_CONSTANTS.FAILURE_LIMIT) {
            // Prevent request headers from becoming too large due to excessive failures
            lastRequests.failedRequests.shift(); // Remove apiId
            lastRequests.failedRequests.shift(); // Remove correlationId
            lastRequests.errors.shift();
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

    getLastRequests(): ServerTelemetryCacheValue { 
        const initialValue: ServerTelemetryCacheValue = {
            failedRequests: [],
            errors: [],
            errorCount: 0,
            cacheHits: 0            
        };
        const lastRequests = this.cacheManager.getItem(this.telemetryCacheKey, CacheSchemaType.TELEMETRY) as ServerTelemetryCacheValue;
        
        return lastRequests || initialValue;
    }

    clearTelemetryCache(): void {
        this.cacheManager.removeItem(this.telemetryCacheKey);
    }
}

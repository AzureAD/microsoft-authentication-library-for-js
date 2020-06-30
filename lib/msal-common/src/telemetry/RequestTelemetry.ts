/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { MSER_TELEM_CONSTANTS, AADServerParamKeys } from "../utils/Constants";
import { CacheManager } from "../cache/CacheManager";

export class RequestTelemetry {

    // API to add MSER Telemetry to request
    static currentRequest(apiId: number, forceRefresh?: boolean): string {
        const forceRefreshInt = forceRefresh ? 1 : 0;
        const platformFields = ""; // TODO: Determine what we want to include
        return `${MSER_TELEM_CONSTANTS.SCHEMA_VERSION}${MSER_TELEM_CONSTANTS.CATEGORY_SEPARATOR}${apiId}${MSER_TELEM_CONSTANTS.VALUE_SEPARATOR}${forceRefreshInt}${MSER_TELEM_CONSTANTS.CATEGORY_SEPARATOR}${platformFields}`;
    }

    // API to add MSER Telemetry for the last failed request
    static lastFailedRequest(): string {
        return "";
    }

    // API to cache token failures for MSER data capture
    static cacheRequestErrors(apiId: number, correlationId: string, error: string, cacheStorage: CacheManager) {
        return;
    }

    static addTelemetryHeaders(headers: Map<string, string>, apiId: number, forceRefresh: boolean): Map<string, string> {
        headers.set(AADServerParamKeys.X_CLIENT_CURR_TELEM, RequestTelemetry.currentRequest(apiId, forceRefresh));
        headers.set(AADServerParamKeys.X_CLIENT_LAST_TELEM, RequestTelemetry.lastFailedRequest());

        return headers;
    }

    /**
     * resets CacheHits after calling a NW call
     * @param cacheHits
     * @param cacheStorage
     */
    static resetCacheHits(cacheHits: number, cacheStorage: CacheManager): number {
        cacheHits = 0;
        cacheStorage.setItem(MSER_TELEM_CONSTANTS.CACHE_HITS, `${cacheHits}`);
        return cacheHits;
    }

    static incrementCacheHits(cacheStorage: CacheManager): number {
        let cacheHits = this.getCacheHits(cacheStorage);
        cacheHits += 1;
        cacheStorage.setItem(MSER_TELEM_CONSTANTS.CACHE_HITS, `${cacheHits}`);
        return cacheHits;
    }

    static getCacheHits(cacheStorage: CacheManager): number {
        return parseInt(cacheStorage.getItem(MSER_TELEM_CONSTANTS.CACHE_HITS).toString()) || 0;
    }
}

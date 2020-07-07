/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { MSER_TELEM_CONSTANTS, AADServerParamKeys } from "../utils/Constants";
import { CacheManager } from "../cache/CacheManager";
import { RequestFailures } from './RequestFailures';

export class RequestTelemetry {

    // API to add MSER Telemetry to request
    static currentRequest(apiId: number, forceRefresh?: boolean): string {
        const forceRefreshInt = forceRefresh ? 1 : 0;
        const request = `${apiId}${MSER_TELEM_CONSTANTS.VALUE_SEPARATOR}${forceRefreshInt}`
        const platformFields = ""; // TODO: Determine what we want to include

        return [MSER_TELEM_CONSTANTS.SCHEMA_VERSION, request, platformFields].join(MSER_TELEM_CONSTANTS.CATEGORY_SEPARATOR);
    }

    // API to add MSER Telemetry for the last failed request
    static lastFailedRequest(cacheStorage: CacheManager): string {
        let failures: RequestFailures = cacheStorage.getItem(MSER_TELEM_CONSTANTS.FAILURES) as RequestFailures;

        const cacheHits = this.getCacheHits(cacheStorage);
        const failedRequests = failures && failures.requests ? failures.requests.join(MSER_TELEM_CONSTANTS.VALUE_SEPARATOR): "";
        const errors = failures && failures.errors ? failures.errors.join(MSER_TELEM_CONSTANTS.VALUE_SEPARATOR): "";
        const platformFields = ""; // TODO: Determine what we want to include

        return [MSER_TELEM_CONSTANTS.SCHEMA_VERSION, cacheHits, failedRequests, errors, platformFields].join(MSER_TELEM_CONSTANTS.CATEGORY_SEPARATOR);
    }

    // API to cache token failures for MSER data capture
    static cacheRequestErrors(apiId: number, correlationId: string, error: string, cacheStorage: CacheManager): void {
        let failures: RequestFailures = cacheStorage.getItem(MSER_TELEM_CONSTANTS.FAILURES) as RequestFailures;
        if (failures) {
            failures.requests.push(apiId, correlationId);
            failures.errors.push(error);

            if (failures.count >= MSER_TELEM_CONSTANTS.FAILURE_LIMIT) {
                // Prevent request headers from becoming too large due to excessive failures
                failures.requests.shift(); // Remove apiId
                failures.requests.shift(); // Remove correlationId
                failures.errors.shift();
            } else {
                failures.count += 1;
            }
        } else {
            failures = {
                requests: [apiId, correlationId],
                errors: [error],
                count: 1
            };
        }

        cacheStorage.setItem(MSER_TELEM_CONSTANTS.FAILURES, failures);

        return;
    }

    static addTelemetryHeaders(headers: Map<string, string>, apiId: number, forceRefresh: boolean, cacheStorage: CacheManager): Map<string, string> {
        headers.set(AADServerParamKeys.X_CLIENT_CURR_TELEM, RequestTelemetry.currentRequest(apiId, forceRefresh));
        headers.set(AADServerParamKeys.X_CLIENT_LAST_TELEM, RequestTelemetry.lastFailedRequest(cacheStorage));

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

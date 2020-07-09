/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { MSER_TELEM_CONSTANTS, HeaderNames } from "../utils/Constants";
import { CacheManager } from "../cache/CacheManager";
import { RequestFailures } from "./RequestFailures";
import { AuthError } from "../error/AuthError";

export class TelemetryManager {
    private cacheStorage: CacheManager;
    private apiId: number;
    private correlationId: string;
    private forceRefresh: boolean;

    constructor(cacheStorage: CacheManager, apiId: number, correlationId: string, forceRefresh?: boolean) {
        this.cacheStorage = cacheStorage;
        this.apiId = apiId;
        this.correlationId = correlationId;
        this.forceRefresh = forceRefresh || false;
    }

    // API to add MSER Telemetry to request
    protected currentRequest(): string {
        const forceRefreshInt = this.forceRefresh ? 1 : 0;
        const request = `${this.apiId}${MSER_TELEM_CONSTANTS.VALUE_SEPARATOR}${forceRefreshInt}`;
        const platformFields = ""; // TODO: Determine what we want to include

        return [MSER_TELEM_CONSTANTS.SCHEMA_VERSION, request, platformFields].join(MSER_TELEM_CONSTANTS.CATEGORY_SEPARATOR);
    }

    // API to add MSER Telemetry for the last failed request
    protected lastFailedRequest(): string {
        const failures: RequestFailures = this.cacheStorage.getItem(MSER_TELEM_CONSTANTS.FAILURES) as RequestFailures;

        const cacheHits = this.getCacheHits();
        const failedRequests = failures && failures.requests ? failures.requests.join(MSER_TELEM_CONSTANTS.VALUE_SEPARATOR): "";
        const errors = failures && failures.errors ? failures.errors.join(MSER_TELEM_CONSTANTS.VALUE_SEPARATOR): "";
        const platformFields = ""; // TODO: Determine what we want to include

        return [MSER_TELEM_CONSTANTS.SCHEMA_VERSION, cacheHits, failedRequests, errors, platformFields].join(MSER_TELEM_CONSTANTS.CATEGORY_SEPARATOR);
    }

    // API to cache token failures for MSER data capture
    cacheFailedRequest(error: AuthError): void {
        let failures: RequestFailures = this.cacheStorage.getItem(MSER_TELEM_CONSTANTS.FAILURES) as RequestFailures;
        if (failures) {
            failures.requests.push(this.apiId, this.correlationId);
            failures.errors.push(error.errorCode);

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
                requests: [this.apiId, this.correlationId],
                errors: [error.errorCode],
                count: 1
            };
        }

        this.cacheStorage.setItem(MSER_TELEM_CONSTANTS.FAILURES, failures);

        return;
    }

    addTelemetryHeaders(headers: Map<string, string>): Map<string, string> {
        headers.set(HeaderNames.X_CLIENT_CURR_TELEM, this.currentRequest());
        headers.set(HeaderNames.X_CLIENT_LAST_TELEM, this.lastFailedRequest());

        return headers;
    }

    /**
     * resets Cache Hits and Failures after network call successfully logged by server
     * @param cacheHits
     * @param cacheStorage
     */
    static clearTelemetryCache(cacheStorage: CacheManager): void {
        cacheStorage.removeItem(MSER_TELEM_CONSTANTS.CACHE_HITS);
        cacheStorage.removeItem(MSER_TELEM_CONSTANTS.FAILURES);
    }

    incrementCacheHits(): number {
        let cacheHits = this.getCacheHits();
        cacheHits += 1;
        this.cacheStorage.setItem(MSER_TELEM_CONSTANTS.CACHE_HITS, `${cacheHits}`);
        return cacheHits;
    }

    protected getCacheHits(): number {
        return parseInt(this.cacheStorage.getItem(MSER_TELEM_CONSTANTS.CACHE_HITS) as string) || 0;
    }
}

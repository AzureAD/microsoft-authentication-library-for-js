/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SERVER_TELEM_CONSTANTS, HeaderNames, CacheSchemaType } from "../../utils/Constants";
import { CacheManager } from "../../cache/CacheManager";
import { RequestFailures } from "./RequestFailures";
import { AuthError } from "../../error/AuthError";

export class ServerTelemetryManager {
    private cacheManager: CacheManager;
    private apiId: number;
    private correlationId: string;
    private forceRefresh: boolean;

    constructor(cacheManager: CacheManager, apiId: number, correlationId: string, forceRefresh?: boolean) {
        this.cacheManager = cacheManager;
        this.apiId = apiId;
        this.correlationId = correlationId;
        this.forceRefresh = forceRefresh || false;
    }

    // API to add MSER Telemetry to request
    protected currentRequest(): string {
        const forceRefreshInt = this.forceRefresh ? 1 : 0;
        const request = `${this.apiId}${SERVER_TELEM_CONSTANTS.VALUE_SEPARATOR}${forceRefreshInt}`;
        const platformFields = ""; // TODO: Determine what we want to include

        return [SERVER_TELEM_CONSTANTS.SCHEMA_VERSION, request, platformFields].join(SERVER_TELEM_CONSTANTS.CATEGORY_SEPARATOR);
    }

    // API to add MSER Telemetry for the last failed request
    protected lastFailedRequest(): string {
        const failures = this.getCachedFailures();
        const cacheHits = this.getCacheHits();
        
        const failedRequests = failures && failures.requests ? failures.requests.join(SERVER_TELEM_CONSTANTS.VALUE_SEPARATOR): "";
        const errors = failures && failures.errors ? failures.errors.join(SERVER_TELEM_CONSTANTS.VALUE_SEPARATOR): "";
        const platformFields = ""; // TODO: Determine what we want to include

        return [SERVER_TELEM_CONSTANTS.SCHEMA_VERSION, cacheHits, failedRequests, errors, platformFields].join(SERVER_TELEM_CONSTANTS.CATEGORY_SEPARATOR);
    }

    // API to cache token failures for MSER data capture
    cacheFailedRequest(error: AuthError): void {
        let failures = this.getCachedFailures();
        if (failures) {
            failures.requests.push(this.apiId, this.correlationId);
            failures.errors.push(error.errorCode);

            if (failures.count >= SERVER_TELEM_CONSTANTS.FAILURE_LIMIT) {
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

        this.cacheManager.setItem(SERVER_TELEM_CONSTANTS.LAST_FAILED_REQUEST_KEY, JSON.stringify(failures), CacheSchemaType.TELEMETRY);

        return;
    }

    addTelemetryHeaders(headers: Map<string, string>): Map<string, string> {
        headers.set(HeaderNames.X_CLIENT_CURR_TELEM, this.currentRequest());
        headers.set(HeaderNames.X_CLIENT_LAST_TELEM, this.lastFailedRequest());

        return headers;
    }

    incrementCacheHits(): number {
        let cacheHits = this.getCacheHits();
        cacheHits += 1;
        this.cacheManager.setItem(SERVER_TELEM_CONSTANTS.CACHE_HITS_KEY, cacheHits.toString(), CacheSchemaType.TELEMETRY);
        return cacheHits;
    }

    protected getCacheHits(): number {
        const cacheHits = this.cacheManager.getItem(SERVER_TELEM_CONSTANTS.CACHE_HITS_KEY, CacheSchemaType.TELEMETRY) as string;
        return parseInt(cacheHits) || 0;
    }

    protected getCachedFailures(): RequestFailures {
        const cachedFailures = this.cacheManager.getItem(SERVER_TELEM_CONSTANTS.LAST_FAILED_REQUEST_KEY, CacheSchemaType.TELEMETRY) as string;
        return cachedFailures? JSON.parse(cachedFailures) as RequestFailures: null;
    }
}

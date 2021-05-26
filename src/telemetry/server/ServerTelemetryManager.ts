/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SERVER_TELEM_CONSTANTS, Separators, Constants, RegionDiscoverySources, RegionDiscoveryOutcomes } from "../../utils/Constants";
import { CacheManager } from "../../cache/CacheManager";
import { AuthError } from "../../error/AuthError";
import { ServerTelemetryRequest } from "./ServerTelemetryRequest";
import { ServerTelemetryEntity } from "../../cache/entities/ServerTelemetryEntity";
import { StringUtils } from "../../utils/StringUtils";
import { RegionDiscoveryMetadata } from "../../authority/RegionDiscoveryMetadata";

export class ServerTelemetryManager {
    private cacheManager: CacheManager;
    private apiId: number;
    private correlationId: string;
    private forceRefresh: boolean;
    private telemetryCacheKey: string;
    private wrapperSKU: String;
    private wrapperVer: String;
    private regionUsed: string | undefined;
    private regionSource: RegionDiscoverySources | undefined;
    private regionOutcome: RegionDiscoveryOutcomes | undefined;
    private noCacheHit: boolean;
    private cachedAtDoesNotExist: boolean;
    private cachedAtIsExpired: boolean; 
    private cachedAtShouldBeRefreshed: boolean;

    constructor(telemetryRequest: ServerTelemetryRequest, cacheManager: CacheManager) {
        this.cacheManager = cacheManager;
        this.apiId = telemetryRequest.apiId;
        this.correlationId = telemetryRequest.correlationId;
        this.forceRefresh = telemetryRequest.forceRefresh || false;
        this.wrapperSKU = telemetryRequest.wrapperSKU || Constants.EMPTY_STRING;
        this.wrapperVer = telemetryRequest.wrapperVer || Constants.EMPTY_STRING;

        this.telemetryCacheKey = SERVER_TELEM_CONSTANTS.CACHE_KEY + Separators.CACHE_KEY_SEPARATOR + telemetryRequest.clientId;
    }

    /**
     * API to add MSER Telemetry to request
     */
    generateCurrentRequestHeaderValue(): string {
        const cacheInfo = this.getCacheInfoValue();
        const request = `${this.apiId}${SERVER_TELEM_CONSTANTS.VALUE_SEPARATOR}${cacheInfo}`;
        const platformFields = [this.wrapperSKU, this.wrapperVer].join(SERVER_TELEM_CONSTANTS.VALUE_SEPARATOR);
        const regionDiscoveryFields = this.getRegionDiscoveryFields();
        const requestWithRegionDiscoveryFields = [request, regionDiscoveryFields].join(SERVER_TELEM_CONSTANTS.VALUE_SEPARATOR);

        const serverTelemetryHeaders = [SERVER_TELEM_CONSTANTS.SCHEMA_VERSION, requestWithRegionDiscoveryFields, platformFields].join(SERVER_TELEM_CONSTANTS.CATEGORY_SEPARATOR);
        // eslint-disable-next-line no-console
        console.log(serverTelemetryHeaders);

        return serverTelemetryHeaders;
    }

    /**
     * API to add MSER Telemetry for the last failed request
     */
    generateLastRequestHeaderValue(): string {
        const lastRequests = this.getLastRequests();

        const maxErrors = ServerTelemetryManager.maxErrorsToSend(lastRequests);
        const failedRequests = lastRequests.failedRequests.slice(0, 2*maxErrors).join(SERVER_TELEM_CONSTANTS.VALUE_SEPARATOR);
        const errors = lastRequests.errors.slice(0, maxErrors).join(SERVER_TELEM_CONSTANTS.VALUE_SEPARATOR);
        const errorCount = lastRequests.errors.length;

        // Indicate whether this header contains all data or partial data
        const overflow = maxErrors < errorCount ? SERVER_TELEM_CONSTANTS.OVERFLOW_TRUE : SERVER_TELEM_CONSTANTS.OVERFLOW_FALSE;
        const platformFields = [errorCount, overflow].join(SERVER_TELEM_CONSTANTS.VALUE_SEPARATOR);

        return [SERVER_TELEM_CONSTANTS.SCHEMA_VERSION, lastRequests.cacheHits, failedRequests, errors, platformFields].join(SERVER_TELEM_CONSTANTS.CATEGORY_SEPARATOR);
    }

    /**
     * API to cache token failures for MSER data capture
     * @param error
     */
    cacheFailedRequest(error: AuthError): void {
        const lastRequests = this.getLastRequests();
        if (lastRequests.errors.length >= SERVER_TELEM_CONSTANTS.MAX_CACHED_ERRORS) {
            // Remove a cached error to make room, first in first out
            lastRequests.failedRequests.shift(); // apiId
            lastRequests.failedRequests.shift(); // correlationId
            lastRequests.errors.shift();
        }
        
        lastRequests.failedRequests.push(this.apiId, this.correlationId);

        if (!StringUtils.isEmpty(error.subError)) {
            lastRequests.errors.push(error.subError);
        } else if (!StringUtils.isEmpty(error.errorCode)) {
            lastRequests.errors.push(error.errorCode);
        } else if (!!error && error.toString()) {
            lastRequests.errors.push(error.toString());
        } else {
            lastRequests.errors.push(SERVER_TELEM_CONSTANTS.UNKNOWN_ERROR);
        }

        this.cacheManager.setServerTelemetry(this.telemetryCacheKey, lastRequests);

        return;
    }

    /**
     * Update server telemetry cache entry by incrementing cache hit counter
     */
    incrementCacheHits(): number {
        const lastRequests = this.getLastRequests();
        lastRequests.cacheHits += 1;

        this.cacheManager.setServerTelemetry(this.telemetryCacheKey, lastRequests);
        return lastRequests.cacheHits;
    }

    /**
     * Get the server telemetry entity from cache or initialize a new one
     */
    getLastRequests(): ServerTelemetryEntity {
        const initialValue: ServerTelemetryEntity = new ServerTelemetryEntity();
        const lastRequests = this.cacheManager.getServerTelemetry(this.telemetryCacheKey) as ServerTelemetryEntity;

        return lastRequests || initialValue;
    }

    /**
     * Remove server telemetry cache entry
     */
    clearTelemetryCache(): void {
        const lastRequests = this.getLastRequests();
        const numErrorsFlushed = ServerTelemetryManager.maxErrorsToSend(lastRequests);
        const errorCount = lastRequests.errors.length;
        if (numErrorsFlushed === errorCount) {
            // All errors were sent on last request, clear Telemetry cache
            this.cacheManager.removeItem(this.telemetryCacheKey);
        } else {
            // Partial data was flushed to server, construct a new telemetry cache item with errors that were not flushed
            const serverTelemEntity = new ServerTelemetryEntity();
            serverTelemEntity.failedRequests = lastRequests.failedRequests.slice(numErrorsFlushed*2); // failedRequests contains 2 items for each error
            serverTelemEntity.errors = lastRequests.errors.slice(numErrorsFlushed);

            this.cacheManager.setServerTelemetry(this.telemetryCacheKey, serverTelemEntity);
        }
    }

    /**
     * Returns the maximum number of errors that can be flushed to the server in the next network request
     * @param serverTelemetryEntity
     */
    static maxErrorsToSend(serverTelemetryEntity: ServerTelemetryEntity): number {
        let i;
        let maxErrors = 0;
        let dataSize = 0;
        const errorCount = serverTelemetryEntity.errors.length;
        for (i = 0; i < errorCount; i++) {
            // failedRequests parameter contains pairs of apiId and correlationId, multiply index by 2 to preserve pairs
            const apiId = serverTelemetryEntity.failedRequests[2*i] || Constants.EMPTY_STRING;
            const correlationId = serverTelemetryEntity.failedRequests[2*i + 1] || Constants.EMPTY_STRING;
            const errorCode = serverTelemetryEntity.errors[i] || Constants.EMPTY_STRING;

            // Count number of characters that would be added to header, each character is 1 byte. Add 3 at the end to account for separators
            dataSize += apiId.toString().length + correlationId.toString().length + errorCode.length + 3;

            if (dataSize < SERVER_TELEM_CONSTANTS.MAX_LAST_HEADER_BYTES) {
                // Adding this entry to the header would still keep header size below the limit
                maxErrors += 1;
            } else {
                break;
            }
        }

        return maxErrors;
    }

    /**
     * Get the region discovery fields
     * 
     * @returns string
     */
    getRegionDiscoveryFields(): string {
        const regionDiscoveryFields: string[] = [];

        regionDiscoveryFields.push(this.regionUsed ? this.regionUsed : "");
        regionDiscoveryFields.push(this.getRegionSourceValue(this.regionSource));
        regionDiscoveryFields.push(this.getRegionOutcomeValue(this.regionOutcome));

        return regionDiscoveryFields.join(",");
    }

    /**
     * Get the header value for the region source
     * @param regionSource
     * @returns string
     */
    getRegionSourceValue(regionSource: RegionDiscoverySources | undefined): string {
        if (!regionSource) return "";

        switch (regionSource) {
            case RegionDiscoverySources.FAILED_AUTO_DETECTION:
                return "1";
            case RegionDiscoverySources.INTERNAL_CACHE:
                return "2";
            case RegionDiscoverySources.ENVIRONMENT_VARIABLE:
                return "3";
            case RegionDiscoverySources.IMDS:
                return "4";
            default:
                return "0";
        }
    }

    getRegionOutcomeValue(regionOutcome: RegionDiscoveryOutcomes | undefined): string {
        if (!regionOutcome) return "";

        switch (regionOutcome) {
            case RegionDiscoveryOutcomes.CONFIGURED_MATCHES_DETECTED:
                return "1";
            case RegionDiscoveryOutcomes.CONFIGURED_NO_AUTO_DETECTION:
                return "2";
            case RegionDiscoveryOutcomes.CONFIGURED_NOT_DETECTED:
                return "3";
            case RegionDiscoveryOutcomes.AUTO_DETECTION_REQUESTED_SUCCESSFUL:
                return "4";
            case RegionDiscoveryOutcomes.AUTO_DETECTION_REQUESTED_FAILED:
                return "5";
            default:
                return "0";
        }
    }
    
    getCacheInfoValue(): string {
        if (this.noCacheHit) {
            return "0";
        } else if (this.forceRefresh) {
            return "1";
        } else if (this.cachedAtDoesNotExist) {
            return "2";
        } else if (this.cachedAtIsExpired) { 
            return "3";
        } else if (this.cachedAtShouldBeRefreshed) {
            return "4";
        } else {
            return "0";
        }

        return "0";
    }

    /**
     * Update the region discovery metadata
     * 
     * @param regionDiscoveryMetadata
     * @returns void
     */
    updateRegionDiscoveryMetadata(regionDiscoveryMetadata: RegionDiscoveryMetadata): void {
        this.regionUsed = regionDiscoveryMetadata.region_used;
        this.regionSource = regionDiscoveryMetadata.region_source;
        this.regionOutcome = regionDiscoveryMetadata.region_outcome;
    }
    
    /**
     * Set no cache hit to be true
     */
    recordNoCacheHit(): void {
        this.noCacheHit = true;
    }

    /**
     * Set that no cached AT exists
     */
    recordCachedAtDoesNotExist(): void {
        this.cachedAtDoesNotExist = true;
    }

    /**
     * Set that the cached AT us expired
     */
    recordCachedAtExpired(): void {
        this.cachedAtIsExpired = true;
    }

    /**
     * TODO: Implement the refresh_in logic
     * Set that the cached AT requires to be refreshed
     */
    recordCachedAtShouldBeRefreshed(): void {
        this.cachedAtShouldBeRefreshed = true;
    }
}

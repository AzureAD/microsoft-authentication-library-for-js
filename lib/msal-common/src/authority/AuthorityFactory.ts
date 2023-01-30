/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Authority } from "./Authority";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { INetworkModule } from "../network/INetworkModule";
import { StringUtils } from "../utils/StringUtils";
import { ClientAuthError } from "../error/ClientAuthError";
import { ICacheManager } from "../cache/interface/ICacheManager";
import { AuthorityOptions } from "./AuthorityOptions";
import { Logger } from "../logger/Logger";
import { IPerformanceClient } from "../telemetry/performance/IPerformanceClient";
import { PerformanceEvents } from "../telemetry/performance/PerformanceEvent";

export class AuthorityFactory {

    /**
     * Create an authority object of the correct type based on the url
     * Performs basic authority validation - checks to see if the authority is of a valid type (i.e. aad, b2c, adfs)
     *
     * Also performs endpoint discovery.
     *
     * @param authorityUri
     * @param networkClient
     * @param protocolMode
     */
    static async createDiscoveredInstance(
        authorityUri: string,
        networkClient: INetworkModule,
        cacheManager: ICacheManager,
        authorityOptions: AuthorityOptions,
        logger: Logger,
        proxyUrl?: string,
        performanceClient?: IPerformanceClient,
        correlationId?: string
    ): Promise<Authority> {
        performanceClient?.addQueueMeasurement(PerformanceEvents.AuthorityFactoryCreateDiscoveredInstance, correlationId);

        // Initialize authority and perform discovery endpoint check.
        const acquireTokenAuthority: Authority = AuthorityFactory.createInstance(
            authorityUri,
            networkClient,
            cacheManager,
            authorityOptions,
            logger,
            proxyUrl,
            performanceClient,
            correlationId
        );

        try {
            performanceClient?.setPreQueueTime(PerformanceEvents.AuthorityResolveEndpointsAsync, correlationId);
            await acquireTokenAuthority.resolveEndpointsAsync();
            return acquireTokenAuthority;
        } catch (e) {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError(e);
        }
    }

    /**
     * Create an authority object of the correct type based on the url
     * Performs basic authority validation - checks to see if the authority is of a valid type (i.e. aad, b2c, adfs)
     *
     * Does not perform endpoint discovery.
     *
     * @param authorityUrl
     * @param networkInterface
     * @param protocolMode
     */
    static createInstance(
        authorityUrl: string,
        networkInterface: INetworkModule,
        cacheManager: ICacheManager,
        authorityOptions: AuthorityOptions,
        logger: Logger,
        proxyUrl?: string,
        performanceClient?: IPerformanceClient,
        correlationId?: string
    ): Authority {
        // Throw error if authority url is empty
        if (StringUtils.isEmpty(authorityUrl)) {
            throw ClientConfigurationError.createUrlEmptyError();
        }

        return new Authority(authorityUrl, networkInterface, cacheManager, authorityOptions, logger, proxyUrl, performanceClient, correlationId);
    }
}

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Authority, formatAuthorityUri } from "./Authority";
import { INetworkModule } from "../network/INetworkModule";
import {
    createClientAuthError,
    ClientAuthErrorCodes,
} from "../error/ClientAuthError";
import { ICacheManager } from "../cache/interface/ICacheManager";
import { AuthorityOptions } from "./AuthorityOptions";
import { Logger } from "../logger/Logger";
import { IPerformanceClient } from "../telemetry/performance/IPerformanceClient";
import { PerformanceEvents } from "../telemetry/performance/PerformanceEvent";
import { invokeAsync } from "../utils/FunctionWrappers";

/**
 * Create an authority object of the correct type based on the url
 * Performs basic authority validation - checks to see if the authority is of a valid type (i.e. aad, b2c, adfs)
 *
 * Also performs endpoint discovery.
 *
 * @param authorityUri
 * @param networkClient
 * @param protocolMode
 * @internal
 */
export async function createDiscoveredInstance(
    authorityUri: string,
    networkClient: INetworkModule,
    cacheManager: ICacheManager,
    authorityOptions: AuthorityOptions,
    logger: Logger,
    correlationId: string,
    performanceClient?: IPerformanceClient
): Promise<Authority> {
    performanceClient?.addQueueMeasurement(
        PerformanceEvents.AuthorityFactoryCreateDiscoveredInstance,
        correlationId
    );
    const authorityUriFinal = Authority.transformCIAMAuthority(
        formatAuthorityUri(authorityUri)
    );

    // Initialize authority and perform discovery endpoint check.
    const acquireTokenAuthority: Authority = new Authority(
        authorityUriFinal,
        networkClient,
        cacheManager,
        authorityOptions,
        logger,
        correlationId,
        performanceClient
    );

    try {
        await invokeAsync(
            acquireTokenAuthority.resolveEndpointsAsync.bind(
                acquireTokenAuthority
            ),
            PerformanceEvents.AuthorityResolveEndpointsAsync,
            logger,
            performanceClient,
            correlationId
        )();
        return acquireTokenAuthority;
    } catch (e) {
        throw createClientAuthError(
            ClientAuthErrorCodes.endpointResolutionError
        );
    }
}

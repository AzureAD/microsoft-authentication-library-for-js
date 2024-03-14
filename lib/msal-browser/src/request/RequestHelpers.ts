/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccountInfo,
    AuthenticationScheme,
    BaseAuthRequest,
    ClientConfigurationErrorCodes,
    CommonSilentFlowRequest,
    IPerformanceClient,
    Logger,
    PerformanceEvents,
    StringUtils,
    createClientConfigurationError,
    invokeAsync,
} from "@azure/msal-common";
import { BrowserConfiguration } from "../config/Configuration";
import { SilentRequest } from "./SilentRequest";
import { hashString } from "../crypto/BrowserCrypto";

/**
 * Initializer function for all request APIs
 * @param request
 */
export async function initializeBaseRequest(
    request: Partial<BaseAuthRequest> & { correlationId: string },
    config: BrowserConfiguration,
    performanceClient: IPerformanceClient,
    logger: Logger
): Promise<BaseAuthRequest> {
    performanceClient.addQueueMeasurement(
        PerformanceEvents.InitializeBaseRequest,
        request.correlationId
    );
    const authority = request.authority || config.auth.authority;

    const scopes = [...((request && request.scopes) || [])];

    const validatedRequest: BaseAuthRequest = {
        ...request,
        correlationId: request.correlationId,
        authority,
        scopes,
    };

    // Set authenticationScheme to BEARER if not explicitly set in the request
    if (!validatedRequest.authenticationScheme) {
        validatedRequest.authenticationScheme = AuthenticationScheme.BEARER;
        logger.verbose(
            'Authentication Scheme wasn\'t explicitly set in request, defaulting to "Bearer" request'
        );
    } else {
        if (
            validatedRequest.authenticationScheme === AuthenticationScheme.SSH
        ) {
            if (!request.sshJwk) {
                throw createClientConfigurationError(
                    ClientConfigurationErrorCodes.missingSshJwk
                );
            }
            if (!request.sshKid) {
                throw createClientConfigurationError(
                    ClientConfigurationErrorCodes.missingSshKid
                );
            }
        }
        logger.verbose(
            `Authentication Scheme set to "${validatedRequest.authenticationScheme}" as configured in Auth request`
        );
    }

    // Set requested claims hash if claims-based caching is enabled and claims were requested
    if (
        config.cache.claimsBasedCachingEnabled &&
        request.claims &&
        // Checks for empty stringified object "{}" which doesn't qualify as requested claims
        !StringUtils.isEmptyObj(request.claims)
    ) {
        validatedRequest.requestedClaimsHash = await hashString(request.claims);
    }

    return validatedRequest;
}

export async function initializeSilentRequest(
    request: SilentRequest & { correlationId: string },
    account: AccountInfo,
    config: BrowserConfiguration,
    performanceClient: IPerformanceClient,
    logger: Logger
): Promise<CommonSilentFlowRequest> {
    performanceClient.addQueueMeasurement(
        PerformanceEvents.InitializeSilentRequest,
        request.correlationId
    );

    const baseRequest = await invokeAsync(
        initializeBaseRequest,
        PerformanceEvents.InitializeBaseRequest,
        logger,
        performanceClient,
        request.correlationId
    )(request, config, performanceClient, logger);
    return {
        ...request,
        ...baseRequest,
        account: account,
        forceRefresh: request.forceRefresh || false,
    };
}

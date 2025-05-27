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
    createClientConfigurationError,
    invokeAsync,
} from "@azure/msal-common/browser";
import { BrowserConfiguration } from "../config/Configuration.js";
import { SilentRequest } from "./SilentRequest.js";

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

    return validatedRequest;
}

export async function initializeSilentRequest(
    request: SilentRequest & { correlationId: string },
    account: AccountInfo,
    config: BrowserConfiguration,
    performanceClient: IPerformanceClient,
    logger: Logger
): Promise<CommonSilentFlowRequest> {
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

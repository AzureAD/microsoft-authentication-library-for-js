/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StandardInteractionClient } from "./StandardInteractionClient";
import {
    CommonSilentFlowRequest,
    ServerTelemetryManager,
    RefreshTokenClient,
    AuthError,
    AzureCloudOptions,
    PerformanceEvents,
    invokeAsync,
} from "@azure/msal-common";
import { ApiId } from "../utils/BrowserConstants";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../error/BrowserAuthError";
import { AuthenticationResult } from "../response/AuthenticationResult";

export class SilentRefreshClient extends StandardInteractionClient {
    /**
     * Exchanges the refresh token for new tokens
     * @param request
     */
    async acquireToken(
        request: CommonSilentFlowRequest
    ): Promise<AuthenticationResult> {
        this.performanceClient.addQueueMeasurement(
            PerformanceEvents.SilentRefreshClientAcquireToken,
            request.correlationId
        );

        const baseRequest = await invokeAsync(
            this.initializeBaseRequest.bind(this),
            PerformanceEvents.InitializeBaseRequest,
            this.logger,
            this.performanceClient,
            request.correlationId
        )(request, request.account);
        const silentRequest: CommonSilentFlowRequest = {
            ...request,
            ...baseRequest,
        };
        const serverTelemetryManager = this.initializeServerTelemetryManager(
            ApiId.acquireTokenSilent_silentFlow
        );

        const refreshTokenClient = await this.createRefreshTokenClient(
            serverTelemetryManager,
            silentRequest.authority,
            silentRequest.azureCloudOptions
        );
        // Send request to renew token. Auth module will throw errors if token cannot be renewed.
        return invokeAsync(
            refreshTokenClient.acquireTokenByRefreshToken.bind(
                refreshTokenClient
            ),
            PerformanceEvents.RefreshTokenClientAcquireTokenByRefreshToken,
            this.logger,
            this.performanceClient,
            request.correlationId
        )(silentRequest).catch((e: AuthError) => {
            (e as AuthError).setCorrelationId(this.correlationId);
            serverTelemetryManager.cacheFailedRequest(e);
            throw e;
        }) as Promise<AuthenticationResult>;
    }

    /**
     * Currently Unsupported
     */
    logout(): Promise<void> {
        // Synchronous so we must reject
        return Promise.reject(
            createBrowserAuthError(
                BrowserAuthErrorCodes.silentLogoutUnsupported
            )
        );
    }

    /**
     * Creates a Refresh Client with the given authority, or the default authority.
     * @param serverTelemetryManager
     * @param authorityUrl
     */
    protected async createRefreshTokenClient(
        serverTelemetryManager: ServerTelemetryManager,
        authorityUrl?: string,
        azureCloudOptions?: AzureCloudOptions
    ): Promise<RefreshTokenClient> {
        // Create auth module.
        const clientConfig = await invokeAsync(
            this.getClientConfiguration.bind(this),
            PerformanceEvents.StandardInteractionClientGetClientConfiguration,
            this.logger,
            this.performanceClient,
            this.correlationId
        )(serverTelemetryManager, authorityUrl, azureCloudOptions);
        return new RefreshTokenClient(clientConfig, this.performanceClient);
    }
}

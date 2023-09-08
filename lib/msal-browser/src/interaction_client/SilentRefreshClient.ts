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

        this.performanceClient.setPreQueueTime(
            PerformanceEvents.InitializeBaseRequest,
            request.correlationId
        );
        const silentRequest: CommonSilentFlowRequest = {
            ...request,
            ...(await this.initializeBaseRequest(request, request.account)),
        };
        const acquireTokenMeasurement = this.performanceClient.startMeasurement(
            PerformanceEvents.SilentRefreshClientAcquireToken,
            silentRequest.correlationId
        );
        const serverTelemetryManager = this.initializeServerTelemetryManager(
            ApiId.acquireTokenSilent_silentFlow
        );

        const refreshTokenClient = await this.createRefreshTokenClient(
            serverTelemetryManager,
            silentRequest.authority,
            silentRequest.azureCloudOptions
        );
        this.logger.verbose("Refresh token client created");
        // Send request to renew token. Auth module will throw errors if token cannot be renewed.
        this.performanceClient.setPreQueueTime(
            PerformanceEvents.RefreshTokenClientAcquireTokenByRefreshToken,
            request.correlationId
        );
        return refreshTokenClient
            .acquireTokenByRefreshToken(silentRequest)
            .then((result) => result as AuthenticationResult)
            .then((result: AuthenticationResult) => {
                acquireTokenMeasurement.end({
                    success: true,
                    fromCache: result.fromCache,
                    requestId: result.requestId,
                });

                return result;
            })
            .catch((e: AuthError) => {
                (e as AuthError).setCorrelationId(this.correlationId);
                serverTelemetryManager.cacheFailedRequest(e);
                acquireTokenMeasurement.end({
                    errorCode: e.errorCode,
                    subErrorCode: e.subError,
                    success: false,
                });
                throw e;
            });
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
        this.performanceClient.setPreQueueTime(
            PerformanceEvents.StandardInteractionClientGetClientConfiguration,
            this.correlationId
        );
        const clientConfig = await this.getClientConfiguration(
            serverTelemetryManager,
            authorityUrl,
            azureCloudOptions
        );
        return new RefreshTokenClient(clientConfig, this.performanceClient);
    }
}

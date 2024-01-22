/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StandardInteractionClient } from "./StandardInteractionClient";
import {
    CommonSilentFlowRequest,
    SilentFlowClient,
    ServerTelemetryManager,
    AccountInfo,
    AzureCloudOptions,
    PerformanceEvents,
    invokeAsync,
} from "@azure/msal-common";
import { SilentRequest } from "../request/SilentRequest";
import { ApiId } from "../utils/BrowserConstants";
import {
    BrowserAuthError,
    BrowserAuthErrorCodes,
} from "../error/BrowserAuthError";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { ClearCacheRequest } from "../request/ClearCacheRequest";

export class SilentCacheClient extends StandardInteractionClient {
    /**
     * Returns unexpired tokens from the cache, if available
     * @param silentRequest
     */
    async acquireToken(
        silentRequest: CommonSilentFlowRequest
    ): Promise<AuthenticationResult> {
        this.performanceClient.addQueueMeasurement(
            PerformanceEvents.SilentCacheClientAcquireToken,
            silentRequest.correlationId
        );
        // Telemetry manager only used to increment cacheHits here
        const serverTelemetryManager = this.initializeServerTelemetryManager(
            ApiId.acquireTokenSilent_silentFlow
        );

        const silentAuthClient = await this.createSilentFlowClient(
            serverTelemetryManager,
            silentRequest.authority,
            silentRequest.azureCloudOptions,
            silentRequest.account
        );
        this.logger.verbose("Silent auth client created");

        try {
            const response = await invokeAsync(
                silentAuthClient.acquireCachedToken.bind(silentAuthClient),
                PerformanceEvents.SilentFlowClientAcquireCachedToken,
                this.logger,
                this.performanceClient,
                silentRequest.correlationId
            )(silentRequest);
            const authResponse = response[0] as AuthenticationResult;

            this.performanceClient.addFields(
                {
                    fromCache: true,
                },
                silentRequest.correlationId
            );
            return authResponse;
        } catch (error) {
            if (
                error instanceof BrowserAuthError &&
                error.errorCode === BrowserAuthErrorCodes.cryptoKeyNotFound
            ) {
                this.logger.verbose(
                    "Signing keypair for bound access token not found. Refreshing bound access token and generating a new crypto keypair."
                );
            }
            throw error;
        }
    }

    /**
     * API to silenty clear the browser cache.
     * @param logoutRequest
     */
    logout(logoutRequest?: ClearCacheRequest): Promise<void> {
        this.logger.verbose("logoutRedirect called");
        const validLogoutRequest = this.initializeLogoutRequest(logoutRequest);
        return this.clearCacheOnLogout(validLogoutRequest?.account);
    }

    /**
     * Creates an Silent Flow Client with the given authority, or the default authority.
     * @param serverTelemetryManager
     * @param authorityUrl
     */
    protected async createSilentFlowClient(
        serverTelemetryManager: ServerTelemetryManager,
        authorityUrl?: string,
        azureCloudOptions?: AzureCloudOptions,
        account?: AccountInfo
    ): Promise<SilentFlowClient> {
        // Create auth module.
        const clientConfig = await invokeAsync(
            this.getClientConfiguration.bind(this),
            PerformanceEvents.StandardInteractionClientGetClientConfiguration,
            this.logger,
            this.performanceClient,
            this.correlationId
        )(serverTelemetryManager, authorityUrl, azureCloudOptions, account);
        return new SilentFlowClient(clientConfig, this.performanceClient);
    }

    async initializeSilentRequest(
        request: SilentRequest,
        account: AccountInfo
    ): Promise<CommonSilentFlowRequest> {
        this.performanceClient.addQueueMeasurement(
            PerformanceEvents.InitializeSilentRequest,
            this.correlationId
        );

        const baseRequest = await invokeAsync(
            this.initializeBaseRequest.bind(this),
            PerformanceEvents.InitializeBaseRequest,
            this.logger,
            this.performanceClient,
            this.correlationId
        )(request);
        return {
            ...request,
            ...baseRequest,
            account: account,
            forceRefresh: request.forceRefresh || false,
        };
    }
}

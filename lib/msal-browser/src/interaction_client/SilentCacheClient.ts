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
    AuthError,
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
        const acquireTokenMeasurement = this.performanceClient.startMeasurement(
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
            silentRequest.azureCloudOptions
        );
        this.logger.verbose("Silent auth client created");

        try {
            const cachedToken = (await silentAuthClient.acquireCachedToken(
                silentRequest
            )) as AuthenticationResult;

            acquireTokenMeasurement.end({
                success: true,
                fromCache: true,
            });
            return cachedToken;
        } catch (error) {
            if (
                error instanceof BrowserAuthError &&
                error.errorCode === BrowserAuthErrorCodes.cryptoKeyNotFound
            ) {
                this.logger.verbose(
                    "Signing keypair for bound access token not found. Refreshing bound access token and generating a new crypto keypair."
                );
            }
            acquireTokenMeasurement.end({
                errorCode:
                    (error instanceof AuthError && error.errorCode) ||
                    undefined,
                subErrorCode:
                    (error instanceof AuthError && error.subError) || undefined,
                success: false,
            });
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
        azureCloudOptions?: AzureCloudOptions
    ): Promise<SilentFlowClient> {
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

        this.performanceClient.setPreQueueTime(
            PerformanceEvents.InitializeBaseRequest,
            this.correlationId
        );
        return {
            ...request,
            ...(await this.initializeBaseRequest(request, account)),
            account: account,
            forceRefresh: request.forceRefresh || false,
        };
    }
}

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StandardInteractionClient } from "./StandardInteractionClient";
import { CommonSilentFlowRequest, AuthenticationResult, SilentFlowClient, ServerTelemetryManager, AccountInfo, AzureCloudOptions, PerformanceEvents, AuthError } from "@azure/msal-common";
import { SilentRequest } from "../request/SilentRequest";
import { ApiId } from "../utils/BrowserConstants";
import { BrowserAuthError, BrowserAuthErrorMessage } from "../error/BrowserAuthError";

export class SilentCacheClient extends StandardInteractionClient {
    /**
     * Returns unexpired tokens from the cache, if available
     * @param silentRequest
     */
    async acquireToken(silentRequest: CommonSilentFlowRequest): Promise<AuthenticationResult> {
        const acquireTokenMeasurement = this.performanceClient.startMeasurement(PerformanceEvents.SilentCacheClientAcquireToken, silentRequest.correlationId);
        // Telemetry manager only used to increment cacheHits here
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenSilent_silentFlow);

        const silentAuthClient = await this.createSilentFlowClient(serverTelemetryManager, silentRequest.authority, silentRequest.azureCloudOptions);
        this.logger.verbose("Silent auth client created");

        try {
            const cachedToken = await silentAuthClient.acquireCachedToken(silentRequest);

            acquireTokenMeasurement.endMeasurement({
                success: true,
                fromCache: true
            });
            return cachedToken;
        } catch (error) {
            if (error instanceof BrowserAuthError && error.errorCode === BrowserAuthErrorMessage.signingKeyNotFoundInStorage.code) {
                this.logger.verbose("Signing keypair for bound access token not found. Refreshing bound access token and generating a new crypto keypair.");
            }
            acquireTokenMeasurement.endMeasurement({
                errorCode: error instanceof AuthError && error.errorCode || undefined,
                subErrorCode: error instanceof AuthError && error.subError || undefined,
                success: false
            });
            throw error;
        }
    }

    /**
     * Currently Unsupported
     */
    logout(): Promise<void> {
        // Synchronous so we must reject
        return Promise.reject(BrowserAuthError.createSilentLogoutUnsupportedError());
    }

    /**
     * Creates an Silent Flow Client with the given authority, or the default authority.
     * @param serverTelemetryManager
     * @param authorityUrl
     */
    protected async createSilentFlowClient(serverTelemetryManager: ServerTelemetryManager, authorityUrl?: string, azureCloudOptions?: AzureCloudOptions): Promise<SilentFlowClient> {
        // Create auth module.
        const clientConfig = await this.getClientConfiguration(serverTelemetryManager, authorityUrl, azureCloudOptions);
        return new SilentFlowClient(clientConfig, this.performanceClient);
    }

    async initializeSilentRequest(request: SilentRequest, account: AccountInfo): Promise<CommonSilentFlowRequest> {
        return {
            ...request,
            ...await this.initializeBaseRequest(request),
            account: account,
            forceRefresh: request.forceRefresh || false
        };
    }
}

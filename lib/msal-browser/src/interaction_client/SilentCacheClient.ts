/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StandardInteractionClient } from "./StandardInteractionClient";
import { CommonSilentFlowRequest, AuthenticationResult, SilentFlowClient, ServerTelemetryManager, AccountInfo } from "@azure/msal-common";
import { SilentRequest } from "../request/SilentRequest";
import { EventType } from "../event/EventType";
import { InteractionType, ApiId } from "../utils/BrowserConstants";
import { BrowserAuthError, BrowserAuthErrorMessage } from "../error/BrowserAuthError";

export class SilentCacheClient extends StandardInteractionClient {
    /**
     * Returns unexpired tokens from the cache, if available
     * @param silentRequest 
     */
    async acquireToken(silentRequest: CommonSilentFlowRequest): Promise<AuthenticationResult> {
        // Telemetry manager only used to increment cacheHits here
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenSilent_silentFlow);
        const silentAuthClient = await this.createSilentFlowClient(serverTelemetryManager, silentRequest.authority);
        this.logger.verbose("Silent auth client created");
        
        try {
            const cachedToken = await silentAuthClient.acquireCachedToken(silentRequest);
            this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Silent, cachedToken);
            return cachedToken;
        } catch (error) {
            if (error instanceof BrowserAuthError && error.errorCode === BrowserAuthErrorMessage.signingKeyNotFoundInStorage.code) {
                this.logger.verbose("Signing keypair for bound access token not found. Refreshing bound access token and generating a new crypto keypair.");
            }
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
    protected async createSilentFlowClient(serverTelemetryManager: ServerTelemetryManager, authorityUrl?: string): Promise<SilentFlowClient> {
        // Create auth module.
        const clientConfig = await this.getClientConfiguration(serverTelemetryManager, authorityUrl);
        return new SilentFlowClient(clientConfig);
    }

    initializeSilentRequest(request: SilentRequest, account: AccountInfo): CommonSilentFlowRequest {
        return {
            ...request,
            ...this.initializeBaseRequest(request),
            account: account,
            forceRefresh: request.forceRefresh || false
        };
    }
}

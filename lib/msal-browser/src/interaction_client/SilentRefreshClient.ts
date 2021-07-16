/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StandardInteractionClient } from "./StandardInteractionClient";
import { CommonSilentFlowRequest, AuthenticationResult, ServerTelemetryManager, RefreshTokenClient } from "@azure/msal-common";
import { ApiId } from "../utils/BrowserConstants";
import { version } from "../packageMetadata";
import { BrowserAuthError } from "../error/BrowserAuthError";

export class SilentRefreshClient extends StandardInteractionClient {
    /**
     * Exchanges the refresh token for new tokens
     * @param request 
     */
    async acquireToken(request: CommonSilentFlowRequest): Promise<AuthenticationResult> {
        const silentRequest: CommonSilentFlowRequest = {
            ...request,
            ...this.initializeBaseRequest(request)
        };
        this.logger = this.logger.clone(name, version, silentRequest.correlationId);
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenSilent_silentFlow, silentRequest.correlationId);
        const refreshTokenClient = await this.createRefreshTokenClient(serverTelemetryManager, silentRequest.authority, silentRequest.correlationId);
        this.logger.verbose("Refresh token client created");
        
        // Send request to renew token. Auth module will throw errors if token cannot be renewed.
        return refreshTokenClient.acquireTokenByRefreshToken(silentRequest).catch(e => {
            serverTelemetryManager.cacheFailedRequest(e);
            throw e;
        });
    }

    /**
     * Currently Unsupported
     */
    logout(): Promise<void> {
        throw BrowserAuthError.createSilentLogoutUnsupportedError();
    }

    /**
     * Creates a Refresh Client with the given authority, or the default authority.
     * @param serverTelemetryManager
     * @param authorityUrl
     */
    protected async createRefreshTokenClient(serverTelemetryManager: ServerTelemetryManager, authorityUrl?: string, correlationId?: string): Promise<RefreshTokenClient> {
        // Create auth module.
        const clientConfig = await this.getClientConfiguration(serverTelemetryManager, authorityUrl, correlationId);
        return new RefreshTokenClient(clientConfig);
    }
}

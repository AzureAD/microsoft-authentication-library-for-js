/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SilentRefreshClient } from "../SilentRefreshClient";
import { BrokerSilentRequest } from "../../broker/request/BrokerSilentRequest";
import { AuthenticationResult, AuthError, ServerTelemetryManager, BrokerRefreshTokenClient } from "@azure/msal-common";
import { ApiId } from "../../utils/BrowserConstants";

export class BrokerSilentRefreshClient extends SilentRefreshClient {
    /**
     * Exchanges the refresh token for new tokens
     * @param request 
     */
    async acquireToken(request: BrokerSilentRequest): Promise<AuthenticationResult> {
        const silentRequest: BrokerSilentRequest = {
            ...request,
            ...this.initializeBaseRequest(request)
        };
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenSilent_silentFlow);
        const refreshTokenClient = await this.createRefreshTokenClient(serverTelemetryManager, silentRequest.authority);
        this.logger.verbose("Refresh token client created");
        // Send request to renew token. Auth module will throw errors if token cannot be renewed.
        return refreshTokenClient.acquireTokenByRefreshToken(silentRequest).catch(e => {
            if (e instanceof AuthError) {
                e.setCorrelationId(this.correlationId);
            }
            serverTelemetryManager.cacheFailedRequest(e);
            throw e;
        });
    }

    /**
     * Creates a Refresh Client with the given authority, or the default authority.
     * @param authorityUrl 
     */
    protected async createRefreshTokenClient(serverTelemetryManager: ServerTelemetryManager, authorityUrl?: string): Promise<BrokerRefreshTokenClient> {
        // Create auth module.
        const clientConfig = await this.getClientConfiguration(serverTelemetryManager, authorityUrl);
        return new BrokerRefreshTokenClient(clientConfig);
    }
}

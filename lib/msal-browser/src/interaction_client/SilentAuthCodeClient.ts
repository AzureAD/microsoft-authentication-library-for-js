/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, ICrypto, Logger, CommonAuthorizationCodeRequest, AuthError, Constants, IPerformanceClient } from "@azure/msal-common";
import { StandardInteractionClient } from "./StandardInteractionClient";
import { AuthorizationUrlRequest } from "../request/AuthorizationUrlRequest";
import { BrowserConfiguration } from "../config/Configuration";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { EventHandler } from "../event/EventHandler";
import { INavigationClient } from "../navigation/INavigationClient";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { InteractionType, ApiId } from "../utils/BrowserConstants";
import { SilentHandler } from "../interaction_handler/SilentHandler";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest";
import { HybridSpaAuthorizationCodeClient } from "./HybridSpaAuthorizationCodeClient";
import { NativeMessageHandler } from "../broker/nativeBroker/NativeMessageHandler";

export class SilentAuthCodeClient extends StandardInteractionClient {
    private apiId: ApiId;

    constructor(config: BrowserConfiguration, storageImpl: BrowserCacheManager, browserCrypto: ICrypto, logger: Logger, eventHandler: EventHandler, navigationClient: INavigationClient, apiId: ApiId, performanceClient: IPerformanceClient, nativeMessageHandler?: NativeMessageHandler, correlationId?: string) {
        super(config, storageImpl, browserCrypto, logger, eventHandler, navigationClient, performanceClient, nativeMessageHandler, correlationId);
        this.apiId = apiId;
    }

    /**
     * Acquires a token silently by redeeming an authorization code against the /token endpoint
     * @param request
     */
    async acquireToken(request: AuthorizationCodeRequest): Promise<AuthenticationResult> {
        this.logger.trace("SilentAuthCodeClient.acquireToken called");

        // Auth code payload is required
        if (!request.code) {
            throw BrowserAuthError.createAuthCodeRequiredError();

        }

        // Create silent request
        const silentRequest: AuthorizationUrlRequest = await this.initializeAuthorizationRequest(request, InteractionType.Silent);
        this.browserStorage.updateCacheEntries(silentRequest.state, silentRequest.nonce, silentRequest.authority, silentRequest.loginHint || Constants.EMPTY_STRING, silentRequest.account || null);

        const serverTelemetryManager = this.initializeServerTelemetryManager(this.apiId);

        try {

            // Create auth code request (PKCE not needed)
            const authCodeRequest: CommonAuthorizationCodeRequest = {
                ...silentRequest,
                code: request.code
            };

            // Initialize the client
            const clientConfig = await this.getClientConfiguration(serverTelemetryManager, silentRequest.authority);
            const authClient: HybridSpaAuthorizationCodeClient = new HybridSpaAuthorizationCodeClient(clientConfig);
            this.logger.verbose("Auth code client created");

            // Create silent handler
            const silentHandler = new SilentHandler(authClient, this.browserStorage, authCodeRequest, this.logger, this.config.system);

            // Handle auth code parameters from request
            return silentHandler.handleCodeResponseFromServer(
                {
                    code: request.code,
                    msgraph_host: request.msGraphHost,
                    cloud_graph_host_name: request.cloudGraphHostName,
                    cloud_instance_host_name: request.cloudInstanceHostName
                },
                silentRequest.state,
                authClient.authority,
                this.networkClient,
                false
            );
        } catch (e) {
            if (e instanceof AuthError) {
                (e as AuthError).setCorrelationId(this.correlationId);
            }
            serverTelemetryManager.cacheFailedRequest(e);
            this.browserStorage.cleanRequestByState(silentRequest.state);
            throw e;
        }
    }

    /**
     * Currently Unsupported
     */
    logout(): Promise<void> {
        // Synchronous so we must reject
        return Promise.reject(BrowserAuthError.createSilentLogoutUnsupportedError());
    }
}

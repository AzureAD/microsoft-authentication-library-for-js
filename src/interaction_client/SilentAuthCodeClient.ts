/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, ICrypto, Logger, PromptValue, CommonAuthorizationCodeRequest, AuthorizationCodeClient, AuthError } from "@azure/msal-common";
import { StandardInteractionClient } from "./StandardInteractionClient";
import { AuthorizationUrlRequest } from "../request/AuthorizationUrlRequest";
import { BrowserConfiguration } from "../config/Configuration";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { EventHandler } from "../event/EventHandler";
import { INavigationClient } from "../navigation/INavigationClient";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { InteractionType, ApiId } from "../utils/BrowserConstants";
import { SilentHandler } from "../interaction_handler/SilentHandler";
import { SsoSilentRequest } from "../request/SsoSilentRequest";

export class SilentAuthCodeClient extends StandardInteractionClient {
    private apiId: ApiId;

    constructor(config: BrowserConfiguration, storageImpl: BrowserCacheManager, browserCrypto: ICrypto, logger: Logger, eventHandler: EventHandler, navigationClient: INavigationClient, apiId: ApiId, correlationId?: string) {
        super(config, storageImpl, browserCrypto, logger, eventHandler, navigationClient, correlationId);
        this.apiId = apiId;
    }
    
    /**
     * Acquires a token silently by opening a hidden iframe to the /authorize endpoint with prompt=none
     * @param request 
     */
    async acquireToken(request: SsoSilentRequest): Promise<AuthenticationResult> {
        this.logger.trace("SilentAuthCodeClient.acquireToken called");

        // Check that prompt is set to none, throw error if it is set to anything else.
        if (request.prompt && request.prompt !== PromptValue.NONE) {
            throw BrowserAuthError.createSilentPromptValueError(request.prompt);
        }

        // Auth code payload is required
        if (!request.authCodePayload || !request.authCodePayload.code) {
            throw "";
        }

        // Create silent request
        const silentRequest: AuthorizationUrlRequest = this.initializeAuthorizationRequest({
            ...request,
            prompt: PromptValue.NONE
        }, InteractionType.Silent);

        const serverTelemetryManager = this.initializeServerTelemetryManager(this.apiId);

        try {

            // Create auth code request (PKCE not needed)
            const authCodeRequest: CommonAuthorizationCodeRequest = {
                ...silentRequest,
                code: request.authCodePayload.code
            };

            // Initialize the client
            const authClient: AuthorizationCodeClient = await this.createAuthCodeClient(serverTelemetryManager, silentRequest.authority, true);
            this.logger.verbose("Auth code client created");

            // Create silent handler
            const silentHandler = new SilentHandler(authClient, this.browserStorage, authCodeRequest, this.logger, this.config.system.navigateFrameWait);

            // Handle response from hash string
            return silentHandler.handleCodeResponseFromServer(request.authCodePayload, silentRequest.state, authClient.authority, this.networkClient);
        } catch (e) {
            if (e instanceof AuthError) {
                e.setCorrelationId(this.correlationId);
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

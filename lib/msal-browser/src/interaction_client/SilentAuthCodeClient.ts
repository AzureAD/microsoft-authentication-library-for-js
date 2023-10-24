/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ICrypto,
    Logger,
    CommonAuthorizationCodeRequest,
    AuthError,
    IPerformanceClient,
    PerformanceEvents,
    invokeAsync,
} from "@azure/msal-common";
import { StandardInteractionClient } from "./StandardInteractionClient";
import { AuthorizationUrlRequest } from "../request/AuthorizationUrlRequest";
import { BrowserConfiguration } from "../config/Configuration";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { EventHandler } from "../event/EventHandler";
import { INavigationClient } from "../navigation/INavigationClient";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../error/BrowserAuthError";
import { InteractionType, ApiId } from "../utils/BrowserConstants";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest";
import { HybridSpaAuthorizationCodeClient } from "./HybridSpaAuthorizationCodeClient";
import { NativeMessageHandler } from "../broker/nativeBroker/NativeMessageHandler";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { InteractionHandler } from "../interaction_handler/InteractionHandler";

export class SilentAuthCodeClient extends StandardInteractionClient {
    private apiId: ApiId;

    constructor(
        config: BrowserConfiguration,
        storageImpl: BrowserCacheManager,
        browserCrypto: ICrypto,
        logger: Logger,
        eventHandler: EventHandler,
        navigationClient: INavigationClient,
        apiId: ApiId,
        performanceClient: IPerformanceClient,
        nativeMessageHandler?: NativeMessageHandler,
        correlationId?: string
    ) {
        super(
            config,
            storageImpl,
            browserCrypto,
            logger,
            eventHandler,
            navigationClient,
            performanceClient,
            nativeMessageHandler,
            correlationId
        );
        this.apiId = apiId;
    }

    /**
     * Acquires a token silently by redeeming an authorization code against the /token endpoint
     * @param request
     */
    async acquireToken(
        request: AuthorizationCodeRequest
    ): Promise<AuthenticationResult> {
        // Auth code payload is required
        if (!request.code) {
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.authCodeRequired
            );
        }

        // Create silent request
        const silentRequest: AuthorizationUrlRequest = await invokeAsync(
            this.initializeAuthorizationRequest.bind(this),
            PerformanceEvents.StandardInteractionClientInitializeAuthorizationRequest,
            this.logger,
            this.performanceClient,
            request.correlationId
        )(request, InteractionType.Silent);

        const serverTelemetryManager = this.initializeServerTelemetryManager(
            this.apiId
        );

        try {
            // Create auth code request (PKCE not needed)
            const authCodeRequest: CommonAuthorizationCodeRequest = {
                ...silentRequest,
                code: request.code,
            };

            // Initialize the client
            const clientConfig = await invokeAsync(
                this.getClientConfiguration.bind(this),
                PerformanceEvents.StandardInteractionClientGetClientConfiguration,
                this.logger,
                this.performanceClient,
                request.correlationId
            )(serverTelemetryManager, silentRequest.authority);
            const authClient: HybridSpaAuthorizationCodeClient =
                new HybridSpaAuthorizationCodeClient(clientConfig);
            this.logger.verbose("Auth code client created");

            // Create silent handler
            const interactionHandler = new InteractionHandler(
                authClient,
                this.browserStorage,
                authCodeRequest,
                this.logger,
                this.performanceClient
            );

            // Handle auth code parameters from request
            return invokeAsync(
                interactionHandler.handleCodeResponseFromServer.bind(
                    interactionHandler
                ),
                PerformanceEvents.HandleCodeResponseFromServer,
                this.logger,
                this.performanceClient,
                request.correlationId
            )(
                {
                    code: request.code,
                    msgraph_host: request.msGraphHost,
                    cloud_graph_host_name: request.cloudGraphHostName,
                    cloud_instance_host_name: request.cloudInstanceHostName,
                },
                silentRequest,
                false
            );
        } catch (e) {
            if (e instanceof AuthError) {
                (e as AuthError).setCorrelationId(this.correlationId);
                serverTelemetryManager.cacheFailedRequest(e);
            }
            throw e;
        }
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
}

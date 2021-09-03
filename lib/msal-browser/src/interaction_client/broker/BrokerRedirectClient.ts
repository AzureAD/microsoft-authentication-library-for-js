/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { RedirectClient } from "../RedirectClient";
import { BrokerAuthorizationCodeClient, ServerTelemetryManager, CommonAuthorizationCodeRequest, AuthError, Constants, ProtocolUtils, ScopeSet, ResponseMode } from "@azure/msal-common";
import { RedirectHandler } from "../../interaction_handler/RedirectHandler";
import { AuthorizationUrlRequest } from "../../request/AuthorizationUrlRequest";
import { InteractionType, ApiId } from "../../utils/BrowserConstants";
import { BrokerRedirectRequest } from "../../broker/request/BrokerRedirectRequest";
import { BrokerStateObject } from "../../utils/BrowserProtocolUtils";

export class BrokerRedirectClient extends RedirectClient {

    /**
     * Redirects the page to the /authorize endpoint of the IDP
     * @param request 
     */
    async acquireToken(request: BrokerRedirectRequest): Promise<void> {
        const validRequest: AuthorizationUrlRequest = this.initializeBrokeredRequest(request, InteractionType.Redirect);
        this.browserStorage.updateCacheEntries(validRequest.state, validRequest.nonce, validRequest.authority, validRequest.loginHint || "", validRequest.account || null);
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenRedirect);

        try {
            // Create auth code request and generate PKCE params
            const authCodeRequest: CommonAuthorizationCodeRequest = await this.initializeAuthorizationCodeRequest(validRequest);

            // Initialize the client
            const authClient: BrokerAuthorizationCodeClient = await this.createAuthCodeClient(serverTelemetryManager, validRequest.authority);
            this.logger.verbose("Auth code client created");

            // Create redirect interaction handler.
            const interactionHandler = new RedirectHandler(authClient, this.browserStorage, authCodeRequest, this.logger, this.browserCrypto);

            // Create acquire token url.
            const navigateUrl = await authClient.getAuthCodeUrl(validRequest);

            const redirectStartPage = this.getRedirectStartPage(request.redirectStartPage);
            this.logger.verbosePii(`Redirect start page: ${redirectStartPage}`);

            // Show the UI once the url has been created. Response will come back in the hash, which will be handled in the handleRedirectCallback function.
            return await interactionHandler.initiateAuthRequest(navigateUrl, {
                navigationClient: this.navigationClient,
                redirectTimeout: this.config.system.redirectNavigationTimeout,
                redirectStartPage: redirectStartPage,
                onRedirectNavigate: request.onRedirectNavigate
            });
        } catch (e) {
            if (e instanceof AuthError) {
                e.setCorrelationId(this.correlationId);
            }
            serverTelemetryManager.cacheFailedRequest(e);
            this.browserStorage.cleanRequestByState(validRequest.state);
            throw e;
        }
    }

    /**
     * Creates an Broker Authorization Code Client with the given authority, or the default authority.
     * @param authorityUrl 
     */
    protected async createAuthCodeClient(serverTelemetryManager: ServerTelemetryManager, authorityUrl?: string): Promise<BrokerAuthorizationCodeClient> {
        // Create auth module.
        const clientConfig = await this.getClientConfiguration(serverTelemetryManager, authorityUrl);

        return new BrokerAuthorizationCodeClient(clientConfig);
    }

    /**
     * 
     * @param embeddedRequest 
     * @param interactionType 
     */
    private initializeBrokeredRequest(embeddedRequest: BrokerRedirectRequest, interactionType: InteractionType): AuthorizationUrlRequest {
        let embeddedState: string = Constants.EMPTY_STRING;
        if (embeddedRequest.state) {
            const embeddedStateObj = ProtocolUtils.parseRequestState(this.browserCrypto, embeddedRequest.state);
            embeddedState = (embeddedStateObj && embeddedStateObj.userRequestState) || "";
        }
        const embeddedAppAuthority = embeddedRequest.authority || this.config.auth.authority;

        const baseRequestScopes = new ScopeSet(embeddedRequest.scopes || []);
        const browserState: BrokerStateObject = {
            interactionType: interactionType,
            brokeredClientId: embeddedRequest.embeddedAppClientId,
            brokeredReqAuthority: embeddedAppAuthority,
            brokeredReqScopes: baseRequestScopes.printScopes()
        };

        const brokerState = ProtocolUtils.setRequestState(
            this.browserCrypto,
            embeddedState,
            browserState
        );

        const requestNonce = embeddedRequest.nonce || this.browserCrypto.createNewGuid();
        let correlationId = this.browserCrypto.createNewGuid();
        if (!embeddedRequest.correlationId) {
            correlationId = this.browserCrypto.createNewGuid();
            this.logger.info("No correlation ID detected in request - creating new one in broker", correlationId);
            embeddedRequest.correlationId = correlationId;
        }

        this.browserStorage.updateCacheEntries(brokerState, requestNonce, embeddedAppAuthority, embeddedRequest.loginHint || "", embeddedRequest.account || null);
        return {
            ...embeddedRequest,
            state: brokerState,
            nonce: requestNonce,
            responseMode: ResponseMode.FRAGMENT,
            authority: embeddedAppAuthority,
            correlationId: correlationId,
            scopes: [...((embeddedRequest && embeddedRequest.scopes) || [])],
            redirectUri: this.getRedirectUri(embeddedRequest.redirectUri)
        };
    }
}

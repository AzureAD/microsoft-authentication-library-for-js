/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SilentIframeClient } from "../SilentIframeClient";
import { AuthenticationResult, StringUtils, PromptValue, Constants, ProtocolUtils, ScopeSet, ResponseMode, ServerTelemetryManager, BrokerAuthorizationCodeClient } from "@azure/msal-common";
import { BrowserAuthError } from "../../error/BrowserAuthError";
import { AuthorizationUrlRequest } from "../../request/AuthorizationUrlRequest";
import { InteractionType } from "../../utils/BrowserConstants";
import { BrokerStateObject } from "../../utils/BrowserProtocolUtils";
import { BrokerSsoSilentRequest } from "../../broker/request/BrokerSsoSilentRequest";

export class BrokerSilentIframeClient extends SilentIframeClient {

    /**
     * Acquires a token silently by opening a hidden iframe to the /authorize endpoint with prompt=none
     * @param request 
     */
    async acquireToken(request: BrokerSsoSilentRequest): Promise<AuthenticationResult> {
        this.logger.verbose("acquireTokenByIframe called");
        // Check that we have some SSO data
        if (StringUtils.isEmpty(request.loginHint) && StringUtils.isEmpty(request.sid) && (!request.account || StringUtils.isEmpty(request.account.username))) {
            this.logger.warning("No user hint provided. The authorization server may need more information to complete this request.");
        }

        // Check that prompt is set to none, throw error if it is set to anything else.
        if (request.prompt && request.prompt !== PromptValue.NONE) {
            throw BrowserAuthError.createSilentPromptValueError(request.prompt);
        }

        // Create silent request
        const silentRequest: AuthorizationUrlRequest = this.initializeBrokeredRequest({
            ...request,
            prompt: PromptValue.NONE
        }, InteractionType.Silent);
        return this.acquireTokenByIframe(silentRequest);
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
    private initializeBrokeredRequest(embeddedRequest: BrokerSsoSilentRequest, interactionType: InteractionType): AuthorizationUrlRequest {
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

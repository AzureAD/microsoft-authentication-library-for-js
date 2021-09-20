/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PopupClient } from "../PopupClient";
import { AuthenticationResult, BrokerAuthorizationCodeClient, ServerTelemetryManager, Constants, ProtocolUtils, ScopeSet, ResponseMode } from "@azure/msal-common";
import { PopupUtils } from "../../utils/PopupUtils";
import { InteractionType } from "../../utils/BrowserConstants";
import { BrokerPopupRequest } from "../../broker/request/BrokerPopupRequest";
import { BrokerStateObject } from "../../utils/BrowserProtocolUtils";
import { AuthorizationUrlRequest } from "../../request/AuthorizationUrlRequest";

export class BrokerPopupClient extends PopupClient {
    /**
     * Acquires tokens by opening a popup window to the /authorize endpoint of the authority
     * @param request 
     */
    acquireToken(request: BrokerPopupRequest): Promise<AuthenticationResult> {
        try {
            const validRequest = this.initializeBrokeredRequest(request, InteractionType.Popup);
            this.browserStorage.updateCacheEntries(validRequest.state, validRequest.nonce, validRequest.authority, validRequest.loginHint || "", validRequest.account || null);
            const popupName = PopupUtils.generatePopupName(this.config.auth.clientId, validRequest);
            const popupWindowAttributes = request.popupWindowAttributes || {};

            // asyncPopups flag is true. Acquires token without first opening popup. Popup will be opened later asynchronously.
            if (this.config.system.asyncPopups) {
                this.logger.verbose("asyncPopups set to true, acquiring token");
                return this.acquireTokenPopupAsync(validRequest, popupName, popupWindowAttributes);
            } else {
                // asyncPopups flag is set to false. Opens popup before acquiring token.
                this.logger.verbose("asyncPopup set to false, opening popup before acquiring token");
                const popup = PopupUtils.openSizedPopup("about:blank", popupName, popupWindowAttributes, this.logger);
                return this.acquireTokenPopupAsync(validRequest, popupName, popupWindowAttributes, popup);
            }
        } catch (e) {
            return Promise.reject(e);
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
    private initializeBrokeredRequest(embeddedRequest: BrokerPopupRequest, interactionType: InteractionType): AuthorizationUrlRequest {
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

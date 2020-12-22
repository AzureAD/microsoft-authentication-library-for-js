/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { version } from "../../../package.json";
import { BrokerAuthenticationResult, ServerTelemetryManager, AuthorizationCodeClient, BrokerAuthorizationCodeClient, BrokerRefreshTokenClient, RefreshTokenClient, AuthorizationUrlRequest, ProtocolUtils, AccountInfo } from "@azure/msal-common";
import { BrokerMessage } from "../msg/BrokerMessage";
import { BrokerMessageType, InteractionType } from "../../utils/BrowserConstants";
import { Configuration } from "../../config/Configuration";
import { BrokerHandshakeRequest } from "../msg/req/BrokerHandshakeRequest";
import { BrokerHandshakeResponse } from "../msg/resp/BrokerHandshakeResponse";
import { BrokerAuthRequest } from "../msg/req/BrokerAuthRequest";
import { BrokerRedirectResponse } from "../msg/resp/BrokerRedirectResponse";
import { BrokerAuthResponse } from "../msg/resp/BrokerAuthResponse";
import { ClientApplication } from "../../app/ClientApplication";
import { BrokerHandleRedirectRequest } from "../msg/req/BrokerHandleRedirectRequest";
import { BrowserStateObject } from "../../utils/BrowserProtocolUtils";
import { BrokerSilentRequest } from "../request/BrokerSilentRequest";
import { BrokerAuthError } from "../../error/BrokerAuthError";
import { BrokerPopupRequest } from "../request/BrokerPopupRequest";
import { BrokerRedirectRequest } from "../request/BrokerRedirectRequst";
import { BrokerSsoSilentRequest } from "../request/BrokerSsoSilentRequest";

/**
 * Broker Application class to manage brokered requests.
 */
export class BrokerClientApplication extends ClientApplication {

    private cachedBrokerResponse: Promise<BrokerAuthenticationResult>;

    constructor(configuration: Configuration) {
        super(configuration);
    }

    /**
     * 
     */
    async handleRedirectPromise(): Promise<BrokerAuthenticationResult | null> {
        this.cachedBrokerResponse = super.handleRedirectPromise() as Promise<BrokerAuthenticationResult>;
        const cachedResponse = (await this.cachedBrokerResponse) as BrokerAuthenticationResult;
        // TODO: What to do in cases of multi-account in broker?
        if (cachedResponse) {
            if (!cachedResponse.tokensToCache) {
                this.cachedBrokerResponse = undefined;
                return cachedResponse;
            }
            this.setActiveAccount(cachedResponse.account);
        }

        return null;
    }

    /**
     * Add event listener to start listening for messages to the broker.
     */
    listenForBrokerMessage(): void {
        window.addEventListener("message", this.handleBrokerMessage.bind(this));
    }

    /**
     * 
     * @param message 
     */
    private async handleBrokerMessage(message: MessageEvent): Promise<void> {
        // Check that message is a BrokerHandshakeRequest
        const clientMessage = BrokerMessage.validateMessage(message);
        if (clientMessage) {
            switch (clientMessage.data.messageType) {
                case BrokerMessageType.HANDSHAKE_REQUEST:
                    this.logger.verbose("Broker handshake request received");
                    return await this.handleBrokerHandshake(clientMessage);
                case BrokerMessageType.HANDLE_REDIRECT_REQUEST:
                    this.logger.verbose("Broker handle redirect request received");
                    return await this.handleBrokerRedirectResponse(clientMessage);
                case BrokerMessageType.AUTH_REQUEST:
                    this.logger.verbose("Broker auth request received");
                    return await this.handleBrokerAuthRequest(clientMessage);
                default:
                    return;
            }
        }
    }

    /* eslint-disable */
    /**
     * Handle a broker handshake request from a child.
     * @param clientMessage 
     */
    private async handleBrokerHandshake(clientMessage: MessageEvent): Promise<void> {
        const validMessage = BrokerHandshakeRequest.validate(clientMessage);
        this.logger.verbose(`Broker handshake validated: ${validMessage}`);
        const brokerHandshakeResponse = new BrokerHandshakeResponse(version, "");

        // @ts-ignore
        clientMessage.source.postMessage(brokerHandshakeResponse, clientMessage.origin);
        this.logger.info(`Sending handshake response: ${brokerHandshakeResponse}`);
    }

    /**
     * 
     * @param clientMessage 
     */
    private async handleBrokerRedirectResponse(clientMessage: MessageEvent): Promise<void> {
        const validMessage = BrokerHandleRedirectRequest.validate(clientMessage);
        if (validMessage) {
            // TODO: Calculate request thumbprint
            const clientPort = clientMessage.ports[0];
            const brokerResult = await this.cachedBrokerResponse;
            if (brokerResult) {
                // TODO: Replace with in-memory cache lookup
                this.cachedBrokerResponse = undefined;
                const brokerAuthResponse: BrokerAuthResponse = new BrokerAuthResponse(InteractionType.Redirect, brokerResult);
                this.logger.info(`Sending auth response: ${brokerAuthResponse}`);
                clientPort.postMessage(brokerAuthResponse);
                clientPort.close();
                return;
            } else {
                // TODO: Throw error or return null?
                const brokerAuthResponse: BrokerAuthResponse = new BrokerAuthResponse(InteractionType.Redirect, null);
                clientPort.postMessage(brokerAuthResponse);
                clientPort.close();
            }
        }
    }

    /**
     * Handle a brokered auth request from the child.
     * @param clientMessage 
     */
    private async handleBrokerAuthRequest(clientMessage: MessageEvent): Promise<void> {
        const validMessage = BrokerAuthRequest.validate(clientMessage);
        if (validMessage) {
            this.logger.verbose(`Broker auth request validated: ${validMessage}`);

            // TODO: Calculate request thumbprint
            const brokerResult = await this.cachedBrokerResponse;
            if (brokerResult && brokerResult.tokensToCache) {
                // TODO: Replace with in-memory cache lookup
                this.cachedBrokerResponse = undefined;
                const clientPort = clientMessage.ports[0];
                const brokerAuthResponse: BrokerAuthResponse = new BrokerAuthResponse(InteractionType.Redirect, brokerResult);
                this.logger.info(`Sending auth response`);
                clientPort.postMessage(brokerAuthResponse);
                clientPort.close();
                return;
            }

            const currentAccount = this.getActiveAccount();
            if (currentAccount || validMessage.request.account) {
                return this.brokeredSilentRequest(validMessage, clientMessage.ports[0], currentAccount);
            }

            switch (validMessage.interactionType) {
                case InteractionType.Silent:
                    return this.brokeredSsoSilentRequest(validMessage, clientMessage.ports[0]);
                case InteractionType.Redirect:
                case InteractionType.Popup:
                default:
                    const interactionType = this.getInteractionType(validMessage.interactionType);
                    return this.interactiveBrokerRequest(interactionType, validMessage, clientMessage);
            }
        }
    }

    /**
     * Checks default config for interaction type before returning.
     * @param messageInteractionType 
     */
    private getInteractionType(messageInteractionType: InteractionType): InteractionType {
        const brokerHasInteractionPref = !!this.config.experimental.brokerOptions.preferredInteractionType;
        return brokerHasInteractionPref ? this.config.experimental.brokerOptions.preferredInteractionType : messageInteractionType;
    }

    /**
     * 
     * @param interactionType 
     * @param validMessage 
     * @param clientMessage 
     */
    private async interactiveBrokerRequest(interactionType: InteractionType, validMessage: BrokerAuthRequest, clientMessage: MessageEvent): Promise<void> {
        switch (interactionType) {
            case InteractionType.Redirect:
                return this.brokeredRedirectRequest(validMessage, clientMessage.ports[0]);
            case InteractionType.Popup:
                return this.brokeredPopupRequest(validMessage, clientMessage.ports[0]);
            case InteractionType.Silent:
                this.logger.error("Invalid code path. interactiveBrokerRequest() should only be called for interactive requests.")
                return;
            case InteractionType.None:
                this.logger.error("Broker is blocking interactive requests. Please attempt a silent request or sign into the broker first.")
                return;
            default:
                this.logger.error("Invalid code path. interactiveBrokerRequest() should only be called for interactive requests.")
                return;
        }
    }

    /**
     * Send redirect request as the broker.
     * @param validMessage 
     * @param clientPort 
     */
    private async brokeredRedirectRequest(validMessage: BrokerAuthRequest, clientPort: MessagePort): Promise<void> {
        const brokerRedirectResp = new BrokerRedirectResponse();
        // @ts-ignore
        clientPort.postMessage(brokerRedirectResp);
        clientPort.close();
        this.logger.info(`Sending redirect response: ${brokerRedirectResp}`);

        const redirectRequest = validMessage.request as BrokerRedirectRequest;
        redirectRequest.redirectUri = validMessage.embeddedAppOrigin;
        redirectRequest.embeddedAppClientId = validMessage.embeddedClientId;
        redirectRequest.brokerRedirectUri = this.getRedirectUri();

        const validatedBrokerRequest = this.initializeBrokeredRequest(redirectRequest, InteractionType.Redirect, validMessage.embeddedAppOrigin);

        // Call loginRedirect
        this.acquireTokenRedirectAsync(validatedBrokerRequest, this.config.experimental.brokerOptions.brokerRedirectStartPage, this.config.experimental.brokerOptions.onBrokerRedirectNavigate);
    }

    /**
     * Send popup request as the broker.
     * @param validMessage 
     * @param clientPort 
     */
    private async brokeredPopupRequest(validMessage: BrokerAuthRequest, clientPort: MessagePort): Promise<void> {
        try {
            const popupRequest = validMessage.request as BrokerPopupRequest;
            popupRequest.redirectUri = validMessage.embeddedAppOrigin;
            popupRequest.embeddedAppClientId = validMessage.embeddedClientId;
            popupRequest.brokerRedirectUri = this.getRedirectUri();
            const validatedBrokerRequest = this.initializeBrokeredRequest(popupRequest, InteractionType.Popup, validMessage.embeddedAppOrigin);
            const response = (await this.acquireTokenPopupAsync(validatedBrokerRequest)) as BrokerAuthenticationResult;
            const brokerAuthResponse: BrokerAuthResponse = new BrokerAuthResponse(InteractionType.Popup, response);
            this.logger.info(`Sending auth response`);
            clientPort.postMessage(brokerAuthResponse);
            clientPort.close();
        } catch (err) {
            const brokerAuthResponse = new BrokerAuthResponse(InteractionType.Popup, null, err);
            this.logger.info(`Found auth error: ${err}`);
            clientPort.postMessage(brokerAuthResponse);
            clientPort.close();
        }
    }

    /**
     * 
     * @param validMessage 
     * @param clientPort 
     */
    private async brokeredSsoSilentRequest(validMessage: BrokerAuthRequest, clientPort: MessagePort): Promise<void> {
        try {
            const silentRequest = validMessage.request as BrokerSsoSilentRequest;
            silentRequest.redirectUri = validMessage.embeddedAppOrigin;
            silentRequest.embeddedAppClientId = validMessage.embeddedClientId;
            silentRequest.brokerRedirectUri = this.getRedirectUri();
            const brokeredSilentRequest = this.initializeBrokeredRequest(silentRequest, InteractionType.Silent, validMessage.embeddedAppOrigin);
            const response: BrokerAuthenticationResult = (await this.acquireTokenByIframe(brokeredSilentRequest)) as BrokerAuthenticationResult;
            const brokerAuthResponse: BrokerAuthResponse = new BrokerAuthResponse(InteractionType.Popup, response);
            this.logger.info(`Sending auth response`);
            clientPort.postMessage(brokerAuthResponse);
            clientPort.close();
        } catch (err) {
            const brokerAuthResponse = new BrokerAuthResponse(InteractionType.Silent, null, err);
            this.logger.info(`Found auth error: ${err}`);
            clientPort.postMessage(brokerAuthResponse);
            clientPort.close();
        }
    }

    /**
     * Send silent renewal request as the broker.
     * @param validMessage 
     * @param clientPort 
     */
    private async brokeredSilentRequest(validMessage: BrokerAuthRequest, clientPort: MessagePort, account?: AccountInfo): Promise<void> {
        try {
            const silentRequest = validMessage.request as BrokerSilentRequest;
            silentRequest.embeddedAppClientId = validMessage.embeddedClientId;
            silentRequest.embeddedAppRedirectUri = validMessage.embeddedAppOrigin;
            if (!silentRequest.account) {
                silentRequest.account = account;
            }
            const response = (await this.acquireTokenByRefreshToken(silentRequest)) as BrokerAuthenticationResult;
            const brokerAuthResponse: BrokerAuthResponse = new BrokerAuthResponse(InteractionType.Silent, response);
            if (brokerAuthResponse.result.tokensToCache) {
                this.logger.info(`Sending auth response`);
                clientPort.postMessage(brokerAuthResponse);
                clientPort.close();
            } else {
                const noTokensErr = BrokerAuthError.createNoTokensToCacheError();
                const brokerAuthResponse = new BrokerAuthResponse(InteractionType.Silent, null, noTokensErr);
                this.logger.info(`${noTokensErr}`);
                clientPort.postMessage(brokerAuthResponse);
                clientPort.close();
            }
        } catch (err) {
            const brokerAuthResponse = new BrokerAuthResponse(InteractionType.Silent, null, err);
            this.logger.info(`Found auth error: ${err}`);
            clientPort.postMessage(brokerAuthResponse);
            clientPort.close();
        }
    }

    /**
     * Creates an Broker Authorization Code Client with the given authority, or the default authority.
     * @param authorityUrl 
     */
    protected async createAuthCodeClient(serverTelemetryManager: ServerTelemetryManager, authorityUrl?: string): Promise<AuthorizationCodeClient> {
        // Create auth module.
        const clientConfig = await this.getClientConfiguration(serverTelemetryManager, authorityUrl);
        
        return new BrokerAuthorizationCodeClient(clientConfig);
    }

    /**
     * Creates a Refresh Client with the given authority, or the default authority.
     * @param authorityUrl 
     */
    protected async createRefreshTokenClient(serverTelemetryManager: ServerTelemetryManager, authorityUrl?: string): Promise<RefreshTokenClient> {
        // Create auth module.
        const clientConfig = await this.getClientConfiguration(serverTelemetryManager, authorityUrl);
        return new BrokerRefreshTokenClient(clientConfig);
    }

    private initializeBrokeredRequest(embeddedRequest: AuthorizationUrlRequest, interactionType: InteractionType, messageOrigin: string): AuthorizationUrlRequest {
        let embeddedState: string;
        if (embeddedRequest.state) {
            const embeddedStateObj = ProtocolUtils.parseRequestState(this.browserCrypto, embeddedRequest.state);
            embeddedState = (embeddedStateObj && embeddedStateObj.userRequestState) || "";
        }

        const browserState: BrowserStateObject = {
            interactionType: interactionType,
            brokeredOrigin: messageOrigin
        };

        const brokerState = ProtocolUtils.setRequestState(
            this.browserCrypto,
            embeddedState,
            browserState
        );

        this.browserStorage.updateCacheEntries(brokerState, embeddedRequest.nonce, embeddedRequest.authority);
        return {
            ...embeddedRequest,
            state: brokerState
        };
    }
}

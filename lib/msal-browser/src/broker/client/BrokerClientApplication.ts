/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { version } from "../../packageMetadata";
import { BrokerAuthenticationResult, ServerTelemetryManager, AuthorizationCodeClient, BrokerAuthorizationCodeClient, BrokerRefreshTokenClient, RefreshTokenClient, ProtocolUtils, ScopeSet, AccountInfo, RequestThumbprint, Constants } from "@azure/msal-common";
import { BrokerMessage } from "../msg/BrokerMessage";
import { BrokerMessageType, InteractionType, ApiId } from "../../utils/BrowserConstants";
import { Configuration } from "../../config/Configuration";
import { BrokerHandshakeRequest } from "../msg/req/BrokerHandshakeRequest";
import { BrokerHandshakeResponse } from "../msg/resp/BrokerHandshakeResponse";
import { BrokerAuthRequest } from "../msg/req/BrokerAuthRequest";
import { BrokerRedirectResponse } from "../msg/resp/BrokerRedirectResponse";
import { BrokerAuthResponse } from "../msg/resp/BrokerAuthResponse";
import { BrokerHandleRedirectRequest } from "../msg/req/BrokerHandleRedirectRequest";
import { BrokerSilentRequest } from "../request/BrokerSilentRequest";
import { BrokerAuthError } from "../../error/BrokerAuthError";
import { BrokerPopupRequest } from "../request/BrokerPopupRequest";
import { BrokerRedirectRequest } from "../request/BrokerRedirectRequest";
import { BrokerSsoSilentRequest } from "../request/BrokerSsoSilentRequest";
import { AuthorizationUrlRequest } from "../../request/AuthorizationUrlRequest";
import { BrokerStateObject } from "../../utils/BrowserProtocolUtils";
import { PublicClientApplication } from "../../app/PublicClientApplication";
import { ExperimentalBrowserConfiguration, ExperimentalConfiguration, buildExperimentalConfiguration } from "../../config/ExperimentalConfiguration";
import { RedirectClient } from "../../interaction_client/RedirectClient";
import { PopupClient } from "../../interaction_client/PopupClient";
import { SilentIframeClient } from "../../interaction_client/SilentIframeClient";
import { BrokerInteractionClient } from "../../interaction_client/BrokerInteractionClient";

/**
 * Broker Application class to manage brokered requests.
 */
export class BrokerClientApplication extends PublicClientApplication {

    // Current promise which is processing the hash in the url response, trading for tokens, and caching the brokered response in memory.
    private currentBrokerRedirectResponse?: Promise<BrokerAuthenticationResult | null>;
    private experimentalConfig: ExperimentalBrowserConfiguration;

    constructor(configuration: Configuration, experimentalConfiguration: ExperimentalConfiguration) {
        super(configuration);

        this.currentBrokerRedirectResponse = undefined;
        this.experimentalConfig = buildExperimentalConfiguration(experimentalConfiguration);
    }

    /**
     * Event handler function which allows users to fire events after the PublicClientApplication object
     * has loaded during redirect flows. This should be invoked on all page loads involved in redirect
     * auth flows.
     * @param hash Hash to process. Defaults to the current value of window.location.hash. Only needs to be provided explicitly if the response to be handled is not contained in the current value.
     * @returns {Promise.<AuthenticationResult | null>} token response or null. If the return value is null, then no auth redirect was detected.
     */
    async handleRedirectPromise(hash?: string): Promise<BrokerAuthenticationResult | null> {
        // Begin processing hash and trading for tokens.
        const brokerResponse = super.handleRedirectPromise(hash) as Promise<BrokerAuthenticationResult>;
        // Wait for response and caching, save promise.
        this.currentBrokerRedirectResponse = this.waitForBrokeredResponse(brokerResponse);
        // Wait until response is finished and clear the saved promise.
        const redirectResponse = await this.currentBrokerRedirectResponse;
        this.currentBrokerRedirectResponse = undefined;
        // Return the response ONLY if it is meant for the broker, otherwise return null.
        return (redirectResponse && !redirectResponse.tokensToCache) ? redirectResponse : null;
    }

    /**
     * Waits for the brokered response to finish and then checks if it needs to cache this response in internal memory.
     * @param brokerResponse 
     */
    private async waitForBrokeredResponse(brokerResponse: Promise<BrokerAuthenticationResult>): Promise<BrokerAuthenticationResult | null> {
        // Wait for hash to be processed and tokens to be returned.
        const cachedResponse: BrokerAuthenticationResult = await brokerResponse;
        if (cachedResponse) {
            if (!cachedResponse.tokensToCache) {
                // If cached response does not have tokensToCache, it is meant for the broker, so return without caching.
                return cachedResponse;
            }
            // Cache response with the thumbprint of the request
            this.browserStorage.setMemoryCache(this.browserStorage.generateBrokerResponseKey(cachedResponse.responseThumbprint), JSON.stringify(cachedResponse));
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
     * Handles a general broker message by checking the message type and calling the relevant API.
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
        // TODO: Add broker origin here
        const brokerHandshakeResponse = new BrokerHandshakeResponse(version, "");

        // @ts-ignore
        clientMessage.source.postMessage(brokerHandshakeResponse, clientMessage.origin);
        this.logger.info(`Sending handshake response to ${clientMessage.origin}`);
    }

    /**
     * Returns a response that is relevant to the embedded application if handleRedirectPromise() was called from the embedded application.
     * @param clientMessage 
     */
    private async handleBrokerRedirectResponse(clientMessage: MessageEvent): Promise<void> {
        const validMessage = BrokerHandleRedirectRequest.validate(clientMessage);
        if (validMessage) {
            const clientPort = clientMessage.ports[0];
            // If a current broker redirect response is in progress, wait for it to complete before proceeding with the brokered request.
            if (this.currentBrokerRedirectResponse) {
                await this.currentBrokerRedirectResponse;
            }

            // Get cached response from in-memory storage that matches given origin.
            const cachedBrokerResponse = this.browserStorage.getBrokerResponseByOrigin(clientMessage.origin);
            if (cachedBrokerResponse) {
                // If response is retrieved, parse and return to embedded application.
                const brokerResponse = JSON.parse(cachedBrokerResponse) as BrokerAuthenticationResult;
                const clientPort = clientMessage.ports[0];
                const brokerAuthResponse: BrokerAuthResponse = new BrokerAuthResponse(InteractionType.Redirect, brokerResponse);
                this.logger.infoPii(`Sending auth response`);
                clientPort.postMessage(brokerAuthResponse);
                clientPort.close();
                return;
            } else {
                // If no response is retrieved, return null.
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
            if (!validMessage.request.authority || !validMessage.request.scopes) {
                throw BrokerAuthError.createBrokerRequestIncompleteError();
            }

            this.logger.verbose(`Broker auth request validated: ${validMessage}`);
            // If a current broker redirect response is in progress, wait for it to complete before proceeding with the brokered request.
            if (this.currentBrokerRedirectResponse) {
                await this.currentBrokerRedirectResponse;
            }

            // Generate request thumbprint to lookup a request from the in-memory cache.
            const reqThumbprint: RequestThumbprint = {
                authority: validMessage.request.authority,
                clientId: validMessage.embeddedClientId,
                scopes: validMessage.request.scopes
            };

            // Lookup broker response by thumbprint and origin of the embedded app
            const cachedBrokerResponse = this.browserStorage.getBrokerResponseByThumbprint(reqThumbprint, validMessage.embeddedAppOrigin);
            if (cachedBrokerResponse) {
                // If found, return response back to embedded application.
                const brokerResponse = JSON.parse(cachedBrokerResponse) as BrokerAuthenticationResult;
                const clientPort = clientMessage.ports[0];
                const brokerAuthResponse: BrokerAuthResponse = new BrokerAuthResponse(InteractionType.Redirect, brokerResponse);
                this.logger.infoPii(`Sending auth response`);
                clientPort.postMessage(brokerAuthResponse);
                clientPort.close();
                return;
            }

            // Get the currently set active account, and attempt a silent request if there is one set (or one is provided in the request)
            const currentAccount = this.getActiveAccount() || validMessage.request.account;
            if (currentAccount) {
                return this.brokeredSilentRequest(validMessage, clientMessage.ports[0], currentAccount);
            }

            // Check the message interaction type and perform the appropriate brokered request.
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
        const configuredPreferredType = this.experimentalConfig.brokerOptions.preferredInteractionType;;
        return configuredPreferredType ? configuredPreferredType : messageInteractionType;
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
        try {
            // Inform embedded application that a redirect will occur
            const brokerRedirectResp = new BrokerRedirectResponse();
            // @ts-ignore
            clientPort.postMessage(brokerRedirectResp);
            clientPort.close();
            this.logger.info(`Sending redirect response: ${brokerRedirectResp}`);
            
            
            // Initialize the brokered redirect request with the required parameters.
            const redirectRequest = validMessage.request as BrokerRedirectRequest;
            const redirectClient = new RedirectClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, redirectRequest.correlationId);
            redirectRequest.redirectUri = validMessage.embeddedAppOrigin;
            redirectRequest.embeddedAppClientId = validMessage.embeddedClientId;
            redirectRequest.brokerRedirectUri = redirectClient.getRedirectUri();
            redirectRequest.redirectStartPage = this.experimentalConfig.brokerOptions.brokerRedirectParams?.redirectStartPage;
            redirectRequest.onRedirectNavigate = this.experimentalConfig.brokerOptions.brokerRedirectParams?.onRedirectNavigate;
            
            // Update parameters in request with required broker parameters
            const validatedBrokerRequest = this.initializeBrokeredRequest(redirectRequest, InteractionType.Redirect, validMessage.embeddedAppOrigin);
            
            // Call redirectClient.acquireToken()
            return redirectClient.acquireToken(validatedBrokerRequest);
            
        } catch (err) {
            const brokerAuthResponse = new BrokerAuthResponse(InteractionType.Popup, null, err);
            this.logger.info(`Found auth error in popup: ${err}`);
            clientPort.postMessage(brokerAuthResponse);
            clientPort.close();
        }
    }

    /**
     * Send popup request as the broker.
     * @param validMessage 
     * @param clientPort 
     */
    private async brokeredPopupRequest(validMessage: BrokerAuthRequest, clientPort: MessagePort): Promise<void> {
        try {
            // Initialize the brokered popup request with required parameters
            const popupRequest = validMessage.request as BrokerPopupRequest;
            const popupClient = new PopupClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, popupRequest.correlationId);
            popupRequest.redirectUri = validMessage.embeddedAppOrigin;
            popupRequest.embeddedAppClientId = validMessage.embeddedClientId;
            popupRequest.brokerRedirectUri = popupClient.getRedirectUri();
            
            // Update parameters in request with required broker parameters
            const validatedBrokerRequest = this.initializeBrokeredRequest(popupRequest, InteractionType.Popup, validMessage.embeddedAppOrigin);

            // Call acquireTokenPopup() and send the response back to the embedded application. 
            const response = (await popupClient.acquireTokenPopupAsync(validatedBrokerRequest, "")) as BrokerAuthenticationResult;
            const brokerAuthResponse: BrokerAuthResponse = new BrokerAuthResponse(InteractionType.Popup, response);
            this.logger.infoPii(`Sending auth response`);
            clientPort.postMessage(brokerAuthResponse);
            clientPort.close();
        } catch (err) {
            const brokerAuthResponse = new BrokerAuthResponse(InteractionType.Popup, null, err);
            this.logger.info(`Found auth error in popup: ${err}`);
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
            // Initialize the brokered silent iframe request with required parameters
            const silentRequest = validMessage.request as BrokerSsoSilentRequest;
            const silentIframeClient = new SilentIframeClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, ApiId.ssoSilent, silentRequest.correlationId);
            silentRequest.redirectUri = validMessage.embeddedAppOrigin;
            silentRequest.embeddedAppClientId = validMessage.embeddedClientId;
            silentRequest.brokerRedirectUri = silentIframeClient.getRedirectUri();

            // Update parameters in request with required broker parameters
            const brokeredSilentRequest = this.initializeBrokeredRequest(silentRequest, InteractionType.Silent, validMessage.embeddedAppOrigin);

            // Call ssoSilent() and send the response back to the embedded application. 
            const response: BrokerAuthenticationResult = (await silentIframeClient.acquireTokenByIframe(brokeredSilentRequest)) as BrokerAuthenticationResult;
            const brokerAuthResponse: BrokerAuthResponse = new BrokerAuthResponse(InteractionType.Silent, response);
            this.logger.infoPii(`Sending auth response`);
            clientPort.postMessage(brokerAuthResponse);
            clientPort.close();
        } catch (err) {
            const brokerAuthResponse = new BrokerAuthResponse(InteractionType.Silent, null, err);
            this.logger.info(`Found auth error in ssoSilent: ${err}`);
            clientPort.postMessage(brokerAuthResponse);
            clientPort.close();
        }
    }

    /**
     * Send silent renewal request as the broker.
     * @param validMessage 
     * @param clientPort 
     */
    private async brokeredSilentRequest(validMessage: BrokerAuthRequest, clientPort: MessagePort, account: AccountInfo): Promise<void> {
        try {
            // Initialize the brokered silent request with required parameters
            const silentRequest = validMessage.request as BrokerSilentRequest;
            silentRequest.embeddedAppClientId = validMessage.embeddedClientId;
            silentRequest.embeddedAppRedirectUri = validMessage.embeddedAppOrigin;
            if (!silentRequest.account) {
                silentRequest.account = account;
            }

            // Call acquireTokenByRefreshToken() to get a new set of tokens for the embedded app
            const response = (await this.acquireTokenByRefreshToken(silentRequest)) as BrokerAuthenticationResult;
            // Check whether response contains tokens for the child to cache, and sends the response. Otherwise, sends an error back to the child app.
            const brokerAuthResponse: BrokerAuthResponse = new BrokerAuthResponse(InteractionType.Silent, response);
            if (brokerAuthResponse.result && brokerAuthResponse.result.tokensToCache) {
                this.logger.infoPii(`Sending auth response: ${JSON.stringify(brokerAuthResponse)}`);
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
            this.logger.info(`Found auth error in silent: ${err}`);
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
        const brokerInteractionClient = new BrokerInteractionClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, this.experimentalConfig);
        const clientConfig = await brokerInteractionClient.getClientConfiguration(serverTelemetryManager, authorityUrl);

        return new BrokerAuthorizationCodeClient(clientConfig);
    }

    /**
     * Creates a Refresh Client with the given authority, or the default authority.
     * @param authorityUrl 
     */
    protected async createRefreshTokenClient(serverTelemetryManager: ServerTelemetryManager, authorityUrl?: string): Promise<RefreshTokenClient> {
        // Create auth module.
        const brokerInteractionClient = new BrokerInteractionClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, this.experimentalConfig);
        const clientConfig = await brokerInteractionClient.getClientConfiguration(serverTelemetryManager, authorityUrl);
        return new BrokerRefreshTokenClient(clientConfig);
    }

    /**
     * Adds required parameters for broker to state object in request.
     * @param embeddedRequest 
     * @param interactionType 
     * @param messageOrigin 
     */
    private initializeBrokeredRequest(embeddedRequest: BrokerRedirectRequest|BrokerPopupRequest|BrokerSsoSilentRequest, interactionType: InteractionType, messageOrigin: string): AuthorizationUrlRequest {
        let embeddedState: string = Constants.EMPTY_STRING;
        if (embeddedRequest.state) {
            const embeddedStateObj = ProtocolUtils.parseRequestState(this.browserCrypto, embeddedRequest.state);
            embeddedState = (embeddedStateObj && embeddedStateObj.userRequestState) || "";
        }

        const baseRequestScopes = new ScopeSet(embeddedRequest.scopes || []);
        const browserState: BrokerStateObject = {
            interactionType: interactionType,
            brokeredClientId: embeddedRequest.embeddedAppClientId,
            brokeredReqAuthority: embeddedRequest.authority,
            brokeredReqScopes: baseRequestScopes.printScopes()
        };

        const brokerState = ProtocolUtils.setRequestState(
            this.browserCrypto,
            embeddedState,
            browserState
        );

        const requestNonce = embeddedRequest.nonce || this.browserCrypto.createNewGuid();

        this.browserStorage.updateCacheEntries(brokerState, requestNonce, embeddedRequest.authority, embeddedRequest.loginHint || "", embeddedRequest.account || null);
        return {
            ...embeddedRequest,
            state: brokerState,
            nonce: requestNonce
        };
    }
}

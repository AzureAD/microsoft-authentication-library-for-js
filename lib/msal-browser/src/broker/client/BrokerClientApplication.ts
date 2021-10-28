/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { version } from "../../packageMetadata";
import { BrokerAuthenticationResult, AccountInfo, RequestThumbprint, ServerError, InteractionRequiredAuthError, AuthenticationResult, Constants } from "@azure/msal-common";
import { BrokerMessage } from "../msg/BrokerMessage";
import { BrokerMessageType, InteractionType, ApiId, BrowserConstants, TemporaryCacheKeys } from "../../utils/BrowserConstants";
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
import { PublicClientApplication } from "../../app/PublicClientApplication";
import { ExperimentalBrowserConfiguration, ExperimentalConfiguration, buildExperimentalConfiguration, BrokerInitializationOptions } from "../../config/ExperimentalConfiguration";
import { BrokerRedirectClient } from "../../interaction_client/broker/BrokerRedirectClient";
import { BrokerPopupClient } from "../../interaction_client/broker/BrokerPopupClient";
import { BrokerSilentIframeClient } from "../../interaction_client/broker/BrokerSilentIframeClient";
import { EventType } from "../../event/EventType";
import { BrowserUtils } from "../../utils/BrowserUtils";
import { BrokerSilentRefreshClient } from "../../interaction_client/broker/BrokerSilentRefreshClient";

/**
 * Broker Application class to manage brokered requests.
 */
export class BrokerClientApplication extends PublicClientApplication {

    // Current promise which is processing the hash in the url response, trading for tokens, and caching the brokered response in memory.
    private currentBrokerRedirectResponse?: Promise<BrokerAuthenticationResult | null>;
    private hybridAuthPromise?: Promise<AuthenticationResult>;
    private experimentalConfig: ExperimentalBrowserConfiguration;

    constructor(configuration: Configuration, experimentalConfiguration: ExperimentalConfiguration) {
        super(configuration);

        this.currentBrokerRedirectResponse = undefined;
        this.hybridAuthPromise = undefined;
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
        const brokerResponse = this.handleBrokerRedirect(hash) as Promise<BrokerAuthenticationResult>;
        // Wait for response and caching, save promise.
        this.currentBrokerRedirectResponse = this.waitForBrokeredResponse(brokerResponse);
        // Wait until response is finished and clear the saved promise.
        const redirectResponse = await this.currentBrokerRedirectResponse;
        this.currentBrokerRedirectResponse = undefined;
        // Return the response ONLY if it is meant for the broker, otherwise return null.
        return (redirectResponse && !redirectResponse.tokensToCache) ? redirectResponse : null;
    }

    private async handleBrokerRedirect(hash?: string): Promise<AuthenticationResult | null> {
        this.eventHandler.emitEvent(EventType.HANDLE_REDIRECT_START, InteractionType.Redirect);
        this.logger.verbose("handleRedirectPromise called");
        const loggedInAccounts = this.getAllAccounts();
        if (this.isBrowserEnvironment) {
            /**
             * Store the promise on the PublicClientApplication instance if this is the first invocation of handleRedirectPromise,
             * otherwise return the promise from the first invocation. Prevents race conditions when handleRedirectPromise is called
             * several times concurrently.
             */
            const redirectResponseKey = hash || Constants.EMPTY_STRING;
            let response = this.redirectResponse.get(redirectResponseKey);
            if (typeof response === "undefined") {
                this.logger.verbose("handleRedirectPromise has been called for the first time, storing the promise");
                const correlationId = this.browserStorage.getTemporaryCache(TemporaryCacheKeys.CORRELATION_ID, true) || "";
                const redirectClient = new BrokerRedirectClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, correlationId);
                response = redirectClient.handleRedirectPromise(hash)
                    .then((result: AuthenticationResult | null) => {
                        if (result) {
                            // Emit login event if number of accounts change
                            const isLoggingIn = loggedInAccounts.length < this.getAllAccounts().length;
                            if (isLoggingIn) {
                                this.eventHandler.emitEvent(EventType.LOGIN_SUCCESS, InteractionType.Redirect, result);
                                this.logger.verbose("handleRedirectResponse returned result, login success");
                            } else {
                                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Redirect, result);
                                this.logger.verbose("handleRedirectResponse returned result, acquire token success");
                            }
                        }
                        this.eventHandler.emitEvent(EventType.HANDLE_REDIRECT_END, InteractionType.Redirect);
                        return result;
                    })
                    .catch((e) => {
                    // Emit login event if there is an account
                        if (loggedInAccounts.length > 0) {
                            this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Redirect, null, e);
                        } else {
                            this.eventHandler.emitEvent(EventType.LOGIN_FAILURE, InteractionType.Redirect, null, e);
                        }
                        this.eventHandler.emitEvent(EventType.HANDLE_REDIRECT_END, InteractionType.Redirect);
                        throw e;
                    });
                this.redirectResponse.set(redirectResponseKey, response);
            } else {
                this.logger.verbose("handleRedirectPromise has been called previously, returning the result from the first call");
            }
            
            return response;
        }
        this.logger.verbose("handleRedirectPromise returns null, not browser environment");
        return null;
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
    async listenForBrokerMessage(options?: BrokerInitializationOptions): Promise<AuthenticationResult|undefined> {
        window.addEventListener("message", this.handleBrokerMessage.bind(this));
        if (options && options.codeRequest) {
            this.hybridAuthPromise = this.acquireTokenByCode(options.codeRequest);
        }

        return this.hybridAuthPromise;
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
        const brokerHandshakeResponse = new BrokerHandshakeResponse(version, "");

        if (this.hybridAuthPromise) {
            try { 
                await this.hybridAuthPromise;
            } catch (e) {
                this.logger.error(`Broker could obtain tokens use authorization code initializer: ${e}`)
            }
        }

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
            if (validMessage.request.account) {
                return this.brokeredSilentRequest(validMessage, clientMessage.ports[0], validMessage.request.account);
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
            const redirectClient = new BrokerRedirectClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, redirectRequest.correlationId);
            redirectRequest.redirectUri = validMessage.embeddedAppOrigin;
            redirectRequest.embeddedAppClientId = validMessage.embeddedClientId;
            redirectRequest.brokerRedirectUri = redirectClient.getRedirectUri();
            redirectRequest.redirectStartPage = this.experimentalConfig.brokerOptions.brokerRedirectParams?.redirectStartPage;
            redirectRequest.onRedirectNavigate = this.experimentalConfig.brokerOptions.brokerRedirectParams?.onRedirectNavigate;
            
            // Call redirectClient.acquireToken()
            return redirectClient.acquireToken(redirectRequest);
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
            const popupClient = new BrokerPopupClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, popupRequest.correlationId);
            popupRequest.redirectUri = validMessage.embeddedAppOrigin;
            popupRequest.embeddedAppClientId = validMessage.embeddedClientId;
            popupRequest.brokerRedirectUri = popupClient.getRedirectUri();
            
            // Call acquireTokenPopup() and send the response back to the embedded application. 
            const response = (await popupClient.acquireToken(popupRequest)) as BrokerAuthenticationResult;
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
            const silentIframeClient = new BrokerSilentIframeClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, ApiId.ssoSilent, silentRequest.correlationId);
            silentRequest.redirectUri = validMessage.embeddedAppOrigin;
            silentRequest.embeddedAppClientId = validMessage.embeddedClientId;
            silentRequest.brokerRedirectUri = silentIframeClient.getRedirectUri();
            // Call ssoSilent() and send the response back to the embedded application. 
            const response: BrokerAuthenticationResult = (await silentIframeClient.acquireToken(silentRequest)) as BrokerAuthenticationResult;
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
     * Use this function to obtain a token before every call to the API / resource provider
     *
     * MSAL return's a cached token when available
     * Or it send's a request to the STS to obtain a new token using a refresh token.
     *
     * @param {@link SilentRequest}
     *
     * To renew idToken, please pass clientId as the only scope in the Authentication Parameters
     * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
     */
     protected async acquireTokenByRefreshToken(request: BrokerSilentRequest): Promise<AuthenticationResult> {
        this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_NETWORK_START, InteractionType.Silent, request);
        // block the reload if it occurred inside a hidden iframe
        BrowserUtils.blockReloadInHiddenIframes();

        const silentRefreshClient = new BrokerSilentRefreshClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, request.correlationId);

        return silentRefreshClient.acquireToken(request).catch(e => {
            const isServerError = e instanceof ServerError;
            const isInteractionRequiredError = e instanceof InteractionRequiredAuthError;
            const isInvalidGrantError = (e.errorCode === BrowserConstants.INVALID_GRANT_ERROR);
            if (isServerError && isInvalidGrantError && !isInteractionRequiredError) {
                this.logger.verbose("Refresh token expired or invalid, attempting acquire token by iframe", request.correlationId);

                const silentIframeClient = new BrokerSilentIframeClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, ApiId.acquireTokenSilent_authCode);
                return silentIframeClient.acquireToken({
                    ...request,
                    brokerRedirectUri: silentRefreshClient.getRedirectUri()
                });
            }
            throw e;
        });
    }

    
}

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo, AuthenticationResult } from "@azure/msal-common";
import { BrokerClientApplication } from "../broker/client/BrokerClientApplication";
import { EmbeddedClientApplication } from "../broker/client/EmbeddedClientApplication";
import { Configuration } from "../config/Configuration";
import { EventType } from "../event/EventType";
import { PopupRequest } from "../request/PopupRequest";
import { SilentRequest } from "../request/SilentRequest";
import { SsoSilentRequest } from "../request/SsoSilentRequest";
import { ApiId, InteractionType } from "../utils/BrowserConstants";
import { BrowserUtils } from "../utils/BrowserUtils";
import { IPublicClientApplication } from "./IPublicClientApplication";
import { PublicClientApplication } from "./PublicClientApplication";
import { ExperimentalBrowserConfiguration, ExperimentalConfiguration, buildExperimentalConfiguration } from "../config/ExperimentalConfiguration";
import { PopupClient } from "../interaction_client/PopupClient";
import { EmbeddedInteractionClient } from "../interaction_client/broker/EmbeddedInteractionClient";
import { SilentIframeClient } from "../interaction_client/SilentIframeClient";
import { SilentCacheClient } from "../interaction_client/SilentCacheClient";

export class ExperimentalPublicClientApplication extends PublicClientApplication implements IPublicClientApplication {

    // Broker Objects
    protected embeddedApp?: EmbeddedClientApplication;
    protected broker?: BrokerClientApplication;
    protected experimentalConfig: ExperimentalBrowserConfiguration;

    constructor(configuration: Configuration, experimentalConfiguration: ExperimentalConfiguration) {
        super(configuration);
        this.experimentalConfig = buildExperimentalConfiguration(experimentalConfiguration);
    }

    /**
     * 
     */
    async initializeBrokering(): Promise<void> {
        if (!this.isBrowserEnvironment) {
            return;
        }

        if (this.experimentalConfig.brokerOptions.actAsBroker && !BrowserUtils.isInIframe()) {
            if(this.experimentalConfig.brokerOptions.allowBrokering) {
                this.logger.verbose("Running in top frame and both actAsBroker, allowBrokering flags set to true. actAsBroker takes precedence.");
            }

            this.broker = new BrokerClientApplication(this.config, this.experimentalConfig);
            this.logger.verbose("Acting as Broker");
            this.broker.listenForBrokerMessage();
        } else if (this.experimentalConfig.brokerOptions.allowBrokering) {
            this.embeddedApp = new EmbeddedClientApplication(this.config.auth.clientId, this.experimentalConfig.brokerOptions, this.logger, this.browserStorage);
            this.logger.verbose("Acting as child");
            await this.embeddedApp.initiateHandshake();
        }
    }

    /**
     * Event handler function which allows users to fire events after the PublicClientApplication object
     * has loaded during redirect flows. This should be invoked on all page loads involved in redirect
     * auth flows.
     * @param hash Hash to process. Defaults to the current value of window.location.hash. Only needs to be provided explicitly if the response to be handled is not contained in the current value.
     * @returns {Promise.<AuthenticationResult | null>} token response or null. If the return value is null, then no auth redirect was detected.
     */
    async handleRedirectPromise(hash?: string): Promise<AuthenticationResult | null> {
        if (this.embeddedApp && this.embeddedApp.brokerConnectionEstablished) {
            return await this.embeddedApp.sendHandleRedirectRequest();
        } else if (this.broker) {
            return this.broker.handleRedirectPromise(hash);
        } else {
            return super.handleRedirectPromise(hash);
        }
    }

    // #endregion
 
    // #region Popup Flow

    /**
     * Use when you want to obtain an access_token for your API via opening a popup window in the user's browser
     * @param {@link (PopupRequest:type)}
     *
     * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
     */
    acquireTokenPopup(request: PopupRequest): Promise<AuthenticationResult> {
        try {
            this.preflightBrowserEnvironmentCheck(InteractionType.Popup);
            this.logger.verbose("acquireTokenPopup called", request.correlationId);
            if (this.embeddedApp && this.embeddedApp.brokerConnectionEstablished) {
                const brokerInteractionClient = new EmbeddedInteractionClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, this.experimentalConfig, request.correlationId, this.embeddedApp, this.broker);
                return brokerInteractionClient.acquireTokenPopup(request);
            }

            // If logged in, emit acquire token events
            const loggedInAccounts = this.getAllAccounts();
            if (loggedInAccounts.length > 0) {
                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Popup, request);
            } else {
                this.eventHandler.emitEvent(EventType.LOGIN_START, InteractionType.Popup, request);
            }
    
            const popupClient = new PopupClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, request.correlationId);
            return popupClient.acquireToken(request).then((result) => {
                // If logged in, emit acquire token events
                const isLoggingIn = loggedInAccounts.length < this.getAllAccounts().length;
                if (isLoggingIn) {
                    this.eventHandler.emitEvent(EventType.LOGIN_SUCCESS, InteractionType.Popup, result);
                } else {
                    this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Popup, result);
                }
    
                return result;
            }).catch((e) => {
                if (loggedInAccounts.length > 0) {
                    this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Popup, null, e);
                } else {
                    this.eventHandler.emitEvent(EventType.LOGIN_FAILURE, InteractionType.Popup, null, e);
                }
                // Since this function is syncronous we need to reject
                return Promise.reject(e);
            });
        } catch (e) {
            // Since this function is syncronous we need to reject
            return Promise.reject(e);
        }
        
    }

    // #endregion

    // #region Silent Flow

    /**
     * This function uses a hidden iframe to fetch an authorization code from the eSTS. There are cases where this may not work:
     * - Any browser using a form of Intelligent Tracking Prevention
     * - If there is not an established session with the service
     *
     * In these cases, the request must be done inside a popup or full frame redirect.
     *
     * For the cases where interaction is required, you cannot send a request with prompt=none.
     *
     * If your refresh token has expired, you can use this function to fetch a new set of tokens silently as long as
     * you session on the server still exists.
     * @param request {@link SsoSilentRequest}
     *
     * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
     */
    async ssoSilent(request: SsoSilentRequest): Promise<AuthenticationResult> {
        this.preflightBrowserEnvironmentCheck(InteractionType.Silent);
        this.logger.verbose("ssoSilent called", request.correlationId);
        this.eventHandler.emitEvent(EventType.SSO_SILENT_START, InteractionType.Silent, request);

        try {
            if (this.embeddedApp && this.embeddedApp.brokerConnectionEstablished) {
                const brokerInteractionClient = new EmbeddedInteractionClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, this.experimentalConfig, request.correlationId, this.embeddedApp, this.broker);
                return brokerInteractionClient.ssoSilent(request);
            }
            const silentIframeClient = new SilentIframeClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, ApiId.ssoSilent, request.correlationId);
            const silentTokenResult = await silentIframeClient.acquireToken(request);
            this.eventHandler.emitEvent(EventType.SSO_SILENT_SUCCESS, InteractionType.Silent, silentTokenResult);
            return silentTokenResult;
        } catch (e) {
            this.eventHandler.emitEvent(EventType.SSO_SILENT_FAILURE, InteractionType.Silent, null, e);
            throw e;
        }
    }

    /**
     * Silently acquire an access token for a given set of scopes. Will use cached token if available, otherwise will attempt to acquire a new token from the network via refresh token.
     * @param {@link (SilentRequest:type)}
     * @param {@link (AccountInfo:type)}
     * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} 
     */
    protected async acquireTokenSilentAsync(request: SilentRequest, account: AccountInfo): Promise<AuthenticationResult>{
        const silentCacheClient = new SilentCacheClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient);
        const silentRequest = silentCacheClient.initializeSilentRequest(request, account);
        this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Silent, request);

        return silentCacheClient.acquireToken(silentRequest).catch(async () => {
            try {
                if (this.embeddedApp && this.embeddedApp.brokerConnectionEstablished) {
                    const brokerInteractionClient = new EmbeddedInteractionClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, this.experimentalConfig, request.correlationId, this.embeddedApp, this.broker);
                    return brokerInteractionClient.acquireTokenByBrokerRefresh(silentRequest);
                }
                const tokenRenewalResult = await this.acquireTokenByRefreshToken(silentRequest);
                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Silent, tokenRenewalResult);
                return tokenRenewalResult;
            } catch (tokenRenewalError) {
                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Silent, null, tokenRenewalError);
                throw tokenRenewalError;
            }
        });
    }

    // #endregion

    /**
     * Sets the account to use as the active account. If no account is passed to the acquireToken APIs, then MSAL will use this active account.
     * @param account 
     */
    setActiveAccount(account: AccountInfo | null): void {
        if (this.broker) {
            this.broker.setActiveAccount(account);
        }
        super.setActiveAccount(account);
    }
}

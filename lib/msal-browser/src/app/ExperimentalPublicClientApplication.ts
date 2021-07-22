/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo, AuthenticationResult, CommonSilentFlowRequest, StringUtils, PromptValue, ProtocolUtils, ResponseMode, PersistentCacheKeys, IdToken } from "@azure/msal-common";
import { BrokerClientApplication } from "../broker/client/BrokerClientApplication";
import { EmbeddedClientApplication } from "../broker/client/EmbeddedClientApplication";
import { Configuration } from "../config/Configuration";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { EventType } from "../event/EventType";
import { AuthorizationUrlRequest } from "../request/AuthorizationUrlRequest";
import { PopupRequest } from "../request/PopupRequest";
import { SilentRequest } from "../request/SilentRequest";
import { SsoSilentRequest } from "../request/SsoSilentRequest";
import { ApiId, InteractionType } from "../utils/BrowserConstants";
import { BrowserUtils } from "../utils/BrowserUtils";
import { PopupUtils } from "../utils/PopupUtils";
import { IPublicClientApplication } from "./IPublicClientApplication";
import { PublicClientApplication } from "./PublicClientApplication";
import { ExperimentalBrowserConfiguration, ExperimentalConfiguration, buildExperimentalConfiguration } from "../config/ExperimentalConfiguration";
import { RedirectRequest } from "../request/RedirectRequest";
import { BrowserStateObject } from "../utils/BrowserProtocolUtils";

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
            this.embeddedApp = new EmbeddedClientApplication(this.config.auth.clientId, this.experimentalConfig.brokerOptions, this.logger, this.browserStorage, this.browserCrypto);
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
        if (this.broker) {
            return this.broker.handleRedirectPromise(hash);
        } else if (this.embeddedApp && this.embeddedApp.brokerConnectionEstablished) {
            return await this.embeddedApp.sendHandleRedirectRequest();
        }
        return super.handleRedirectPromise(hash);
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
            // Preflight request
            this.preflightBrowserEnvironmentCheck(InteractionType.Popup);
            const validRequest: AuthorizationUrlRequest = this.preflightInteractiveRequest(request, InteractionType.Popup);
            if (this.embeddedApp && this.embeddedApp.brokerConnectionEstablished) {
                return this.embeddedApp.sendPopupRequest(validRequest);
            }
            this.browserStorage.updateCacheEntries(validRequest.state, validRequest.nonce, validRequest.authority, validRequest.loginHint || "", validRequest.account || null);
            const popupName = PopupUtils.generatePopupName(this.config.auth.clientId, validRequest);

            // asyncPopups flag is true. Acquires token without first opening popup. Popup will be opened later asynchronously.
            if (this.config.system.asyncPopups) {
                return this.acquireTokenPopupAsync(validRequest, popupName);
            } else {
                // asyncPopups flag is set to false. Opens popup before acquiring token. 
                const popup = PopupUtils.openSizedPopup("about:blank", popupName);
                return this.acquireTokenPopupAsync(validRequest, popupName, popup);
            }
        } catch (e) {
            // Since this function is synchronous we need to reject
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
     * @param {@link AuthorizationUrlRequest}
     *
     * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
     */
    async ssoSilent(request: SsoSilentRequest): Promise<AuthenticationResult> {
        this.preflightBrowserEnvironmentCheck(InteractionType.Silent);
        this.logger.verbose("ssoSilent called");
        this.eventHandler.emitEvent(EventType.SSO_SILENT_START, InteractionType.Silent, request);

        // Check that we have some SSO data
        if (StringUtils.isEmpty(request.loginHint) && StringUtils.isEmpty(request.sid) && (!request.account || StringUtils.isEmpty(request.account.username))) {
            throw BrowserAuthError.createSilentSSOInsufficientInfoError();
        }

        // Check that prompt is set to none, throw error if it is set to anything else.
        if (request.prompt && request.prompt !== PromptValue.NONE) {
            throw BrowserAuthError.createSilentPromptValueError(request.prompt);
        }

        // Create silent request
        const silentRequest: AuthorizationUrlRequest = this.initializeAuthorizationRequest({
            ...request,
            prompt: PromptValue.NONE
        }, InteractionType.Silent);

        try {
            if (this.embeddedApp && this.embeddedApp.brokerConnectionEstablished) {
                return this.embeddedApp.sendSsoSilentRequest(silentRequest);
            }
            const silentTokenResult = await this.acquireTokenByIframe(silentRequest, ApiId.ssoSilent);
            this.eventHandler.emitEvent(EventType.SSO_SILENT_SUCCESS, InteractionType.Silent, silentTokenResult);
            return silentTokenResult;
        } catch (e) {
            this.eventHandler.emitEvent(EventType.SSO_SILENT_FAILURE, InteractionType.Silent, null, e);
            throw e;
        }
    }

    /**
     * Silently acquire an access token for a given set of scopes. Will use cached token if available, otherwise will attempt to acquire a new token from the network via refresh token.
     * 
     * @param {@link (SilentRequest:type)} 
     * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
     */
    async acquireTokenSilent(request: SilentRequest): Promise<AuthenticationResult> {
        this.preflightBrowserEnvironmentCheck(InteractionType.Silent);
        const accountObj = request.account || this.getActiveAccount();
        if (!accountObj) {
            throw BrowserAuthError.createNoAccountError();
        }
        const silentRequest: CommonSilentFlowRequest = {
            ...request,
            ...this.initializeBaseRequest(request),
            account: accountObj,
            forceRefresh: request.forceRefresh || false
        };
        this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Silent, request);

        try {
            // Telemetry manager only used to increment cacheHits here
            const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenSilent_silentFlow, silentRequest.correlationId);
            const silentAuthClient = await this.createSilentFlowClient(serverTelemetryManager, silentRequest.authority);
            const cachedToken = await silentAuthClient.acquireCachedToken(silentRequest);
            this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Silent, cachedToken);
            return cachedToken;
        } catch (e) {
            try {
                if (this.embeddedApp && this.embeddedApp.brokerConnectionEstablished) {
                    return this.embeddedApp.sendSilentRefreshRequest(silentRequest);
                }
                const tokenRenewalResult = await this.acquireTokenByRefreshToken(silentRequest);
                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Silent, tokenRenewalResult);
                return tokenRenewalResult;
            } catch (tokenRenewalError) {
                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Silent, null, tokenRenewalError);
                throw tokenRenewalError;
            }
        }
    }

    /**
     * Helper to initialize required request parameters for interactive APIs and ssoSilent()
     * @param request
     * @param interactionType
     */
    protected initializeAuthorizationRequest(request: RedirectRequest|PopupRequest|SsoSilentRequest, interactionType: InteractionType): AuthorizationUrlRequest {
        this.logger.verbose("initializeAuthorizationRequest called", request.correlationId);
        const redirectUri = this.getRedirectUri(request.redirectUri);
        const browserState: BrowserStateObject = {
            interactionType: interactionType
        };

        const state = ProtocolUtils.setRequestState(
            this.browserCrypto,
            (request && request.state) || "",
            browserState
        );

        const validatedRequest: AuthorizationUrlRequest = {
            ...this.initializeBaseRequest(request),
            redirectUri: redirectUri,
            state: state,
            nonce: request.nonce || this.browserCrypto.createNewGuid(),
            responseMode: ResponseMode.FRAGMENT
        };

        const account = request.account || this.getActiveAccount();
        if (account) {
            this.logger.verbose("Setting validated request account");
            this.logger.verbosePii(`Setting validated request account: ${account}`);
            validatedRequest.account = account;
        }

        // Check for ADAL SSO
        if (StringUtils.isEmpty(validatedRequest.loginHint)) {
            // Only check for adal token if no SSO params are being used
            const adalIdTokenString = this.browserStorage.getTemporaryCache(PersistentCacheKeys.ADAL_ID_TOKEN);
            if (adalIdTokenString) {
                const adalIdToken = new IdToken(adalIdTokenString, this.browserCrypto);
                this.browserStorage.removeItem(PersistentCacheKeys.ADAL_ID_TOKEN);
                if (adalIdToken.claims && adalIdToken.claims.upn) {
                    this.logger.verbose("No SSO params used and ADAL token retrieved, setting ADAL upn as loginHint");
                    validatedRequest.loginHint = adalIdToken.claims.upn;
                }
            }
        }

        return validatedRequest;
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

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo, AuthenticationResult, AuthorizationUrlRequest, PromptValue, SilentFlowRequest } from "@azure/msal-common";
import { Configuration } from "../config/Configuration";
import { DEFAULT_REQUEST, ApiId, InteractionType } from "../utils/BrowserConstants";
import { IPublicClientApplication } from "./IPublicClientApplication";
import { RedirectRequest } from "../request/RedirectRequest";
import { PopupRequest } from "../request/PopupRequest";
import { ClientApplication } from "./ClientApplication";
import { BrokerClientApplication } from "../broker/client/BrokerClientApplication";
import { EmbeddedClientApplication } from "../broker/client/EmbeddedClientApplication";
import { SilentRequest } from "../request/SilentRequest";
import { BrowserUtils } from "../utils/BrowserUtils";
import { EventType } from "../event/EventType";
import { SsoSilentRequest } from "../request/SsoSilentRequest";
import { PopupHandler } from "../interaction_handler/PopupHandler";

/**
 * The PublicClientApplication class is the object exposed by the library to perform authentication and authorization functions in Single Page Applications
 * to obtain JWT tokens as described in the OAuth 2.0 Authorization Code Flow with PKCE specification.
 */
export class PublicClientApplication extends ClientApplication implements IPublicClientApplication {

    // Broker Objects
    protected embeddedApp: EmbeddedClientApplication;
    protected broker: BrokerClientApplication;

    /**
     * @constructor
     * Constructor for the PublicClientApplication used to instantiate the PublicClientApplication object
     *
     * Important attributes in the Configuration object for auth are:
     * - clientID: the application ID of your application. You can obtain one by registering your application with our Application registration portal : https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredAppsPreview
     * - authority: the authority URL for your application.
     * - redirect_uri: the uri of your application registered in the portal.
     *
     * In Azure AD, authority is a URL indicating the Azure active directory that MSAL uses to obtain tokens.
     * It is of the form https://login.microsoftonline.com/{Enter_the_Tenant_Info_Here}
     * If your application supports Accounts in one organizational directory, replace "Enter_the_Tenant_Info_Here" value with the Tenant Id or Tenant name (for example, contoso.microsoft.com).
     * If your application supports Accounts in any organizational directory, replace "Enter_the_Tenant_Info_Here" value with organizations.
     * If your application supports Accounts in any organizational directory and personal Microsoft accounts, replace "Enter_the_Tenant_Info_Here" value with common.
     * To restrict support to Personal Microsoft accounts only, replace "Enter_the_Tenant_Info_Here" value with consumers.
     *
     * In Azure B2C, authority is of the form https://{instance}/tfp/{tenant}/{policyName}/
     * Full B2C functionality will be available in this library in future versions.
     *
     * @param {@link (Configuration:type)} configuration object for the MSAL PublicClientApplication instance
     */
    constructor(configuration: Configuration) {
        super(configuration);
    }

    /**
     * 
     */
    async initializeBrokering(): Promise<void> {     
        if (!this.isBrowserEnvironment) {
            return;
        }

        if (this.config.experimental.brokerOptions.actAsBroker && !BrowserUtils.isInIframe()) {
            if(this.config.experimental.brokerOptions.allowBrokering) {
                this.logger.verbose("Running in top frame and both actAsBroker, allowBrokering flags set to true. actAsBroker takes precedence.");
            }

            this.broker = new BrokerClientApplication(this.config);
            this.logger.verbose("Acting as Broker");
            this.broker.listenForBrokerMessage();
        } else if (this.config.experimental.brokerOptions.allowBrokering) {
            this.embeddedApp = new EmbeddedClientApplication(this.config, this.logger, this.browserStorage);
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

    /**
     * Use when initiating the login process by redirecting the user's browser to the authorization endpoint. This function redirects the page, so
     * any code that follows this function will not execute.
     *
     * IMPORTANT: It is NOT recommended to have code that is dependent on the resolution of the Promise. This function will navigate away from the current
     * browser window. It currently returns a Promise in order to reflect the asynchronous nature of the code running in this function.
     *
     * @param {@link (RedirectRequest:type)}
     */
    async loginRedirect(request?: RedirectRequest): Promise<void> {
        return this.acquireTokenRedirect(request || DEFAULT_REQUEST);
    }

    // #endregion

    // #region Popup Flow

    /**
     * Use when initiating the login process via opening a popup window in the user's browser
     *
     * @param {@link (PopupRequest:type)}
     *
     * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
     */
    loginPopup(request?: PopupRequest): Promise<AuthenticationResult> {
        return this.acquireTokenPopup(request || DEFAULT_REQUEST);
    }

    /**
     * Use when you want to obtain an access_token for your API via opening a popup window in the user's browser
     * @param {@link (PopupRequest:type)}
     *
     * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
     */
    acquireTokenPopup(request: PopupRequest): Promise<AuthenticationResult> {
        try {
            this.preflightBrowserEnvironmentCheck(InteractionType.Popup);
        } catch (e) {
            // Since this function is synchronous we need to reject
            return Promise.reject(e);
        }

        // If logged in, emit acquire token events
        const loggedInAccounts = this.getAllAccounts();
        if (loggedInAccounts.length > 0) {
            this.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Popup, request);
        } else {
            this.emitEvent(EventType.LOGIN_START, InteractionType.Popup, request);
        }

        // Preflight request
        const validRequest: AuthorizationUrlRequest = this.preflightInteractiveRequest(request, InteractionType.Popup);

        if (this.embeddedApp && this.embeddedApp.brokerConnectionEstablished) {
            return this.embeddedApp.sendPopupRequest(validRequest);
        }

        this.browserStorage.updateCacheEntries(validRequest.state, validRequest.nonce, validRequest.authority);

        // asyncPopups flag is true. Acquires token without first opening popup. Popup will be opened later asynchronously.
        if (this.config.system.asyncPopups) {
            return super.acquireTokenPopupAsync(validRequest);
        } else {
            // asyncPopups flag is set to false. Opens popup before acquiring token.
            const popup = PopupHandler.openSizedPopup();
            return super.acquireTokenPopupAsync(validRequest, popup);
        }
    }

    // #endregion

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
        this.emitEvent(EventType.SSO_SILENT_START, InteractionType.Silent, request);

        try {
            // Create silent request
            const silentRequest: AuthorizationUrlRequest = this.initializeAuthorizationRequest({
                ...request,
                prompt: PromptValue.NONE
            }, InteractionType.Silent);

            if (this.embeddedApp && this.embeddedApp.brokerConnectionEstablished) {
                return this.embeddedApp.sendSsoSilentRequest(silentRequest);
            }
    
            this.browserStorage.updateCacheEntries(silentRequest.state, silentRequest.nonce, silentRequest.authority);
            const silentTokenResult = await this.acquireTokenByIframe(silentRequest);
            this.emitEvent(EventType.SSO_SILENT_SUCCESS, InteractionType.Silent, silentTokenResult);
            return silentTokenResult;
        } catch (e) {
            this.emitEvent(EventType.SSO_SILENT_FAILURE, InteractionType.Silent, null, e);
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
        const silentRequest: SilentFlowRequest = {
            ...request,
            ...this.initializeBaseRequest(request),
            account: request.account || this.getActiveAccount(),
            forceRefresh: request.forceRefresh || false
        };
        this.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Silent, request);

        try {
            // Telemetry manager only used to increment cacheHits here
            const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenSilent_silentFlow, silentRequest.correlationId);
            const silentAuthClient = await this.createSilentFlowClient(serverTelemetryManager, silentRequest.authority);
            const cachedToken = await silentAuthClient.acquireCachedToken(silentRequest);
            this.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Silent, cachedToken);
            return cachedToken;
        } catch (e) {
            try {
                if (this.embeddedApp && this.embeddedApp.brokerConnectionEstablished) {
                    return this.embeddedApp.sendSilentRefreshRequest(request);
                }
                const tokenRenewalResult = await this.acquireTokenByRefreshToken(silentRequest);
                this.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Silent, tokenRenewalResult);
                return tokenRenewalResult;
            } catch (tokenRenewalError) {
                this.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Silent, null, tokenRenewalError);
                throw tokenRenewalError;
            }
        }
    }

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

    /**
     * Gets the currently active account
     */
    getActiveAccount(asBroker?: boolean): AccountInfo | null {
        if (asBroker) {
            return this.broker.getActiveAccount();
        }

        return super.getActiveAccount();
    }
}

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CryptoOps } from "../crypto/CryptoOps";
import { StringUtils, UrlString, CommonAuthorizationCodeRequest, AuthorizationCodeClient, PromptValue, ServerError, InteractionRequiredAuthError, AccountInfo, ServerTelemetryManager, SilentFlowClient, BaseAuthRequest, PersistentCacheKeys, IdToken, ProtocolUtils, ResponseMode, Constants, INetworkModule, AuthenticationResult, Logger, RefreshTokenClient, AuthenticationScheme, CommonSilentFlowRequest, ICrypto, DEFAULT_CRYPTO_IMPLEMENTATION } from "@azure/msal-common";
import { BrowserCacheManager, DEFAULT_BROWSER_CACHE_MANAGER } from "../cache/BrowserCacheManager";
import { BrowserConfiguration, buildConfiguration, Configuration } from "../config/Configuration";
import { TemporaryCacheKeys, InteractionType, ApiId, BrowserConstants, BrowserCacheLocation, WrapperSKU } from "../utils/BrowserConstants";
import { BrowserUtils } from "../utils/BrowserUtils";
import { BrowserStateObject } from "../utils/BrowserProtocolUtils";
import { SilentHandler } from "../interaction_handler/SilentHandler";
import { RedirectRequest } from "../request/RedirectRequest";
import { PopupRequest } from "../request/PopupRequest";
import { AuthorizationUrlRequest } from "../request/AuthorizationUrlRequest";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { SsoSilentRequest } from "../request/SsoSilentRequest";
import { version, name } from "../packageMetadata";
import { EventCallbackFunction } from "../event/EventMessage";
import { EventType } from "../event/EventType";
import { EndSessionRequest } from "../request/EndSessionRequest";
import { BrowserConfigurationAuthError } from "../error/BrowserConfigurationAuthError";
import { EndSessionPopupRequest } from "../request/EndSessionPopupRequest";
import { INavigationClient } from "../navigation/INavigationClient";
import { EventHandler } from "../event/EventHandler";
import { PopupClient } from "../interaction_client/PopupClient";
import { RedirectClient } from "../interaction_client/RedirectClient";

export abstract class ClientApplication {

    // Crypto interface implementation
    protected readonly browserCrypto: ICrypto;

    // Storage interface implementation
    protected readonly browserStorage: BrowserCacheManager;

    // Network interface implementation
    protected readonly networkClient: INetworkModule;

    // Navigation interface implementation
    protected navigationClient: INavigationClient;

    // Input configuration by developer/user
    protected config: BrowserConfiguration;

    // Logger
    protected logger: Logger;

    // Flag to indicate if in browser environment
    protected isBrowserEnvironment: boolean;

    protected eventHandler: EventHandler;

    // Redirect Response Object
    private redirectResponse: Map<string, Promise<AuthenticationResult | null>>;

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
     * @param configuration Object for the MSAL PublicClientApplication instance
     */
    constructor(configuration: Configuration) {
        /*
         * If loaded in an environment where window is not available,
         * set internal flag to false so that further requests fail.
         * This is to support server-side rendering environments.
         */
        this.isBrowserEnvironment = typeof window !== "undefined";
        // Set the configuration.
        this.config = buildConfiguration(configuration, this.isBrowserEnvironment);

        // Initialize logger
        this.logger = new Logger(this.config.system.loggerOptions, name, version);
        
        // Initialize the network module class.
        this.networkClient = this.config.system.networkClient;
        
        // Initialize the navigation client class.
        this.navigationClient = this.config.system.navigationClient;
        
        // Initialize redirectResponse Map
        this.redirectResponse = new Map();
        
        // Initialize the crypto class.
        this.browserCrypto = this.isBrowserEnvironment ? new CryptoOps() : DEFAULT_CRYPTO_IMPLEMENTATION;

        this.eventHandler = new EventHandler(this.logger, this.browserCrypto);

        // Initialize the browser storage class.
        this.browserStorage = this.isBrowserEnvironment ? 
            new BrowserCacheManager(this.config.auth.clientId, this.config.cache, this.browserCrypto, this.logger) : 
            DEFAULT_BROWSER_CACHE_MANAGER(this.config.auth.clientId, this.logger);
    }

    // #region Redirect Flow

    /**
     * Event handler function which allows users to fire events after the PublicClientApplication object
     * has loaded during redirect flows. This should be invoked on all page loads involved in redirect
     * auth flows.
     * @param hash Hash to process. Defaults to the current value of window.location.hash. Only needs to be provided explicitly if the response to be handled is not contained in the current value.
     * @returns Token response or null. If the return value is null, then no auth redirect was detected.
     */
    async handleRedirectPromise(hash?: string): Promise<AuthenticationResult | null> {
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
                const redirectClient = new RedirectClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient);
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
     * Use when you want to obtain an access_token for your API by redirecting the user's browser window to the authorization endpoint. This function redirects
     * the page, so any code that follows this function will not execute.
     *
     * IMPORTANT: It is NOT recommended to have code that is dependent on the resolution of the Promise. This function will navigate away from the current
     * browser window. It currently returns a Promise in order to reflect the asynchronous nature of the code running in this function.
     *
     * @param request
     */
    async acquireTokenRedirect(request: RedirectRequest): Promise<void> {
        // Preflight request
        this.preflightBrowserEnvironmentCheck(InteractionType.Redirect);
        this.logger.verbose("acquireTokenRedirect called");

        // If logged in, emit acquire token events
        const isLoggedIn = this.getAllAccounts().length > 0;
        if (isLoggedIn) {
            this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Redirect, request);
        } else {
            this.eventHandler.emitEvent(EventType.LOGIN_START, InteractionType.Redirect, request);
        }

        const validRequest: AuthorizationUrlRequest = this.preflightInteractiveRequest(request, InteractionType.Redirect);
        
        const redirectClient = new RedirectClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient);

        return redirectClient.acquireToken(validRequest, request.redirectStartPage, request.onRedirectNavigate).catch((e) => {
            // If logged in, emit acquire token events
            if (isLoggedIn) {
                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Redirect, null, e);
            } else {
                this.eventHandler.emitEvent(EventType.LOGIN_FAILURE, InteractionType.Redirect, null, e);
            }
            throw e;
        });
    }

    // #endregion

    // #region Popup Flow

    /**
     * Use when you want to obtain an access_token for your API via opening a popup window in the user's browser
     *
     * @param request
     *
     * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
     */
    acquireTokenPopup(request: PopupRequest): Promise<AuthenticationResult> {
        let validRequest: AuthorizationUrlRequest;
        try {
            this.preflightBrowserEnvironmentCheck(InteractionType.Popup);
            this.logger.verbose("acquireTokenPopup called", request.correlationId);
            validRequest = this.preflightInteractiveRequest(request, InteractionType.Popup);
        } catch (e) {
            // Since this function is syncronous we need to reject
            return Promise.reject(e);
        }

        // If logged in, emit acquire token events
        const loggedInAccounts = this.getAllAccounts();
        if (loggedInAccounts.length > 0) {
            this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Popup, validRequest);
        } else {
            this.eventHandler.emitEvent(EventType.LOGIN_START, InteractionType.Popup, validRequest);
        }

        const popupClient = new PopupClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient);

        return popupClient.acquireToken(validRequest).then((result) => {
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
            throw e;
        });
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
            const silentTokenResult = await this.acquireTokenByIframe(request, ApiId.ssoSilent);
            this.eventHandler.emitEvent(EventType.SSO_SILENT_SUCCESS, InteractionType.Silent, silentTokenResult);
            return silentTokenResult;
        } catch (e) {
            this.eventHandler.emitEvent(EventType.SSO_SILENT_FAILURE, InteractionType.Silent, null, e);
            throw e;
        }
    }

    /**
     * This function uses a hidden iframe to fetch an authorization code from the eSTS. To be used for silent refresh token acquisition and renewal.
     * @param request
     * @param apiId - ApiId of the calling function. Used for telemetry.
     */
    private async acquireTokenByIframe(request: SsoSilentRequest, apiId: ApiId): Promise<AuthenticationResult> {
        this.logger.verbose("acquireTokenByIframe called", request.correlationId);
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

        const browserRequestLogger = this.logger.clone(name, version, silentRequest.correlationId);
        const serverTelemetryManager = this.initializeServerTelemetryManager(apiId, silentRequest.correlationId);

        try {
            // Create auth code request and generate PKCE params
            const authCodeRequest: CommonAuthorizationCodeRequest = await this.initializeAuthorizationCodeRequest(silentRequest);

            // Initialize the client
            const authClient: AuthorizationCodeClient = await this.createAuthCodeClient(serverTelemetryManager, silentRequest.authority, silentRequest.correlationId);
            browserRequestLogger.verbose("Auth code client created");

            // Create authorize request url
            const navigateUrl = await authClient.getAuthCodeUrl(silentRequest);

            return await this.silentTokenHelper(navigateUrl, authCodeRequest, authClient, browserRequestLogger);
        } catch (e) {
            serverTelemetryManager.cacheFailedRequest(e);
            this.browserStorage.cleanRequestByState(silentRequest.state);
            throw e;
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
    protected async acquireTokenByRefreshToken(request: CommonSilentFlowRequest): Promise<AuthenticationResult> {
        this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_NETWORK_START, InteractionType.Silent, request);
        // block the reload if it occurred inside a hidden iframe
        BrowserUtils.blockReloadInHiddenIframes();
        const silentRequest: CommonSilentFlowRequest = {
            ...request,
            ...this.initializeBaseRequest(request)
        };
        const browserRequestLogger = this.logger.clone(name, version, silentRequest.correlationId);
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenSilent_silentFlow, silentRequest.correlationId);
        try {
            const refreshTokenClient = await this.createRefreshTokenClient(serverTelemetryManager, silentRequest.authority, silentRequest.correlationId);
            browserRequestLogger.verbose("Refresh token client created");
            
            // Send request to renew token. Auth module will throw errors if token cannot be renewed.
            return await refreshTokenClient.acquireTokenByRefreshToken(silentRequest);
        } catch (e) {
            serverTelemetryManager.cacheFailedRequest(e);
            const isServerError = e instanceof ServerError;
            const isInteractionRequiredError = e instanceof InteractionRequiredAuthError;
            const isInvalidGrantError = (e.errorCode === BrowserConstants.INVALID_GRANT_ERROR);
            if (isServerError && isInvalidGrantError && !isInteractionRequiredError) {
                browserRequestLogger.verbose("Refresh token expired or invalid, attempting acquire token by iframe");
                return await this.acquireTokenByIframe(request, ApiId.acquireTokenSilent_authCode);
            }
            throw e;
        }
    }

    /**
     * Helper which acquires an authorization code silently using a hidden iframe from given url
     * using the scopes requested as part of the id, and exchanges the code for a set of OAuth tokens.
     * @param navigateUrl
     * @param userRequestScopes
     */
    private async silentTokenHelper(navigateUrl: string, authCodeRequest: CommonAuthorizationCodeRequest, authClient: AuthorizationCodeClient, browserRequestLogger: Logger): Promise<AuthenticationResult> {
        // Create silent handler
        const silentHandler = new SilentHandler(authClient, this.browserStorage, authCodeRequest, browserRequestLogger, this.config.system.navigateFrameWait);
        // Get the frame handle for the silent request
        const msalFrame = await silentHandler.initiateAuthRequest(navigateUrl);
        // Monitor the window for the hash. Return the string value and close the popup when the hash is received. Default timeout is 60 seconds.
        const hash = await silentHandler.monitorIframeForHash(msalFrame, this.config.system.iframeHashTimeout);
        const state = this.validateAndExtractStateFromHash(hash, InteractionType.Silent, authCodeRequest.correlationId);

        // Handle response from hash string
        return silentHandler.handleCodeResponse(hash, state, authClient.authority, this.networkClient);
    }

    // #endregion

    // #region Logout

    /**
     * Deprecated logout function. Use logoutRedirect or logoutPopup instead
     * @param logoutRequest 
     * @deprecated
     */
    async logout(logoutRequest?: EndSessionRequest): Promise<void> {
        this.logger.warning("logout API is deprecated and will be removed in msal-browser v3.0.0. Use logoutRedirect instead.");
        return this.logoutRedirect(logoutRequest);
    }

    /**
     * Use to log out the current user, and redirect the user to the postLogoutRedirectUri.
     * Default behaviour is to redirect the user to `window.location.href`.
     * @param logoutRequest
     */
    async logoutRedirect(logoutRequest?: EndSessionRequest): Promise<void> {
        this.preflightBrowserEnvironmentCheck(InteractionType.Redirect);
        const redirectClient = new RedirectClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient);
        return redirectClient.logout(logoutRequest);
    }

    /**
     * Clears local cache for the current user then opens a popup window prompting the user to sign-out of the server
     * @param logoutRequest 
     */
    logoutPopup(logoutRequest?: EndSessionPopupRequest): Promise<void> {
        this.preflightBrowserEnvironmentCheck(InteractionType.Popup);
        const popupClient = new PopupClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient);
        return popupClient.logout(logoutRequest);
    }

    // #endregion

    // #region Account APIs

    /**
     * Returns all accounts that MSAL currently has data for.
     * (the account object is created at the time of successful login)
     * or empty array when no accounts are found
     * @returns Array of account objects in cache
     */
    getAllAccounts(): AccountInfo[] {
        this.logger.verbose("getAllAccounts called");
        return this.isBrowserEnvironment ? this.browserStorage.getAllAccounts() : [];
    }

    /**
     * Returns the signed in account matching username.
     * (the account object is created at the time of successful login)
     * or null when no matching account is found.
     * This API is provided for convenience but getAccountById should be used for best reliability
     * @param userName
     * @returns The account object stored in MSAL
     */
    getAccountByUsername(userName: string): AccountInfo|null {
        const allAccounts = this.getAllAccounts();
        if (!StringUtils.isEmpty(userName) && allAccounts && allAccounts.length) {
            this.logger.verbose("Account matching username found, returning");
            this.logger.verbosePii(`Returning signed-in accounts matching username: ${userName}`);
            return allAccounts.filter(accountObj => accountObj.username.toLowerCase() === userName.toLowerCase())[0] || null;
        } else {
            this.logger.verbose("getAccountByUsername: No matching account found, returning null");
            return null;
        }
    }

    /**
     * Returns the signed in account matching homeAccountId.
     * (the account object is created at the time of successful login)
     * or null when no matching account is found
     * @param homeAccountId
     * @returns The account object stored in MSAL
     */
    getAccountByHomeId(homeAccountId: string): AccountInfo|null {
        const allAccounts = this.getAllAccounts();
        if (!StringUtils.isEmpty(homeAccountId) && allAccounts && allAccounts.length) {
            this.logger.verbose("Account matching homeAccountId found, returning");
            this.logger.verbosePii(`Returning signed-in accounts matching homeAccountId: ${homeAccountId}`);
            return allAccounts.filter(accountObj => accountObj.homeAccountId === homeAccountId)[0] || null;
        } else {
            this.logger.verbose("getAccountByHomeId: No matching account found, returning null");
            return null;
        }
    }

    /**
     * Returns the signed in account matching localAccountId.
     * (the account object is created at the time of successful login)
     * or null when no matching account is found
     * @param localAccountId
     * @returns The account object stored in MSAL
     */
    getAccountByLocalId(localAccountId: string): AccountInfo | null {
        const allAccounts = this.getAllAccounts();
        if (!StringUtils.isEmpty(localAccountId) && allAccounts && allAccounts.length) {
            this.logger.verbose("Account matching localAccountId found, returning");
            this.logger.verbosePii(`Returning signed-in accounts matching localAccountId: ${localAccountId}`);
            return allAccounts.filter(accountObj => accountObj.localAccountId === localAccountId)[0] || null;
        } else {
            this.logger.verbose("getAccountByLocalId: No matching account found, returning null");
            return null;
        }
    }

    /**
     * Sets the account to use as the active account. If no account is passed to the acquireToken APIs, then MSAL will use this active account.
     * @param account
     */
    setActiveAccount(account: AccountInfo | null): void {
        this.browserStorage.setActiveAccount(account);
    }

    /**
     * Gets the currently active account
     */
    getActiveAccount(): AccountInfo | null {
        return this.browserStorage.getActiveAccount();
    }

    // #endregion

    // #region Helpers

    /**
     *
     * Use to get the redirect uri configured in MSAL or null.
     * @param requestRedirectUri
     * @returns Redirect URL
     *
     */
    protected getRedirectUri(requestRedirectUri?: string): string {
        this.logger.verbose("getRedirectUri called");
        const redirectUri = requestRedirectUri || this.config.auth.redirectUri || BrowserUtils.getCurrentUri();
        return UrlString.getAbsoluteUrl(redirectUri, BrowserUtils.getCurrentUri());
    }

    /**
     * Helper to check whether interaction is in progress.
     */
    protected interactionInProgress(): boolean {
        // Check whether value in cache is present and equal to expected value
        return (this.browserStorage.getTemporaryCache(TemporaryCacheKeys.INTERACTION_STATUS_KEY, true)) === BrowserConstants.INTERACTION_IN_PROGRESS_VALUE;
    }

    /**
     * Creates an Silent Flow Client with the given authority, or the default authority.
     * @param serverTelemetryManager
     * @param authorityUrl
     */
    protected async createSilentFlowClient(serverTelemetryManager: ServerTelemetryManager, authorityUrl?: string, correlationId?: string): Promise<SilentFlowClient> {
        // Create auth module.
        const clientConfig = await this.getClientConfiguration(serverTelemetryManager, authorityUrl, correlationId);
        return new SilentFlowClient(clientConfig);
    }

    /**
     * Creates a Refresh Client with the given authority, or the default authority.
     * @param serverTelemetryManager
     * @param authorityUrl
     */
    protected async createRefreshTokenClient(serverTelemetryManager: ServerTelemetryManager, authorityUrl?: string, correlationId?: string): Promise<RefreshTokenClient> {
        // Create auth module.
        const clientConfig = await this.getClientConfiguration(serverTelemetryManager, authorityUrl, correlationId);
        return new RefreshTokenClient(clientConfig);
    }

    /**
     * Helper to validate app environment before making a request.
     * @param request
     * @param interactionType
     */
    protected preflightInteractiveRequest(request: RedirectRequest|PopupRequest, interactionType: InteractionType): AuthorizationUrlRequest {
        this.logger.verbose("preflightInteractiveRequest called, validating app environment", request?.correlationId);
        // block the reload if it occurred inside a hidden iframe
        BrowserUtils.blockReloadInHiddenIframes();

        // Check if interaction is in progress. Throw error if true.
        if (this.interactionInProgress()) {
            throw BrowserAuthError.createInteractionInProgressError();
        }

        return this.initializeAuthorizationRequest(request, interactionType);
    }

    /**
     * Helper to validate app environment before making an auth request
     * * @param interactionType
     */
    protected preflightBrowserEnvironmentCheck(interactionType: InteractionType): void {
        this.logger.verbose("preflightBrowserEnvironmentCheck started");
        // Block request if not in browser environment
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);

        // Block redirects if in an iframe
        BrowserUtils.blockRedirectInIframe(interactionType, this.config.system.allowRedirectInIframe);

        // Block auth requests inside a hidden iframe
        BrowserUtils.blockReloadInHiddenIframes();

        // Block redirectUri opened in a popup from calling MSAL APIs
        BrowserUtils.blockAcquireTokenInPopups();

        // Block redirects if memory storage is enabled but storeAuthStateInCookie is not
        if (interactionType === InteractionType.Redirect &&
            this.config.cache.cacheLocation === BrowserCacheLocation.MemoryStorage &&
            !this.config.cache.storeAuthStateInCookie) {
            throw BrowserConfigurationAuthError.createInMemoryRedirectUnavailableError();
        }
    }

    /**
     * Initializer function for all request APIs
     * @param request
     */
    protected initializeBaseRequest(request: Partial<BaseAuthRequest>): BaseAuthRequest {
        this.logger.verbose("Initializing BaseAuthRequest", request.correlationId);
        const authority = request.authority || this.config.auth.authority;

        const scopes = [...((request && request.scopes) || [])];
        const correlationId = (request && request.correlationId) || this.browserCrypto.createNewGuid();

        // Set authenticationScheme to BEARER if not explicitly set in the request
        if (!request.authenticationScheme) {
            request.authenticationScheme = AuthenticationScheme.BEARER;
            this.logger.verbose("Authentication Scheme wasn't explicitly set in request, defaulting to \"Bearer\" request", request.correlationId);
        } else {
            this.logger.verbose(`Authentication Scheme set to "${request.authenticationScheme}" as configured in Auth request`, request.correlationId);
        }

        const validatedRequest: BaseAuthRequest = {
            ...request,
            correlationId,
            authority,
            scopes
        };

        return validatedRequest;
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

        this.browserStorage.updateCacheEntries(validatedRequest.state, validatedRequest.nonce, validatedRequest.authority, validatedRequest.loginHint || "", validatedRequest.account || null);

        return validatedRequest;
    }

    /**
     * Adds event callbacks to array
     * @param callback
     */
    addEventCallback(callback: EventCallbackFunction): string | null {
        return this.eventHandler.addEventCallback(callback);
    }

    /**
     * Removes callback with provided id from callback array
     * @param callbackId
     */
    removeEventCallback(callbackId: string): void {
        this.eventHandler.removeEventCallback(callbackId);
    }

    /**
     * Returns the logger instance
     */
    getLogger(): Logger {
        return this.logger;
    }

    /**
     * Replaces the default logger set in configurations with new Logger with new configurations
     * @param logger Logger instance
     */
    setLogger(logger: Logger): void {
        this.logger = logger;
    }

    /**
     * Called by wrapper libraries (Angular & React) to set SKU and Version passed down to telemetry, logger, etc.
     * @param sku
     * @param version
     */
    initializeWrapperLibrary(sku: WrapperSKU, version: string): void {
        // Validate the SKU passed in is one we expect
        this.browserStorage.setWrapperMetadata(sku, version);
    }

    /**
     * Sets navigation client
     * @param navigationClient
     */
    setNavigationClient(navigationClient: INavigationClient): void {
        this.navigationClient = navigationClient;
    }
    // #endregion
}

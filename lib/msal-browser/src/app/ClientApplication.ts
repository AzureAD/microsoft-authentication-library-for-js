/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CryptoOps } from "../crypto/CryptoOps";
import { Authority, StringUtils, UrlString, ServerAuthorizationCodeResponse, CommonAuthorizationCodeRequest, AuthorizationCodeClient, PromptValue, ServerError, InteractionRequiredAuthError, AccountInfo, AuthorityFactory, ServerTelemetryManager, SilentFlowClient, ClientConfiguration, BaseAuthRequest, ServerTelemetryRequest, PersistentCacheKeys, IdToken, ProtocolUtils, ResponseMode, Constants, INetworkModule, AuthenticationResult, Logger, ThrottlingUtils, RefreshTokenClient, AuthenticationScheme, CommonSilentFlowRequest, CommonEndSessionRequest, AccountEntity, ICrypto, DEFAULT_CRYPTO_IMPLEMENTATION, AuthorityOptions } from "@azure/msal-common";
import { BrowserCacheManager, DEFAULT_BROWSER_CACHE_MANAGER } from "../cache/BrowserCacheManager";
import { BrowserConfiguration, buildConfiguration, Configuration } from "../config/Configuration";
import { TemporaryCacheKeys, InteractionType, ApiId, BrowserConstants, BrowserCacheLocation, WrapperSKU, CryptoKeyTypes } from "../utils/BrowserConstants";
import { BrowserUtils } from "../utils/BrowserUtils";
import { BrowserStateObject, BrowserProtocolUtils } from "../utils/BrowserProtocolUtils";
import { RedirectHandler } from "../interaction_handler/RedirectHandler";
import { PopupHandler, PopupParams } from "../interaction_handler/PopupHandler";
import { SilentHandler } from "../interaction_handler/SilentHandler";
import { RedirectRequest } from "../request/RedirectRequest";
import { PopupRequest } from "../request/PopupRequest";
import { AuthorizationUrlRequest } from "../request/AuthorizationUrlRequest";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { SsoSilentRequest } from "../request/SsoSilentRequest";
import { version, name } from "../packageMetadata";
import { EventError, EventMessage, EventPayload, EventCallbackFunction } from "../event/EventMessage";
import { EventType } from "../event/EventType";
import { EndSessionRequest } from "../request/EndSessionRequest";
import { BrowserConfigurationAuthError } from "../error/BrowserConfigurationAuthError";
import { PopupUtils } from "../utils/PopupUtils";
import { EndSessionPopupRequest } from "../request/EndSessionPopupRequest";
import { INavigationClient } from "../navigation/INavigationClient";
import { NavigationOptions } from "../navigation/NavigationOptions";

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

    // Sets the account to use if no account info is given
    private activeLocalAccountId: string | null;

    // Set the SKU and Version for wrapper library if applicable
    private wrapperSKU: string | undefined;
    private wrapperVer: string | undefined;

    // Callback for subscribing to events
    private eventCallbacks: Map<string, EventCallbackFunction>;

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

        this.activeLocalAccountId = null;

        // Array of events
        this.eventCallbacks = new Map();

        // Initialize logger
        this.logger = new Logger(this.config.system.loggerOptions, name, version);

        // Initialize the network module class.
        this.networkClient = this.config.system.networkClient;

        // Initialize the navigation client class.
        this.navigationClient = this.config.system.navigationClient;
        
        // Initialize redirectResponse Map
        this.redirectResponse = new Map();

        if (!this.isBrowserEnvironment) {
            this.browserStorage = DEFAULT_BROWSER_CACHE_MANAGER(this.config.auth.clientId, this.logger);
            this.browserCrypto = DEFAULT_CRYPTO_IMPLEMENTATION;
            return;
        }

        // Initialize the crypto class.
        this.browserCrypto = new CryptoOps();

        // Initialize the browser storage class.
        this.browserStorage = new BrowserCacheManager(this.config.auth.clientId, this.config.cache, this.browserCrypto, this.logger);
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
        this.emitEvent(EventType.HANDLE_REDIRECT_START, InteractionType.Redirect);
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
                response = this.handleRedirectResponse(hash)
                    .then((result: AuthenticationResult | null) => {
                        if (result) {
                        // Emit login event if number of accounts change
                            const isLoggingIn = loggedInAccounts.length < this.getAllAccounts().length;
                            if (isLoggingIn) {
                                this.emitEvent(EventType.LOGIN_SUCCESS, InteractionType.Redirect, result);
                                this.logger.verbose("handleRedirectResponse returned result, login success");
                            } else {
                                this.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Redirect, result);
                                this.logger.verbose("handleRedirectResponse returned result, acquire token success");
                            }
                        }
                        this.emitEvent(EventType.HANDLE_REDIRECT_END, InteractionType.Redirect);

                        return result;
                    })
                    .catch((e) => {
                    // Emit login event if there is an account
                        if (loggedInAccounts.length > 0) {
                            this.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Redirect, null, e);
                        } else {
                            this.emitEvent(EventType.LOGIN_FAILURE, InteractionType.Redirect, null, e);
                        }
                        this.emitEvent(EventType.HANDLE_REDIRECT_END, InteractionType.Redirect);

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
     * Checks if navigateToLoginRequestUrl is set, and:
     * - if true, performs logic to cache and navigate
     * - if false, handles hash string and parses response
     * @param hash
     */
    private async handleRedirectResponse(hash?: string): Promise<AuthenticationResult | null> {
        if (!this.interactionInProgress()) {
            this.logger.info("handleRedirectPromise called but there is no interaction in progress, returning null.");
            return null;
        }

        const responseHash = this.getRedirectResponseHash(hash || window.location.hash);
        if (!responseHash) {
            // Not a recognized server response hash or hash not associated with a redirect request
            this.logger.info("handleRedirectPromise did not detect a response hash as a result of a redirect. Cleaning temporary cache.");
            this.browserStorage.cleanRequestByInteractionType(InteractionType.Redirect);
            return null;
        }

        let state: string;
        try {
            state = this.validateAndExtractStateFromHash(responseHash, InteractionType.Redirect);
            BrowserUtils.clearHash(window);
            this.logger.verbose("State extracted from hash");
        } catch (e) {
            this.logger.info(`handleRedirectPromise was unable to extract state due to: ${e}`);
            this.browserStorage.cleanRequestByInteractionType(InteractionType.Redirect);
            return null;
        }

        // If navigateToLoginRequestUrl is true, get the url where the redirect request was initiated
        const loginRequestUrl = this.browserStorage.getTemporaryCache(TemporaryCacheKeys.ORIGIN_URI, true) || "";
        const loginRequestUrlNormalized = UrlString.removeHashFromUrl(loginRequestUrl);
        const currentUrlNormalized = UrlString.removeHashFromUrl(window.location.href);

        if (loginRequestUrlNormalized === currentUrlNormalized && this.config.auth.navigateToLoginRequestUrl) {
            // We are on the page we need to navigate to - handle hash
            this.logger.verbose("Current page is loginRequestUrl, handling hash");
            const handleHashResult = await this.handleHash(responseHash, state);

            if (loginRequestUrl.indexOf("#") > -1) {
                // Replace current hash with non-msal hash, if present
                BrowserUtils.replaceHash(loginRequestUrl);
            }

            return handleHashResult;
        } else if (!this.config.auth.navigateToLoginRequestUrl) {
            this.logger.verbose("NavigateToLoginRequestUrl set to false, handling hash");
            return this.handleHash(responseHash, state);
        } else if (!BrowserUtils.isInIframe()) {
            /*
             * Returned from authority using redirect - need to perform navigation before processing response
             * Cache the hash to be retrieved after the next redirect
             */
            this.browserStorage.setTemporaryCache(TemporaryCacheKeys.URL_HASH, responseHash, true);
            const navigationOptions: NavigationOptions = {
                apiId: ApiId.handleRedirectPromise,
                timeout: this.config.system.redirectNavigationTimeout,
                noHistory: true
            };

            /**
             * Default behavior is to redirect to the start page and not process the hash now. 
             * The start page is expected to also call handleRedirectPromise which will process the hash in one of the checks above.
             */  
            let processHashOnRedirect: boolean = true;
            if (!loginRequestUrl || loginRequestUrl === "null") {
                // Redirect to home page if login request url is null (real null or the string null)
                const homepage = BrowserUtils.getHomepage();
                // Cache the homepage under ORIGIN_URI to ensure cached hash is processed on homepage
                this.browserStorage.setTemporaryCache(TemporaryCacheKeys.ORIGIN_URI, homepage, true);
                this.logger.warning("Unable to get valid login request url from cache, redirecting to home page");
                processHashOnRedirect = await this.navigationClient.navigateInternal(homepage, navigationOptions);
            } else {
                // Navigate to page that initiated the redirect request
                this.logger.verbose(`Navigating to loginRequestUrl: ${loginRequestUrl}`);
                processHashOnRedirect = await this.navigationClient.navigateInternal(loginRequestUrl, navigationOptions);
            }

            // If navigateInternal implementation returns false, handle the hash now
            if (!processHashOnRedirect) {
                return this.handleHash(responseHash, state);
            }
        }

        return null;
    }

    /**
     * Gets the response hash for a redirect request
     * Returns null if interactionType in the state value is not "redirect" or the hash does not contain known properties
     * @param hash
     */
    private getRedirectResponseHash(hash: string): string | null {
        this.logger.verbose("getRedirectResponseHash called");
        // Get current location hash from window or cache.
        const isResponseHash: boolean = UrlString.hashContainsKnownProperties(hash);
        const cachedHash = this.browserStorage.getTemporaryCache(TemporaryCacheKeys.URL_HASH, true);
        this.browserStorage.removeItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.URL_HASH));

        if (isResponseHash) {
            this.logger.verbose("Hash contains known properties, returning response hash");
            return hash;
        }

        this.logger.verbose("Hash does not contain known properties, returning cached hash");
        return cachedHash;
    }

    /**
     * @param hash
     * @param interactionType
     */
    private validateAndExtractStateFromHash(hash: string, interactionType: InteractionType): string {
        this.logger.verbose("validateAndExtractStateFromHash called");
        // Deserialize hash fragment response parameters.
        const serverParams: ServerAuthorizationCodeResponse = UrlString.getDeserializedHash(hash);
        if (!serverParams.state) {
            throw BrowserAuthError.createHashDoesNotContainStateError();
        }

        const platformStateObj = BrowserProtocolUtils.extractBrowserRequestState(this.browserCrypto, serverParams.state);
        if (!platformStateObj) {
            throw BrowserAuthError.createUnableToParseStateError();
        }

        if (platformStateObj.interactionType !== interactionType) {
            throw BrowserAuthError.createStateInteractionTypeMismatchError();
        }

        this.logger.verbose("Returning state from hash");
        return serverParams.state;
    }

    /**
     * Checks if hash exists and handles in window.
     * @param hash
     * @param state
     */
    private async handleHash(hash: string, state: string): Promise<AuthenticationResult> {
        this.logger.verbose("handleHash called");
        const cachedRequest = this.browserStorage.getCachedRequest(state, this.browserCrypto);
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.handleRedirectPromise, cachedRequest.correlationId);

        try {
            // Hash contains known properties - handle and return in callback
            const currentAuthority = this.browserStorage.getCachedAuthority(state);
            if (!currentAuthority) {
                throw BrowserAuthError.createNoCachedAuthorityError();
            }

            const authClient = await this.createAuthCodeClient(serverTelemetryManager, currentAuthority);
            const interactionHandler = new RedirectHandler(authClient, this.browserStorage, cachedRequest, this.browserCrypto);
            return await interactionHandler.handleCodeResponse(hash, state, authClient.authority, this.networkClient, this.config.auth.clientId);
        } catch (e) {
            serverTelemetryManager.cacheFailedRequest(e);
            this.browserStorage.cleanRequestByInteractionType(InteractionType.Redirect);
            throw e;
        }
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
            this.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Redirect, request);
        } else {
            this.emitEvent(EventType.LOGIN_START, InteractionType.Redirect, request);
        }

        const validRequest: AuthorizationUrlRequest = this.preflightInteractiveRequest(request, InteractionType.Redirect);
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenRedirect, validRequest.correlationId);

        try {
            // Create auth code request and generate PKCE params
            const authCodeRequest: CommonAuthorizationCodeRequest = await this.initializeAuthorizationCodeRequest(validRequest);

            // Initialize the client
            const authClient: AuthorizationCodeClient = await this.createAuthCodeClient(serverTelemetryManager, validRequest.authority);

            // Create redirect interaction handler.
            const interactionHandler = new RedirectHandler(authClient, this.browserStorage, authCodeRequest, this.browserCrypto);

            // Create acquire token url.
            const navigateUrl = await authClient.getAuthCodeUrl(validRequest);

            const redirectStartPage = this.getRedirectStartPage(request.redirectStartPage);

            // Show the UI once the url has been created. Response will come back in the hash, which will be handled in the handleRedirectCallback function.
            return interactionHandler.initiateAuthRequest(navigateUrl, {
                navigationClient: this.navigationClient,
                redirectTimeout: this.config.system.redirectNavigationTimeout,
                redirectStartPage: redirectStartPage,
                onRedirectNavigate: request.onRedirectNavigate
            });
        } catch (e) {
            // If logged in, emit acquire token events
            if (isLoggedIn) {
                this.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Redirect, null, e);
            } else {
                this.emitEvent(EventType.LOGIN_FAILURE, InteractionType.Redirect, null, e);
            }

            serverTelemetryManager.cacheFailedRequest(e);
            this.browserStorage.cleanRequestByState(validRequest.state);
            throw e;
        }
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
            this.logger.verbose("acquireTokenPopup called");
            validRequest = this.preflightInteractiveRequest(request, InteractionType.Popup);
        } catch (e) {
            // Since this function is syncronous we need to reject
            return Promise.reject(e);
        }

        const popupName = PopupUtils.generatePopupName(this.config.auth.clientId, validRequest);

        // asyncPopups flag is true. Acquires token without first opening popup. Popup will be opened later asynchronously.
        if (this.config.system.asyncPopups) {
            this.logger.verbose("asyncPopups set to true, acquiring token");
            return this.acquireTokenPopupAsync(validRequest, popupName);
        } else {
            // asyncPopups flag is set to false. Opens popup before acquiring token.
            this.logger.verbose("asyncPopup set to false, opening popup before acquiring token");
            const popup = PopupUtils.openSizedPopup("about:blank", popupName);
            return this.acquireTokenPopupAsync(validRequest, popupName, popup);
        }
    }

    /**
     * Helper which obtains an access_token for your API via opening a popup window in the user's browser
     * @param validRequest
     * @param popupName
     * @param popup
     *
     * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
     */
    private async acquireTokenPopupAsync(validRequest: AuthorizationUrlRequest, popupName: string, popup?: Window|null): Promise<AuthenticationResult> {
        this.logger.verbose("acquireTokenPopupAsync called");
        // If logged in, emit acquire token events
        const loggedInAccounts = this.getAllAccounts();
        if (loggedInAccounts.length > 0) {
            this.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Popup, validRequest);
        } else {
            this.emitEvent(EventType.LOGIN_START, InteractionType.Popup, validRequest);
        }

        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenPopup, validRequest.correlationId);

        try {
            // Create auth code request and generate PKCE params
            const authCodeRequest: CommonAuthorizationCodeRequest = await this.initializeAuthorizationCodeRequest(validRequest);

            // Initialize the client
            const authClient: AuthorizationCodeClient = await this.createAuthCodeClient(serverTelemetryManager, validRequest.authority);

            // Create acquire token url.
            const navigateUrl = await authClient.getAuthCodeUrl(validRequest);

            // Create popup interaction handler.
            const interactionHandler = new PopupHandler(authClient, this.browserStorage, authCodeRequest);

            // Show the UI once the url has been created. Get the window handle for the popup.
            const popupParameters: PopupParams = {
                popup,
                popupName
            };
            const popupWindow: Window = interactionHandler.initiateAuthRequest(navigateUrl, popupParameters);
            this.emitEvent(EventType.POPUP_OPENED, InteractionType.Popup, {popupWindow}, null);

            // Monitor the window for the hash. Return the string value and close the popup when the hash is received. Default timeout is 60 seconds.
            const hash = await interactionHandler.monitorPopupForHash(popupWindow);
            const state = this.validateAndExtractStateFromHash(hash, InteractionType.Popup);

            // Remove throttle if it exists
            ThrottlingUtils.removeThrottle(this.browserStorage, this.config.auth.clientId, authCodeRequest.authority, authCodeRequest.scopes);

            // Handle response from hash string.
            const result = await interactionHandler.handleCodeResponse(hash, state, authClient.authority, this.networkClient);

            // If logged in, emit acquire token events
            const isLoggingIn = loggedInAccounts.length < this.getAllAccounts().length;
            if (isLoggingIn) {
                this.emitEvent(EventType.LOGIN_SUCCESS, InteractionType.Popup, result);
            } else {
                this.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Popup, result);
            }

            return result;
        } catch (e) {
            if (loggedInAccounts.length > 0) {
                this.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Popup, null, e);
            } else {
                this.emitEvent(EventType.LOGIN_FAILURE, InteractionType.Popup, null, e);
            }
            
            if (popup) {
                // Close the synchronous popup if an error is thrown before the window unload event is registered
                popup.close();
            }

            serverTelemetryManager.cacheFailedRequest(e);
            this.browserStorage.cleanRequestByState(validRequest.state);
            throw e;
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
        this.logger.verbose("ssoSilent called");
        this.emitEvent(EventType.SSO_SILENT_START, InteractionType.Silent, request);

        try {
            const silentTokenResult = await this.acquireTokenByIframe(request, ApiId.ssoSilent);
            this.emitEvent(EventType.SSO_SILENT_SUCCESS, InteractionType.Silent, silentTokenResult);
            return silentTokenResult;
        } catch (e) {
            this.emitEvent(EventType.SSO_SILENT_FAILURE, InteractionType.Silent, null, e);
            throw e;
        }
    }

    /**
     * This function uses a hidden iframe to fetch an authorization code from the eSTS. To be used for silent refresh token acquisition and renewal.
     * @param request
     * @param apiId - ApiId of the calling function. Used for telemetry.
     */
    private async acquireTokenByIframe(request: SsoSilentRequest, apiId: ApiId): Promise<AuthenticationResult> {
        this.logger.verbose("acquireTokenByIframe called");
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

        const serverTelemetryManager = this.initializeServerTelemetryManager(apiId, silentRequest.correlationId);

        try {
            // Create auth code request and generate PKCE params
            const authCodeRequest: CommonAuthorizationCodeRequest = await this.initializeAuthorizationCodeRequest(silentRequest);

            // Initialize the client
            const authClient: AuthorizationCodeClient = await this.createAuthCodeClient(serverTelemetryManager, silentRequest.authority);

            // Create authorize request url
            const navigateUrl = await authClient.getAuthCodeUrl(silentRequest);

            return await this.silentTokenHelper(navigateUrl, authCodeRequest, authClient);
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
        this.emitEvent(EventType.ACQUIRE_TOKEN_NETWORK_START, InteractionType.Silent, request);
        // block the reload if it occurred inside a hidden iframe
        BrowserUtils.blockReloadInHiddenIframes();
        const silentRequest: CommonSilentFlowRequest = {
            ...request,
            ...this.initializeBaseRequest(request)
        };
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenSilent_silentFlow, silentRequest.correlationId);
        try {
            const refreshTokenClient = await this.createRefreshTokenClient(serverTelemetryManager, silentRequest.authority);
            // Send request to renew token. Auth module will throw errors if token cannot be renewed.
            return await refreshTokenClient.acquireTokenByRefreshToken(silentRequest);
        } catch (e) {
            serverTelemetryManager.cacheFailedRequest(e);
            const isServerError = e instanceof ServerError;
            const isInteractionRequiredError = e instanceof InteractionRequiredAuthError;
            const isInvalidGrantError = (e.errorCode === BrowserConstants.INVALID_GRANT_ERROR);
            if (isServerError && isInvalidGrantError && !isInteractionRequiredError) {
                this.logger.verbose("Refresh token expired or invalid, attempting acquire token by iframe");
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
    private async silentTokenHelper(navigateUrl: string, authCodeRequest: CommonAuthorizationCodeRequest, authClient: AuthorizationCodeClient): Promise<AuthenticationResult> {
        // Create silent handler
        const silentHandler = new SilentHandler(authClient, this.browserStorage, authCodeRequest, this.config.system.navigateFrameWait);
        // Get the frame handle for the silent request
        const msalFrame = await silentHandler.initiateAuthRequest(navigateUrl);
        // Monitor the window for the hash. Return the string value and close the popup when the hash is received. Default timeout is 60 seconds.
        const hash = await silentHandler.monitorIframeForHash(msalFrame, this.config.system.iframeHashTimeout);
        const state = this.validateAndExtractStateFromHash(hash, InteractionType.Silent);

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
        this.logger.verbose("logoutRedirect called");
        const validLogoutRequest = this.initializeLogoutRequest(logoutRequest);
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.logout, validLogoutRequest.correlationId);

        try {
            this.emitEvent(EventType.LOGOUT_START, InteractionType.Redirect, logoutRequest);
            const authClient = await this.createAuthCodeClient(serverTelemetryManager, logoutRequest && logoutRequest.authority);
            // create logout string and navigate user window to logout. Auth module will clear cache.
            const logoutUri: string = authClient.getLogoutUri(validLogoutRequest);
            
            if (!validLogoutRequest.account || AccountEntity.accountInfoIsEqual(validLogoutRequest.account, this.getActiveAccount(), false)) {
                this.logger.verbose("Setting active account to null");
                this.setActiveAccount(null);
            }
            
            const navigationOptions: NavigationOptions = {
                apiId: ApiId.logout,
                timeout: this.config.system.redirectNavigationTimeout,
                noHistory: false
            };
            
            this.emitEvent(EventType.LOGOUT_SUCCESS, InteractionType.Redirect, validLogoutRequest);
            // Check if onRedirectNavigate is implemented, and invoke it if so
            if (logoutRequest && typeof logoutRequest.onRedirectNavigate === "function") {
                const navigate = logoutRequest.onRedirectNavigate(logoutUri);

                if (navigate !== false) {
                    this.logger.verbose("Logout onRedirectNavigate did not return false, navigating");
                    await this.navigationClient.navigateExternal(logoutUri, navigationOptions);
                    return;
                } else {
                    this.logger.verbose("Logout onRedirectNavigate returned false, stopping navigation");
                }
            } else {
                await this.navigationClient.navigateExternal(logoutUri, navigationOptions);
                return;
            }
        } catch(e) {
            serverTelemetryManager.cacheFailedRequest(e);
            this.emitEvent(EventType.LOGOUT_FAILURE, InteractionType.Redirect, null, e);
            throw e;
        }

        this.emitEvent(EventType.LOGOUT_END, InteractionType.Redirect);
    }

    /**
     * Clears local cache for the current user then opens a popup window prompting the user to sign-out of the server
     * @param logoutRequest 
     */
    logoutPopup(logoutRequest?: EndSessionPopupRequest): Promise<void> {
        let validLogoutRequest: CommonEndSessionRequest;
        try {
            this.preflightBrowserEnvironmentCheck(InteractionType.Popup);
            this.logger.verbose("logoutPopup called");
            validLogoutRequest = this.initializeLogoutRequest(logoutRequest);
        } catch (e) {
            // Since this function is synchronous we need to reject
            return Promise.reject(e);
        }

        const popupName = PopupUtils.generateLogoutPopupName(this.config.auth.clientId, validLogoutRequest);
        let popup;

        // asyncPopups flag is true. Acquires token without first opening popup. Popup will be opened later asynchronously.
        if (this.config.system.asyncPopups) {
            this.logger.verbose("asyncPopups set to true");
        } else {
            // asyncPopups flag is set to false. Opens popup before logging out.
            this.logger.verbose("asyncPopup set to false, opening popup");
            popup = PopupUtils.openSizedPopup("about:blank", popupName);
        }

        const authority = logoutRequest && logoutRequest.authority;
        const mainWindowRedirectUri = logoutRequest && logoutRequest.mainWindowRedirectUri;
        return this.logoutPopupAsync(validLogoutRequest, popupName, authority, popup, mainWindowRedirectUri);
    }

    /**
     * 
     * @param request 
     * @param popupName 
     * @param requestAuthority
     * @param popup 
     */
    private async logoutPopupAsync(validRequest: CommonEndSessionRequest, popupName: string, requestAuthority?: string, popup?: Window|null, mainWindowRedirectUri?: string): Promise<void> {
        this.logger.verbose("logoutPopupAsync called");
        this.emitEvent(EventType.LOGOUT_START, InteractionType.Popup, validRequest);
        
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.logoutPopup, validRequest.correlationId);
        
        try {
            this.browserStorage.setTemporaryCache(TemporaryCacheKeys.INTERACTION_STATUS_KEY, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE, true);
            // Initialize the client
            const authClient = await this.createAuthCodeClient(serverTelemetryManager, requestAuthority);

            // create logout string and navigate user window to logout. Auth module will clear cache.
            const logoutUri: string = authClient.getLogoutUri(validRequest);
            if (!validRequest.account || AccountEntity.accountInfoIsEqual(validRequest.account, this.getActiveAccount(), false)) {
                this.logger.verbose("Setting active account to null");
                this.setActiveAccount(null);
            }

            this.emitEvent(EventType.LOGOUT_SUCCESS, InteractionType.Popup, validRequest);

            const popupUtils = new PopupUtils(this.browserStorage, this.logger);
            // Open the popup window to requestUrl.
            const popupWindow = popupUtils.openPopup(logoutUri, popupName, popup);
            this.emitEvent(EventType.POPUP_OPENED, InteractionType.Popup, {popupWindow}, null);

            try {
                // Don't care if this throws an error (User Cancelled)
                await popupUtils.monitorPopupForSameOrigin(popupWindow);
                this.logger.verbose("Popup successfully redirected to postLogoutRedirectUri");
            } catch (e) {
                this.logger.verbose(`Error occurred while monitoring popup for same origin. Session on server may remain active. Error: ${e}`);
            }

            popupUtils.cleanPopup(popupWindow);

            if (mainWindowRedirectUri) {
                const navigationOptions: NavigationOptions = {
                    apiId: ApiId.logoutPopup,
                    timeout: this.config.system.redirectNavigationTimeout,
                    noHistory: false
                };
                const absoluteUrl = UrlString.getAbsoluteUrl(mainWindowRedirectUri, BrowserUtils.getCurrentUri());

                this.logger.verbose("Redirecting main window to url specified in the request");
                this.logger.verbosePii(`Redirecing main window to: ${absoluteUrl}`);
                this.navigationClient.navigateInternal(absoluteUrl, navigationOptions);
            } else {
                this.logger.verbose("No main window navigation requested");
            }

        } catch (e) {
            if (popup) {
                // Close the synchronous popup if an error is thrown before the window unload event is registered
                popup.close();
            }
            
            this.browserStorage.removeItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.INTERACTION_STATUS_KEY));
            this.emitEvent(EventType.LOGOUT_FAILURE, InteractionType.Popup, null, e);
            serverTelemetryManager.cacheFailedRequest(e);
            throw e;
        }

        this.emitEvent(EventType.LOGOUT_END, InteractionType.Popup);
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
        if (account) {
            this.logger.verbose("setActiveAccount: Active account set");
            this.activeLocalAccountId = account.localAccountId;
        } else {
            this.logger.verbose("setActiveAccount: No account passed, active account not set");
            this.activeLocalAccountId = null;
        }
    }

    /**
     * Gets the currently active account
     */
    getActiveAccount(): AccountInfo | null {
        if (!this.activeLocalAccountId) {
            this.logger.verbose("getActiveAccount: No active account");
            return null;
        }

        return this.getAccountByLocalId(this.activeLocalAccountId);
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
     * Use to get the redirectStartPage either from request or use current window
     * @param requestStartPage
     */
    protected getRedirectStartPage(requestStartPage?: string): string {
        this.logger.verbose("getRedirectStartPage called");
        const redirectStartPage = requestStartPage || window.location.href;
        return UrlString.getAbsoluteUrl(redirectStartPage, BrowserUtils.getCurrentUri());
    }

    /**
     * Used to get a discovered version of the default authority.
     * @param requestAuthority
     */
    async getDiscoveredAuthority(requestAuthority?: string): Promise<Authority> {
        this.logger.verbose("getDiscoveredAuthority called");
        const authorityOptions: AuthorityOptions = {
            protocolMode: this.config.auth.protocolMode,
            knownAuthorities: this.config.auth.knownAuthorities,
            cloudDiscoveryMetadata: this.config.auth.cloudDiscoveryMetadata,
            authorityMetadata: this.config.auth.authorityMetadata
        };

        if (requestAuthority) {
            this.logger.verbose("Creating discovered authority with request authority");
            return await AuthorityFactory.createDiscoveredInstance(requestAuthority, this.config.system.networkClient, this.browserStorage, authorityOptions);
        }

        this.logger.verbose("Creating discovered authority with configured authority");
        return await AuthorityFactory.createDiscoveredInstance(this.config.auth.authority, this.config.system.networkClient, this.browserStorage, authorityOptions);
    }

    /**
     * Helper to check whether interaction is in progress.
     */
    protected interactionInProgress(): boolean {
        // Check whether value in cache is present and equal to expected value
        return (this.browserStorage.getTemporaryCache(TemporaryCacheKeys.INTERACTION_STATUS_KEY, true)) === BrowserConstants.INTERACTION_IN_PROGRESS_VALUE;
    }

    /**
     * Creates an Authorization Code Client with the given authority, or the default authority.
     * @param serverTelemetryManager
     * @param authorityUrl
     */
    protected async createAuthCodeClient(serverTelemetryManager: ServerTelemetryManager, authorityUrl?: string): Promise<AuthorizationCodeClient> {
        this.logger.verbose("createAuthCodeClient called");
        // Create auth module.
        const clientConfig = await this.getClientConfiguration(serverTelemetryManager, authorityUrl);
        return new AuthorizationCodeClient(clientConfig);
    }

    /**
     * Creates an Silent Flow Client with the given authority, or the default authority.
     * @param serverTelemetryManager
     * @param authorityUrl
     */
    protected async createSilentFlowClient(serverTelemetryManager: ServerTelemetryManager, authorityUrl?: string): Promise<SilentFlowClient> {
        this.logger.verbose("createSilentFlowClient called");
        // Create auth module.
        const clientConfig = await this.getClientConfiguration(serverTelemetryManager, authorityUrl);
        return new SilentFlowClient(clientConfig);
    }

    /**
     * Creates a Refresh Client with the given authority, or the default authority.
     * @param serverTelemetryManager
     * @param authorityUrl
     */
    protected async createRefreshTokenClient(serverTelemetryManager: ServerTelemetryManager, authorityUrl?: string): Promise<RefreshTokenClient> {
        this.logger.verbose("createRefreshTokenClient called");
        // Create auth module.
        const clientConfig = await this.getClientConfiguration(serverTelemetryManager, authorityUrl);
        return new RefreshTokenClient(clientConfig);
    }

    /**
     * Creates a Client Configuration object with the given request authority, or the default authority.
     * @param serverTelemetryManager
     * @param requestAuthority
     */
    protected async getClientConfiguration(serverTelemetryManager: ServerTelemetryManager, requestAuthority?: string): Promise<ClientConfiguration> {
        this.logger.verbose("getClientConfiguration called");
        const discoveredAuthority = await this.getDiscoveredAuthority(requestAuthority);

        return {
            authOptions: {
                clientId: this.config.auth.clientId,
                authority: discoveredAuthority,
                clientCapabilities: this.config.auth.clientCapabilities
            },
            systemOptions: {
                tokenRenewalOffsetSeconds: this.config.system.tokenRenewalOffsetSeconds
            },
            loggerOptions: {
                loggerCallback: this.config.system.loggerOptions.loggerCallback,
                piiLoggingEnabled: this.config.system.loggerOptions.piiLoggingEnabled
            },
            cryptoInterface: this.browserCrypto,
            networkInterface: this.networkClient,
            storageInterface: this.browserStorage,
            serverTelemetryManager: serverTelemetryManager,
            libraryInfo: {
                sku: BrowserConstants.MSAL_SKU,
                version: version,
                cpu: "",
                os: ""
            }
        };
    }

    /**
     * Helper to validate app environment before making a request.
     * @param request
     * @param interactionType
     */
    protected preflightInteractiveRequest(request: RedirectRequest|PopupRequest, interactionType: InteractionType): AuthorizationUrlRequest {
        this.logger.verbose("preflightInteractiveRequest called, validating app environment");
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
        this.logger.verbose("Initializing BaseAuthRequest");
        const authority = request.authority || this.config.auth.authority;

        const scopes = [...((request && request.scopes) || [])];
        const correlationId = (request && request.correlationId) || this.browserCrypto.createNewGuid();

        // Set authenticationScheme to BEARER if not explicitly set in the request
        if (!request.authenticationScheme) {
            request.authenticationScheme = AuthenticationScheme.BEARER;
            this.logger.verbose("Authentication Scheme wasn't explicitly set in request, defaulting to \"Bearer\" request");
        } else {
            this.logger.verbose(`Authentication Scheme set to "${request.authenticationScheme}" as configured in Auth request`);
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
     *
     * @param apiId
     * @param correlationId
     * @param forceRefresh
     */
    protected initializeServerTelemetryManager(apiId: number, correlationId: string, forceRefresh?: boolean): ServerTelemetryManager {
        this.logger.verbose("initializeServerTelemetryManager called");
        const telemetryPayload: ServerTelemetryRequest = {
            clientId: this.config.auth.clientId,
            correlationId: correlationId,
            apiId: apiId,
            forceRefresh: forceRefresh || false,
            wrapperSKU: this.wrapperSKU,
            wrapperVer: this.wrapperVer
        };

        return new ServerTelemetryManager(telemetryPayload, this.browserStorage);
    }

    /**
     * Helper to initialize required request parameters for interactive APIs and ssoSilent()
     * @param request
     * @param interactionType
     */
    protected initializeAuthorizationRequest(request: RedirectRequest|PopupRequest|SsoSilentRequest, interactionType: InteractionType): AuthorizationUrlRequest {
        this.logger.verbose("initializeAuthorizationRequest called");
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

        this.browserStorage.updateCacheEntries(validatedRequest.state, validatedRequest.nonce, validatedRequest.authority);

        return validatedRequest;
    }

    /**
     * Generates an auth code request tied to the url request.
     * @param request
     */
    protected async initializeAuthorizationCodeRequest(request: AuthorizationUrlRequest): Promise<CommonAuthorizationCodeRequest> {
        const generatedPkceParams = await this.browserCrypto.generatePkceCodes();

        // Generate Session Transport Key for Refresh Token Binding
        const sessionTransportKeyThumbprint = await this.browserCrypto.getPublicKeyThumbprint(request, CryptoKeyTypes.stk_jwk);
        request.stkJwk = sessionTransportKeyThumbprint;
        
        const authCodeRequest: CommonAuthorizationCodeRequest = {
            ...request,
            redirectUri: request.redirectUri,
            code: "",
            codeVerifier: generatedPkceParams.verifier
        };

        request.codeChallenge = generatedPkceParams.challenge;
        request.codeChallengeMethod = Constants.S256_CODE_CHALLENGE_METHOD;

        return authCodeRequest;
    }

    /**
     * Initializer for the logout request.
     * @param logoutRequest
     */
    protected initializeLogoutRequest(logoutRequest?: EndSessionRequest): CommonEndSessionRequest {
        this.logger.verbose("initializeLogoutRequest called");

        // Check if interaction is in progress. Throw error if true.
        if (this.interactionInProgress()) {
            throw BrowserAuthError.createInteractionInProgressError();
        }

        const validLogoutRequest: CommonEndSessionRequest = {
            correlationId: this.browserCrypto.createNewGuid(),
            ...logoutRequest
        };

        /*
         * Only set redirect uri if logout request isn't provided or the set uri isn't null.
         * Otherwise, use passed uri, config, or current page.
         */
        if (!logoutRequest || logoutRequest.postLogoutRedirectUri !== null) {
            if (logoutRequest && logoutRequest.postLogoutRedirectUri) {
                this.logger.verbose("Setting postLogoutRedirectUri to uri set on logout request");
                validLogoutRequest.postLogoutRedirectUri = UrlString.getAbsoluteUrl(logoutRequest.postLogoutRedirectUri, BrowserUtils.getCurrentUri());
            } else if (this.config.auth.postLogoutRedirectUri === null) {
                this.logger.verbose("postLogoutRedirectUri configured as null and no uri set on request, not passing post logout redirect");
            } else if (this.config.auth.postLogoutRedirectUri) {
                this.logger.verbose("Setting postLogoutRedirectUri to configured uri");
                validLogoutRequest.postLogoutRedirectUri = UrlString.getAbsoluteUrl(this.config.auth.postLogoutRedirectUri, BrowserUtils.getCurrentUri());
            } else {
                this.logger.verbose("Setting postLogoutRedirectUri to current page");
                validLogoutRequest.postLogoutRedirectUri = UrlString.getAbsoluteUrl(BrowserUtils.getCurrentUri(), BrowserUtils.getCurrentUri());
            }
        } else {
            this.logger.verbose("postLogoutRedirectUri passed as null, not settibng post logout redirect uri");
        }

        return validLogoutRequest;
    }

    /**
     * Emits events by calling callback with event message
     * @param eventType
     * @param interactionType
     * @param payload
     * @param error
     */
    protected emitEvent(eventType: EventType, interactionType?: InteractionType, payload?: EventPayload, error?: EventError): void {
        if (this.isBrowserEnvironment) {
            const message: EventMessage = {
                eventType: eventType,
                interactionType: interactionType || null,
                payload: payload || null,
                error: error || null,
                timestamp: Date.now()
            };

            this.logger.info(`Emitting event: ${eventType}`);

            this.eventCallbacks.forEach((callback: EventCallbackFunction, callbackId: string) => {
                this.logger.verbose(`Emitting event to callback ${callbackId}: ${eventType}`);
                callback.apply(null, [message]);
            });
        }
    }

    /**
     * Adds event callbacks to array
     * @param callback
     */
    addEventCallback(callback: EventCallbackFunction): string | null {
        if (this.isBrowserEnvironment) {
            const callbackId = this.browserCrypto.createNewGuid();
            this.eventCallbacks.set(callbackId, callback);
            this.logger.verbose(`Event callback registered with id: ${callbackId}`);

            return callbackId;
        }

        return null;
    }

    /**
     * Removes callback with provided id from callback array
     * @param callbackId
     */
    removeEventCallback(callbackId: string): void {
        this.eventCallbacks.delete(callbackId);
        this.logger.verbose(`Event callback ${callbackId} removed.`);
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
        this.wrapperSKU = sku;
        this.wrapperVer = version;
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

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CryptoOps } from "../crypto/CryptoOps";
import { BrowserStorage } from "../cache/BrowserStorage";
import { Authority, TrustedAuthority, StringUtils, CacheSchemaType, UrlString, ServerAuthorizationCodeResponse, AuthorizationCodeRequest, AuthorizationUrlRequest, AuthorizationCodeClient, PromptValue, SilentFlowRequest, ServerError, InteractionRequiredAuthError, EndSessionRequest, AccountInfo, AuthorityFactory, ServerTelemetryManager, SilentFlowClient, ClientConfiguration, BaseAuthRequest, ServerTelemetryRequest, PersistentCacheKeys, IdToken, ProtocolUtils, ResponseMode, Constants, INetworkModule, AuthenticationResult, Logger, ThrottlingUtils, RefreshTokenClient } from "@azure/msal-common";
import { buildConfiguration, Configuration } from "../config/Configuration";
import { TemporaryCacheKeys, InteractionType, ApiId, BrowserConstants } from "../utils/BrowserConstants";
import { BrowserUtils } from "../utils/BrowserUtils";
import { BrowserStateObject, BrowserProtocolUtils } from "../utils/BrowserProtocolUtils";
import { RedirectHandler } from "../interaction_handler/RedirectHandler";
import { PopupHandler } from "../interaction_handler/PopupHandler";
import { SilentHandler } from "../interaction_handler/SilentHandler";
import { RedirectRequest } from "../request/RedirectRequest";
import { PopupRequest } from "../request/PopupRequest";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { SilentRequest } from "../request/SilentRequest";
import { SsoSilentRequest } from "../request/SsoSilentRequest";
import { version } from "../../package.json";
import { BroadcastService } from "../event/BroadcastService";
import { BroadcastEvent } from "../event/EventConstants";

export abstract class ClientApplication {

    // Crypto interface implementation
    protected readonly browserCrypto: CryptoOps;

    // Storage interface implementation
    protected readonly browserStorage: BrowserStorage;

    // Network interface implementation
    protected readonly networkClient: INetworkModule;

    // Response promise
    protected readonly tokenExchangePromise: Promise<AuthenticationResult>;

    // Input configuration by developer/user
    protected config: Configuration;

    // Default authority
    protected defaultAuthority: Authority;

    // Logger
    protected logger: Logger;

    // Broadcast service
    public broadcastService: BroadcastService;

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
        // Set the configuration.
        this.config = buildConfiguration(configuration);

        // Initialize the crypto class.
        this.browserCrypto = new CryptoOps();

        // Initialize the network module class.
        this.networkClient = this.config.system.networkClient;

        // Initialize the browser storage class.
        this.browserStorage = new BrowserStorage(this.config.auth.clientId, this.config.cache, this.browserCrypto);

        // Initialize logger
        this.logger = new Logger(this.config.system.loggerOptions);
        
        // Initialize broadcast service
        this.broadcastService = new BroadcastService();

        // Initialize default authority instance
        TrustedAuthority.setTrustedAuthoritiesFromConfig(this.config.auth.knownAuthorities, this.config.auth.cloudDiscoveryMetadata);

        this.defaultAuthority = null;
    }

    // #region Redirect Flow
    
    /**
     * Event handler function which allows users to fire events after the PublicClientApplication object
     * has loaded during redirect flows. This should be invoked on all page loads involved in redirect
     * auth flows.
     * @returns {Promise.<AuthenticationResult | null>} token response or null. If the return value is null, then no auth redirect was detected.
     */
    async handleRedirectPromise(): Promise<AuthenticationResult | null> {
        return this.handleRedirectResponse();
    }

    /**
     * Checks if navigateToLoginRequestUrl is set, and:
     * - if true, performs logic to cache and navigate
     * - if false, handles hash string and parses response
     */
    private async handleRedirectResponse(): Promise<AuthenticationResult | null> {
        this.broadcast(BroadcastEvent.HANDLE_REDIRECT_START);

        if (!this.interactionInProgress()) {
            this.logger.info("handleRedirectPromise called but there is no interaction in progress, returning null.");
            return null;
        }

        const responseHash = this.getRedirectResponseHash();
        if (StringUtils.isEmpty(responseHash)) {
            // Not a recognized server response hash or hash not associated with a redirect request
            return null;
        }

        // If navigateToLoginRequestUrl is true, get the url where the redirect request was initiated
        const loginRequestUrl = this.browserStorage.getItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.ORIGIN_URI), CacheSchemaType.TEMPORARY) as string;
        const loginRequestUrlNormalized = UrlString.removeHashFromUrl(loginRequestUrl || "");
        const currentUrlNormalized = UrlString.removeHashFromUrl(window.location.href);

        if (loginRequestUrlNormalized === currentUrlNormalized && this.config.auth.navigateToLoginRequestUrl) {
            if (loginRequestUrl.indexOf("#") > -1) {
                // Replace current hash with non-msal hash, if present
                BrowserUtils.replaceHash(loginRequestUrl);
            }
            // We are on the page we need to navigate to - handle hash
            return this.handleHash(responseHash);
        } else if (!this.config.auth.navigateToLoginRequestUrl) {
            return this.handleHash(responseHash);
        } else if (!BrowserUtils.isInIframe()) {
            /*
             * Returned from authority using redirect - need to perform navigation before processing response
             * Cache the hash to be retrieved after the next redirect
             */
            const hashKey = this.browserStorage.generateCacheKey(TemporaryCacheKeys.URL_HASH);
            this.browserStorage.setItem(hashKey, responseHash, CacheSchemaType.TEMPORARY);
            if (!loginRequestUrl || loginRequestUrl === "null") {
                // Redirect to home page if login request url is null (real null or the string null)
                const homepage = BrowserUtils.getHomepage();
                // Cache the homepage under ORIGIN_URI to ensure cached hash is processed on homepage
                this.browserStorage.setItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.ORIGIN_URI), homepage, CacheSchemaType.TEMPORARY);
                this.logger.warning("Unable to get valid login request url from cache, redirecting to home page");
                BrowserUtils.navigateWindow(homepage, true);
            } else {
                // Navigate to page that initiated the redirect request
                BrowserUtils.navigateWindow(loginRequestUrl, true);
            }
        }

        return null;
    }

    /**
     * Gets the response hash for a redirect request
     * Returns null if interactionType in the state value is not "redirect" or the hash does not contain known properties
     * @returns {string}
     */
    private getRedirectResponseHash(): string | null {
        // Get current location hash from window or cache.
        const { location: { hash } } = window;
        const isResponseHash: boolean = UrlString.hashContainsKnownProperties(hash);
        const cachedHash: string = this.browserStorage.getItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.URL_HASH), CacheSchemaType.TEMPORARY) as string;
        this.browserStorage.removeItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.URL_HASH));

        const responseHash: string = isResponseHash ? hash : cachedHash;
        if (responseHash) {
            // Deserialize hash fragment response parameters.
            const serverParams: ServerAuthorizationCodeResponse = UrlString.getDeserializedHash(responseHash);
            const platformStateObj: BrowserStateObject = BrowserProtocolUtils.extractBrowserRequestState(this.browserCrypto, serverParams.state);
            if (platformStateObj.interactionType !== InteractionType.REDIRECT) {
                return null;
            } else {
                BrowserUtils.clearHash();
                return responseHash;
            }
        }

        // Deserialize hash fragment response parameters.
        const serverParams = BrowserProtocolUtils.parseServerResponseFromHash(hash);

        this.browserStorage.cleanRequest(serverParams.state);
        return null;
    }

    /**
     * Checks if hash exists and handles in window.
     * @param responseHash
     * @param interactionHandler
     */
    private async handleHash(responseHash: string): Promise<AuthenticationResult> {
        const encodedTokenRequest = this.browserStorage.getItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.REQUEST_PARAMS), CacheSchemaType.TEMPORARY) as string;
        const cachedRequest = JSON.parse(this.browserCrypto.base64Decode(encodedTokenRequest)) as AuthorizationCodeRequest;
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.handleRedirectPromise, cachedRequest.correlationId);

        const hashUrlString = new UrlString(responseHash);
        // Deserialize hash fragment response parameters.
        const serverParams = BrowserProtocolUtils.parseServerResponseFromHash(responseHash);

        try {
            // Hash contains known properties - handle and return in callback
            const currentAuthority = this.browserStorage.getCachedAuthority(serverParams.state);
            const authClient = await this.createAuthCodeClient(serverTelemetryManager, currentAuthority);
            const interactionHandler = new RedirectHandler(authClient, this.browserStorage);
            return await interactionHandler.handleCodeResponse(responseHash, this.browserCrypto, this.config.auth.clientId);
        } catch (e) {
            serverTelemetryManager.cacheFailedRequest(e);
            this.browserStorage.cleanRequest(serverParams.state);
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
     * @param {@link (RedirectRequest:type)}
     */
    async acquireTokenRedirect(request: RedirectRequest): Promise<void> {
        this.broadcast(BroadcastEvent.ACQUIRE_TOKEN_START);
        
        // Preflight request
        const validRequest: AuthorizationUrlRequest = this.preflightInteractiveRequest(request, InteractionType.REDIRECT);
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenRedirect, validRequest.correlationId);
        
        try {
            // Create auth code request and generate PKCE params
            const authCodeRequest: AuthorizationCodeRequest = await this.initializeAuthorizationCodeRequest(validRequest);

            // Initialize the client
            const authClient: AuthorizationCodeClient = await this.createAuthCodeClient(serverTelemetryManager, validRequest.authority);

            // Create redirect interaction handler.
            const interactionHandler = new RedirectHandler(authClient, this.browserStorage);

            // Create acquire token url.
            const navigateUrl = await authClient.getAuthCodeUrl(validRequest);

            const redirectStartPage = (request && request.redirectStartPage) || window.location.href;
            // Show the UI once the url has been created. Response will come back in the hash, which will be handled in the handleRedirectCallback function.
            interactionHandler.initiateAuthRequest(navigateUrl, authCodeRequest, redirectStartPage, this.browserCrypto);
        } catch (e) {
            this.broadcast(BroadcastEvent.ACQUIRE_TOKEN_FAILURE);
            serverTelemetryManager.cacheFailedRequest(e);
            this.browserStorage.cleanRequest(validRequest.state);
            throw e;
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
        // asyncPopups flag is true. Acquires token without first opening popup. Popup will be opened later asynchronously.
        if (this.config.system.asyncPopups) {
            return this.acquireTokenPopupAsync(request);
        } else {
            // asyncPopups flag is set to false. Opens popup before acquiring token.
            const popup = PopupHandler.openSizedPopup();
            return this.acquireTokenPopupAsync(request, popup);
        }
    }

    /**
     * Helper which obtains an access_token for your API via opening a popup window in the user's browser
     * @param {@link (PopupRequest:type)}
     *
     * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
     */
    private async acquireTokenPopupAsync(request: PopupRequest, popup?: Window|null): Promise<AuthenticationResult> {
        this.broadcast(BroadcastEvent.ACQUIRE_TOKEN_START);

        // Preflight request
        const validRequest: AuthorizationUrlRequest = this.preflightInteractiveRequest(request, InteractionType.POPUP);
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenPopup, validRequest.correlationId);
        
        try {
            // Create auth code request and generate PKCE params
            const authCodeRequest: AuthorizationCodeRequest = await this.initializeAuthorizationCodeRequest(validRequest);

            // Initialize the client
            const authClient: AuthorizationCodeClient = await this.createAuthCodeClient(serverTelemetryManager, validRequest.authority);

            // Create acquire token url.
            const navigateUrl = await authClient.getAuthCodeUrl(validRequest);

            // Create popup interaction handler.
            const interactionHandler = new PopupHandler(authClient, this.browserStorage);

            // Show the UI once the url has been created. Get the window handle for the popup.
            const popupWindow: Window = interactionHandler.initiateAuthRequest(navigateUrl, authCodeRequest, popup);

            // Monitor the window for the hash. Return the string value and close the popup when the hash is received. Default timeout is 60 seconds.
            const hash = await interactionHandler.monitorPopupForHash(popupWindow, this.config.system.windowHashTimeout);

            // Remove throttle if it exists
            ThrottlingUtils.removeThrottle(this.browserStorage, this.config.auth.clientId, authCodeRequest.authority, authCodeRequest.scopes);

            // Handle response from hash string.
            return await interactionHandler.handleCodeResponse(hash);
        } catch (e) {
            this.broadcast(BroadcastEvent.ACQUIRE_TOKEN_FAILURE);
            serverTelemetryManager.cacheFailedRequest(e);
            this.browserStorage.cleanRequest(validRequest.state);
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
     * @param {@link AuthorizationUrlRequest}
     *
     * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
     */
    async ssoSilent(request: SsoSilentRequest): Promise<AuthenticationResult> {
        this.broadcast(BroadcastEvent.SSO_SILENT_START);

        // block the reload if it occurred inside a hidden iframe
        BrowserUtils.blockReloadInHiddenIframes();

        // Check that we have some SSO data
        if (StringUtils.isEmpty(request.loginHint) && StringUtils.isEmpty(request.sid) && (!request.account || StringUtils.isEmpty(request.account.username))) {
            this.broadcast(BroadcastEvent.SSO_SILENT_FAILURE);
            throw BrowserAuthError.createSilentSSOInsufficientInfoError();
        }

        // Check that prompt is set to none, throw error if it is set to anything else.
        if (request.prompt && request.prompt !== PromptValue.NONE) {
            this.broadcast(BroadcastEvent.SSO_SILENT_FAILURE);
            throw BrowserAuthError.createSilentPromptValueError(request.prompt);
        }

        // Create silent request
        const silentRequest: AuthorizationUrlRequest = this.initializeAuthorizationRequest({
            ...request,
            prompt: PromptValue.NONE
        }, InteractionType.SILENT);

        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.ssoSilent, silentRequest.correlationId);

        try {
            // Create auth code request and generate PKCE params
            const authCodeRequest: AuthorizationCodeRequest = await this.initializeAuthorizationCodeRequest(silentRequest);

            // Initialize the client
            const authClient: AuthorizationCodeClient = await this.createAuthCodeClient(serverTelemetryManager, silentRequest.authority);

            // Create authorize request url
            const navigateUrl = await authClient.getAuthCodeUrl(silentRequest);

            return await this.silentTokenHelper(navigateUrl, authCodeRequest, authClient);
        } catch (e) {
            this.broadcast(BroadcastEvent.SSO_SILENT_FAILURE);
            serverTelemetryManager.cacheFailedRequest(e);
            this.browserStorage.cleanRequest(silentRequest.state);
            throw e;
        }
    }

    /**
     * Use this function to obtain a token before every call to the API / resource provider
     *
     * MSAL return's a cached token when available
     * Or it send's a request to the STS to obtain a new token using a refresh token.
     *
     * @param {@link (SilentRequest:type)}
     *
     * To renew idToken, please pass clientId as the only scope in the Authentication Parameters
     * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
     *
     */
    protected async acquireTokenByRefreshToken(request: SilentRequest): Promise<AuthenticationResult> {
        // block the reload if it occurred inside a hidden iframe
        BrowserUtils.blockReloadInHiddenIframes();
        const silentRequest: SilentFlowRequest = {
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
                return await this.ssoSilent(request);
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
    private async silentTokenHelper(navigateUrl: string, authCodeRequest: AuthorizationCodeRequest, authClient: AuthorizationCodeClient): Promise<AuthenticationResult> {
        // Create silent handler
        const silentHandler = new SilentHandler(authClient, this.browserStorage, this.config.system.loadFrameTimeout);
        // Get the frame handle for the silent request
        const msalFrame = await silentHandler.initiateAuthRequest(navigateUrl, authCodeRequest);
        // Monitor the window for the hash. Return the string value and close the popup when the hash is received. Default timeout is 60 seconds.
        const hash = await silentHandler.monitorIframeForHash(msalFrame, this.config.system.iframeHashTimeout);
        // Handle response from hash string
        return silentHandler.handleCodeResponse(hash);
    }

    // #endregion

    // #region Logout

    /**
     * Use to log out the current user, and redirect the user to the postLogoutRedirectUri.
     * Default behaviour is to redirect the user to `window.location.href`.
     * @param {@link (EndSessionRequest:type)} 
     */
    async logout(logoutRequest?: EndSessionRequest): Promise<void> {
        const validLogoutRequest = this.initializeLogoutRequest(logoutRequest);
        const authClient = await this.createAuthCodeClient(null, validLogoutRequest && validLogoutRequest.authority);
        // create logout string and navigate user window to logout. Auth module will clear cache.
        const logoutUri: string = authClient.getLogoutUri(validLogoutRequest);
        BrowserUtils.navigateWindow(logoutUri);
    }

    // #endregion

    // #region Account APIs

    /**
     * Returns all accounts that MSAL currently has data for.
     * (the account object is created at the time of successful login)
     * or empty array when no accounts are found
     * @returns {@link AccountInfo[]} - Array of account objects in cache
     */
    getAllAccounts(): AccountInfo[] {
        return this.browserStorage.getAllAccounts();
    }

    /**
     * Returns the signed in account matching username.
     * (the account object is created at the time of successful login)
     * or null when no matching account is found.
     * This API is provided for convenience but getAccountById should be used for best reliability
     * @returns {@link AccountInfo} - the account object stored in MSAL
     */
    getAccountByUsername(userName: string): AccountInfo|null {
        const allAccounts = this.getAllAccounts();
        if (!StringUtils.isEmpty(userName) && allAccounts && allAccounts.length) {
            return allAccounts.filter(accountObj => accountObj.username.toLowerCase() === userName.toLowerCase())[0] || null;
        } else {
            return null;
        }
    }

    /**
     * Returns the signed in account matching homeAccountId.
     * (the account object is created at the time of successful login)
     * or null when no matching account is found
     * @returns {@link AccountInfo} - the account object stored in MSAL
     */
    getAccountByHomeId(homeAccountId: string): AccountInfo|null {
        const allAccounts = this.getAllAccounts();
        if (!StringUtils.isEmpty(homeAccountId) && allAccounts && allAccounts.length) {
            return allAccounts.filter(accountObj => accountObj.homeAccountId === homeAccountId)[0] || null;
        } else {
            return null;
        }
    }

    // #endregion

    // #region Helpers

    /**
     *
     * Use to get the redirect uri configured in MSAL or null.
     * @returns {string} redirect URL
     *
     */
    protected getRedirectUri(requestRedirectUri?: string): string {
        return requestRedirectUri || this.config.auth.redirectUri || BrowserUtils.getCurrentUri();
    }

    /**
     * Use to get the post logout redirect uri configured in MSAL or null.
     *
     * @returns {string} post logout redirect URL
     */
    protected getPostLogoutRedirectUri(requestPostLogoutRedirectUri?: string): string {
        return requestPostLogoutRedirectUri || this.config.auth.postLogoutRedirectUri || BrowserUtils.getCurrentUri();
    }

    /**
     * Used to get a discovered version of the default authority.
     */
    protected async getDiscoveredDefaultAuthority(): Promise<Authority> {
        if (!this.defaultAuthority) {
            this.defaultAuthority = await AuthorityFactory.createDiscoveredInstance(this.config.auth.authority, this.config.system.networkClient);
        }
        return this.defaultAuthority;
    }

    /**
     * Helper to check whether interaction is in progress.
     */
    protected interactionInProgress(): boolean {
        // Check whether value in cache is present and equal to expected value
        return (this.browserStorage.getItem(this.browserStorage.generateCacheKey(BrowserConstants.INTERACTION_STATUS_KEY), CacheSchemaType.TEMPORARY) as string) === BrowserConstants.INTERACTION_IN_PROGRESS_VALUE;
    }

    /**
     * Creates an Authorization Code Client with the given authority, or the default authority.
     * @param authorityUrl 
     */
    protected async createAuthCodeClient(serverTelemetryManager: ServerTelemetryManager, authorityUrl?: string): Promise<AuthorizationCodeClient> {
        // Create auth module.
        const clientConfig = await this.getClientConfiguration(serverTelemetryManager, authorityUrl);
        return new AuthorizationCodeClient(clientConfig);
    }

    /**
     * Creates an Silent Flow Client with the given authority, or the default authority.
     * @param authorityUrl 
     */
    protected async createSilentFlowClient(serverTelemetryManager: ServerTelemetryManager, authorityUrl?: string): Promise<SilentFlowClient> {
        // Create auth module.
        const clientConfig = await this.getClientConfiguration(serverTelemetryManager, authorityUrl);
        return new SilentFlowClient(clientConfig);
    }

    /**
     * Creates a Refresh Client with the given authority, or the default authority.
     * @param authorityUrl 
     */
    protected async createRefreshTokenClient(serverTelemetryManager: ServerTelemetryManager, authorityUrl?: string): Promise<RefreshTokenClient> {
        // Create auth module.
        const clientConfig = await this.getClientConfiguration(serverTelemetryManager, authorityUrl);
        return new RefreshTokenClient(clientConfig);
    }

    /**
     * Creates a Client Configuration object with the given request authority, or the default authority.
     * @param requestAuthority 
     */
    protected async getClientConfiguration(serverTelemetryManager: ServerTelemetryManager, requestAuthority?: string): Promise<ClientConfiguration> {
        // If the requestAuthority is passed and is not equivalent to the default configured authority, create new authority and discover endpoints. Return default authority otherwise.
        const discoveredAuthority = (!StringUtils.isEmpty(requestAuthority) && requestAuthority !== this.config.auth.authority) ? await AuthorityFactory.createDiscoveredInstance(requestAuthority, this.config.system.networkClient) 
            : await this.getDiscoveredDefaultAuthority();
        return {
            authOptions: {
                clientId: this.config.auth.clientId,
                authority: discoveredAuthority,
                knownAuthorities: this.config.auth.knownAuthorities,
                cloudDiscoveryMetadata: this.config.auth.cloudDiscoveryMetadata,
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
     */
    protected preflightInteractiveRequest(request: RedirectRequest|PopupRequest, interactionType: InteractionType): AuthorizationUrlRequest {
        // block the reload if it occurred inside a hidden iframe
        BrowserUtils.blockReloadInHiddenIframes();

        // Check if interaction is in progress. Throw error if true.
        if (this.interactionInProgress()) {
            throw BrowserAuthError.createInteractionInProgressError();
        }
        
        return this.initializeAuthorizationRequest(request, interactionType);
    }

    /**
     * Initializer function for all request APIs
     * @param request 
     */
    protected initializeBaseRequest(request: BaseAuthRequest): BaseAuthRequest {
        const validatedRequest: BaseAuthRequest = {
            ...request
        };

        if (StringUtils.isEmpty(validatedRequest.authority)) {
            validatedRequest.authority = this.config.auth.authority;
        }

        validatedRequest.correlationId = (request && request.correlationId) || this.browserCrypto.createNewGuid();

        return validatedRequest;
    }

    protected initializeServerTelemetryManager(apiId: number, correlationId: string, forceRefresh?: boolean): ServerTelemetryManager {
        const telemetryPayload: ServerTelemetryRequest = {
            clientId: this.config.auth.clientId,
            correlationId: correlationId,
            apiId: apiId,
            forceRefresh: forceRefresh || false
        };

        return new ServerTelemetryManager(telemetryPayload, this.browserStorage);
    }

    /**
     * Generates a request that will contain the openid and profile scopes.
     * @param request 
     */
    protected setDefaultScopes(request: AuthorizationUrlRequest|RedirectRequest|PopupRequest|SsoSilentRequest): AuthorizationUrlRequest {
        return {
            ...request,
            scopes: [...((request && request.scopes) || [])]
        };
    }

    /**
     * Helper to initialize required request parameters for interactive APIs and ssoSilent()
     * @param request
     */
    protected initializeAuthorizationRequest(request: AuthorizationUrlRequest|RedirectRequest|PopupRequest|SsoSilentRequest, interactionType: InteractionType): AuthorizationUrlRequest {
        let validatedRequest: AuthorizationUrlRequest = {
            ...request,
            ...this.setDefaultScopes(request)
        };

        validatedRequest.redirectUri = this.getRedirectUri(validatedRequest.redirectUri);

        // Check for ADAL SSO
        if (StringUtils.isEmpty(validatedRequest.loginHint)) {
            // Only check for adal token if no SSO params are being used
            const adalIdTokenString = this.browserStorage.getItem(PersistentCacheKeys.ADAL_ID_TOKEN, CacheSchemaType.TEMPORARY) as string;
            if (!StringUtils.isEmpty(adalIdTokenString)) {
                const adalIdToken = new IdToken(adalIdTokenString, this.browserCrypto);
                this.browserStorage.removeItem(PersistentCacheKeys.ADAL_ID_TOKEN);
                if (adalIdToken.claims && adalIdToken.claims.upn) {
                    validatedRequest.loginHint = adalIdToken.claims.upn;
                }
            }
        }

        const browserState: BrowserStateObject = {
            interactionType: interactionType
        };

        validatedRequest.state = ProtocolUtils.setRequestState(
            this.browserCrypto,
            (request && request.state) || "",
            browserState
        );

        if (StringUtils.isEmpty(validatedRequest.nonce)) {
            validatedRequest.nonce = this.browserCrypto.createNewGuid();
        }

        validatedRequest.responseMode = ResponseMode.FRAGMENT;

        validatedRequest = {	
            ...validatedRequest,	
            ...this.initializeBaseRequest(validatedRequest)	
        };

        this.browserStorage.updateCacheEntries(validatedRequest.state, validatedRequest.nonce, validatedRequest.authority);

        return validatedRequest;
    }

    /**
     * Generates an auth code request tied to the url request.
     * @param request 
     */
    protected async initializeAuthorizationCodeRequest(request: AuthorizationUrlRequest): Promise<AuthorizationCodeRequest> {
        const generatedPkceParams = await this.browserCrypto.generatePkceCodes();

        const authCodeRequest: AuthorizationCodeRequest = {
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
    protected initializeLogoutRequest(logoutRequest?: EndSessionRequest): EndSessionRequest {
        const validLogoutRequest = {
            ...logoutRequest
        };
        if (StringUtils.isEmpty(validLogoutRequest.authority)) {
            validLogoutRequest.authority = this.config.auth.authority;
        }

        validLogoutRequest.correlationId = (validLogoutRequest && validLogoutRequest.correlationId) || this.browserCrypto.createNewGuid();

        validLogoutRequest.postLogoutRedirectUri = this.getPostLogoutRedirectUri(logoutRequest ? logoutRequest.postLogoutRedirectUri : "");
        
        return validLogoutRequest;
    }

    /**
     * Broadcast function for events
     * @param type 
     * @param payload 
     */
    broadcast(type: BroadcastEvent, payload?: any) {
        this.broadcastService.broadcast(type, payload);
    }

    // #endregion
}

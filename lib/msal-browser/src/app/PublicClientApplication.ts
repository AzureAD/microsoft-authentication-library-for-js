/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import {
    AuthorizationCodeClient,
    INetworkModule,
    UrlString,
    StringUtils,
    PromptValue,
    ServerError,
    Authority,
    AuthorityFactory,
    InteractionRequiredAuthError,
    TrustedAuthority,
    AuthorizationUrlRequest,
    PersistentCacheKeys,
    IdToken,
    ProtocolUtils,
    AuthorizationCodeRequest,
    Constants,
    CacheSchemaType,
    AuthenticationResult,
    SilentFlowRequest,
    AccountInfo,
    ResponseMode,
    ClientConfiguration,
    SilentFlowClient,
    EndSessionRequest,
    BaseAuthRequest,
    Logger
} from "@azure/msal-common";
import { buildConfiguration, Configuration } from "../config/Configuration";
import { BrowserStorage } from "../cache/BrowserStorage";
import { CryptoOps } from "../crypto/CryptoOps";
import { RedirectHandler } from "../interaction_handler/RedirectHandler";
import { PopupHandler } from "../interaction_handler/PopupHandler";
import { SilentHandler } from "../interaction_handler/SilentHandler";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { BrowserConstants, TemporaryCacheKeys } from "../utils/BrowserConstants";
import { BrowserUtils } from "../utils/BrowserUtils";
import { version } from "../../package.json";
import { IPublicClientApplication } from "./IPublicClientApplication";
import { RedirectRequest } from "../request/RedirectRequest";
import { PopupRequest } from "../request/PopupRequest";

/**
 * The PublicClientApplication class is the object exposed by the library to perform authentication and authorization functions in Single Page Applications
 * to obtain JWT tokens as described in the OAuth 2.0 Authorization Code Flow with PKCE specification.
 */
export class PublicClientApplication implements IPublicClientApplication {

    // Crypto interface implementation
    private readonly browserCrypto: CryptoOps;

    // Storage interface implementation
    private readonly browserStorage: BrowserStorage;

    // Network interface implementation
    private readonly networkClient: INetworkModule;

    // Response promise
    private readonly tokenExchangePromise: Promise<AuthenticationResult>;

    // Input configuration by developer/user
    private config: Configuration;

    // Default authority
    private defaultAuthority: Authority;

    // Logger
    private logger: Logger;

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
        this.browserStorage = new BrowserStorage(this.config.auth.clientId, this.config.cache);

        // Initialize logger
        this.logger = new Logger(this.config.system.loggerOptions);

        // Initialize default authority instance
        TrustedAuthority.setTrustedAuthoritiesFromConfig(this.config.auth.knownAuthorities, this.config.auth.cloudDiscoveryMetadata);

        this.defaultAuthority = null;
    }

    // #region Redirect Flow
    
    /**
     * Event handler function which allows users to fire events after the PublicClientApplication object
     * has loaded during redirect flows. This should be invoked on all page loads involved in redirect
     * auth flows.
     * @returns token response or null. If the return value is null, then no auth redirect was detected.
     */
    async handleRedirectPromise(): Promise<AuthenticationResult | null> {
        return this.handleRedirectResponse();
    }

    /**
     * Checks if navigateToLoginRequestUrl is set, and:
     * - if true, performs logic to cache and navigate
     * - if false, handles hash string and parses response
     */
    private async handleRedirectResponse(): Promise<AuthenticationResult> {
        // Get current location hash from window or cache.
        const { location: { hash } } = window;
        const cachedHash = this.browserStorage.getItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.URL_HASH), CacheSchemaType.TEMPORARY) as string;
        const isResponseHash = UrlString.hashContainsKnownProperties(hash);
        const loginRequestUrl = this.browserStorage.getItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.ORIGIN_URI), CacheSchemaType.TEMPORARY) as string;

        const currentUrlNormalized = UrlString.removeHashFromUrl(window.location.href);
        const loginRequestUrlNormalized = UrlString.removeHashFromUrl(loginRequestUrl || "");
        if (loginRequestUrlNormalized === currentUrlNormalized) {
            if (this.config.auth.navigateToLoginRequestUrl) {
                // Replace current hash with non-msal hash, if present
                BrowserUtils.replaceHash(loginRequestUrl);
            } else {
                BrowserUtils.clearHash();
            }

            return this.handleHash(isResponseHash ? hash : cachedHash);
        }

        if (this.config.auth.navigateToLoginRequestUrl && isResponseHash && !BrowserUtils.isInIframe()) {
            // Returned from authority using redirect - need to perform navigation before processing response
            const hashKey = this.browserStorage.generateCacheKey(TemporaryCacheKeys.URL_HASH);
            this.browserStorage.setItem(hashKey, hash, CacheSchemaType.TEMPORARY);
            if (StringUtils.isEmpty(loginRequestUrl) || loginRequestUrl === "null") {
                // Redirect to home page if login request url is null (real null or the string null)
                this.logger.warning("Unable to get valid login request url from cache, redirecting to home page");
                BrowserUtils.navigateWindow("/", true);
            } else {
                // Navigate to target url
                BrowserUtils.navigateWindow(loginRequestUrl, true);
            }
        }

        return null;
    }

    /**
	 * Checks if hash exists and handles in window.
	 * @param responseHash
	 * @param interactionHandler
	 */
    private async handleHash(responseHash: string): Promise<AuthenticationResult> {
        // There is no hash - clean cache and return null.
        if (StringUtils.isEmpty(responseHash)) {
            this.browserStorage.cleanRequest();
            return null;
        }

        // Hash contains known properties - handle and return in callback
        const currentAuthority = this.browserStorage.getCachedAuthority();
        const authClient = await this.createAuthCodeClient(currentAuthority);
        const interactionHandler = new RedirectHandler(authClient, this.browserStorage);
        return interactionHandler.handleCodeResponse(responseHash, this.browserCrypto);
    }

    /**
     * Use when initiating the login process by redirecting the user's browser to the authorization endpoint. This function redirects the page, so
     * any code that follows this function will not execute.
	 *
	 * IMPORTANT: It is NOT recommended to have code that is dependent on the resolution of the Promise. This function will navigate away from the current
	 * browser window. It currently returns a Promise in order to reflect the asynchronous nature of the code running in this function.
	 *
     * @param {@link (AuthenticationParameters:type)}
     */
    async loginRedirect(request: RedirectRequest): Promise<void> {
        return this.acquireTokenRedirect(request);
    }

    /**
     * Use when you want to obtain an access_token for your API by redirecting the user's browser window to the authorization endpoint. This function redirects
     * the page, so any code that follows this function will not execute.
	 *
	 * IMPORTANT: It is NOT recommended to have code that is dependent on the resolution of the Promise. This function will navigate away from the current
	 * browser window. It currently returns a Promise in order to reflect the asynchronous nature of the code running in this function.
     * @param {@link (AuthenticationParameters:type)}
     *
     * To acquire only idToken, please pass clientId as the only scope in the Authentication Parameters
     */
    async acquireTokenRedirect(request: RedirectRequest): Promise<void> {
        try {
            // Preflight request
            const validRequest: AuthorizationUrlRequest = this.preflightInteractiveRequest(request);

            // Create auth code request and generate PKCE params
            const authCodeRequest: AuthorizationCodeRequest = await this.initializeAuthorizationCodeRequest(validRequest);

            // Initialize the client
            const authClient: AuthorizationCodeClient = await this.createAuthCodeClient(validRequest.authority);

            // Create redirect interaction handler.
            const interactionHandler = new RedirectHandler(authClient, this.browserStorage);

            // Create acquire token url.
            const navigateUrl = await authClient.getAuthCodeUrl(validRequest);

            // Show the UI once the url has been created. Response will come back in the hash, which will be handled in the handleRedirectCallback function.
            interactionHandler.initiateAuthRequest(navigateUrl, authCodeRequest, request.redirectStartPage, this.browserCrypto);
        } catch (e) {
            this.browserStorage.cleanRequest();
            throw e;
        }
    }

    // #endregion

    // #region Popup Flow

    /**
     * Use when initiating the login process via opening a popup window in the user's browser
     *
     * @param {@link (AuthenticationParameters:type)}
     *
     * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
     */
    async loginPopup(request: PopupRequest): Promise<AuthenticationResult> {
        return this.acquireTokenPopup(request);
    }

    /**
     * Use when you want to obtain an access_token for your API via opening a popup window in the user's browser
     * @param {@link AuthenticationParameters}
     *
     * To acquire only idToken, please pass clientId as the only scope in the Authentication Parameters
     * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
     */
    async acquireTokenPopup(request: PopupRequest): Promise<AuthenticationResult> {
        try {
            // Preflight request
            const validRequest: AuthorizationUrlRequest = this.preflightInteractiveRequest(request);

            // Create auth code request and generate PKCE params
            const authCodeRequest: AuthorizationCodeRequest = await this.initializeAuthorizationCodeRequest(validRequest);

            // Initialize the client
            const authClient: AuthorizationCodeClient = await this.createAuthCodeClient(validRequest.authority);

            // Create acquire token url.
            const navigateUrl = await authClient.getAuthCodeUrl(validRequest);

            // Acquire token with popup
            return await this.popupTokenHelper(navigateUrl, authCodeRequest, authClient);
        } catch (e) {
            this.browserStorage.cleanRequest();
            throw e;
        }
    }

    /**
     * Helper which acquires an authorization code with a popup from given url, and exchanges the code for a set of OAuth tokens.
     * @param navigateUrl
     */
    private async popupTokenHelper(navigateUrl: string, authCodeRequest: AuthorizationCodeRequest, authClient: AuthorizationCodeClient): Promise<AuthenticationResult> {
        // Create popup interaction handler.
        const interactionHandler = new PopupHandler(authClient, this.browserStorage);
        // Show the UI once the url has been created. Get the window handle for the popup.
        const popupWindow: Window = interactionHandler.initiateAuthRequest(navigateUrl, authCodeRequest);
        // Monitor the window for the hash. Return the string value and close the popup when the hash is received. Default timeout is 60 seconds.
        const hash = await interactionHandler.monitorPopupForHash(popupWindow, this.config.system.windowHashTimeout);
        // Handle response from hash string.
        return await interactionHandler.handleCodeResponse(hash);
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
     * To renew idToken, please pass clientId as the only scope in the Authentication Parameters.
     * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
     */
    async ssoSilent(request: AuthorizationUrlRequest): Promise<AuthenticationResult> {
        // block the reload if it occurred inside a hidden iframe
        BrowserUtils.blockReloadInHiddenIframes();

        // Check that we have some SSO data
        if (StringUtils.isEmpty(request.loginHint)) {
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
        });

        // Create auth code request and generate PKCE params
        const authCodeRequest: AuthorizationCodeRequest = await this.initializeAuthorizationCodeRequest(silentRequest);

        // Get scopeString for iframe ID
        const scopeString = silentRequest.scopes ? silentRequest.scopes.join(" ") : "";

        // Initialize the client
        const authClient: AuthorizationCodeClient = await this.createAuthCodeClient(silentRequest.authority);

        // Create authorize request url
        const navigateUrl = await authClient.getAuthCodeUrl(silentRequest);

        return this.silentTokenHelper(navigateUrl, authCodeRequest, authClient, scopeString);
    }

    /**
     * Use this function to obtain a token before every call to the API / resource provider
     *
     * MSAL return's a cached token when available
     * Or it send's a request to the STS to obtain a new token using a refresh token.
     *
     * @param {@link AuthenticationParameters}
     *
     * To renew idToken, please pass clientId as the only scope in the Authentication Parameters
     * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
     *
     */
    async acquireTokenSilent(request: SilentFlowRequest): Promise<AuthenticationResult> {
        // block the reload if it occurred inside a hidden iframe
        BrowserUtils.blockReloadInHiddenIframes();
        const silentRequest: SilentFlowRequest = {
            ...request,
            ...this.initializeBaseRequest(request)
        };
        try {
            const silentAuthClient = await this.createSilentFlowClient(silentRequest.authority);
            // Send request to renew token. Auth module will throw errors if token cannot be renewed.
            return await silentAuthClient.acquireToken(silentRequest);
        } catch (e) {
            const isServerError = e instanceof ServerError;
            const isInteractionRequiredError = e instanceof InteractionRequiredAuthError;
            const isInvalidGrantError = (e.errorCode === BrowserConstants.INVALID_GRANT_ERROR);
            if (isServerError && isInvalidGrantError && !isInteractionRequiredError) {
                const silentAuthUrlRequest: AuthorizationUrlRequest = this.initializeAuthorizationRequest({
                    ...silentRequest,
                    prompt: PromptValue.NONE
                });

                // Create auth code request and generate PKCE params
                const authCodeRequest: AuthorizationCodeRequest = await this.initializeAuthorizationCodeRequest(silentAuthUrlRequest);

                // Initialize the client
                const authClient: AuthorizationCodeClient = await this.createAuthCodeClient(silentAuthUrlRequest.authority);

                // Create authorize request url
                const navigateUrl = await authClient.getAuthCodeUrl(silentAuthUrlRequest);

                // Get scopeString for iframe ID
                const scopeString = silentAuthUrlRequest.scopes ? silentAuthUrlRequest.scopes.join(" ") : "";

                return this.silentTokenHelper(navigateUrl, authCodeRequest, authClient, scopeString);
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
    private async silentTokenHelper(navigateUrl: string, authCodeRequest: AuthorizationCodeRequest, authClient: AuthorizationCodeClient, userRequestScopes: string): Promise<AuthenticationResult> {
        try {
            // Create silent handler
            const silentHandler = new SilentHandler(authClient, this.browserStorage, this.config.system.loadFrameTimeout);
            // Get the frame handle for the silent request
            const msalFrame = await silentHandler.initiateAuthRequest(navigateUrl, authCodeRequest, userRequestScopes);
            // Monitor the window for the hash. Return the string value and close the popup when the hash is received. Default timeout is 60 seconds.
            const hash = await silentHandler.monitorIframeForHash(msalFrame, this.config.system.iframeHashTimeout);
            // Handle response from hash string.
            return await silentHandler.handleCodeResponse(hash);
        } catch (e) {
            this.browserStorage.cleanRequest();
            throw e;
        }
    }

    // #endregion

    // #region Logout

    /**
     * Use to log out the current user, and redirect the user to the postLogoutRedirectUri.
     * Default behaviour is to redirect the user to `window.location.href`.
     * @param logoutRequest 
     */
    async logout(logoutRequest?: EndSessionRequest): Promise<void> {
        const validLogoutRequest = this.initializeLogoutRequest(logoutRequest);
        const authClient = await this.createAuthCodeClient(validLogoutRequest && validLogoutRequest.authority);
        // create logout string and navigate user window to logout. Auth module will clear cache.
        const logoutUri: string = authClient.getLogoutUri(validLogoutRequest);
        BrowserUtils.navigateWindow(logoutUri);
    }

    // #endregion

    // #region Account APIs

    /**
     * Returns all accounts that MSAL currently has data for.
     * (the account object is created at the time of successful login)
     * or null when no state is found
     * @returns {@link IAccount[]} - Array of account objects in cache
     */
    getAllAccounts(): AccountInfo[] {
        return this.browserStorage.getAllAccounts();
    }

    /**
     * Returns the signed in account matching username.
     * (the account object is created at the time of successful login)
     * or null when no state is found
     * @returns {@link IAccount} - the account object stored in MSAL
     */
    getAccountByUsername(userName: string): AccountInfo {
        const allAccounts = this.getAllAccounts();
        return allAccounts.filter(accountObj => accountObj.username === userName)[0];
    }

    // #endregion

    // #region Helpers

    /**
     *
     * Use to get the redirect uri configured in MSAL or null.
     * @returns {string} redirect URL
     *
     */
    private getRedirectUri(requestRedirectUri?: string): string {
        return requestRedirectUri || this.config.auth.redirectUri || BrowserUtils.getCurrentUri();
    }

    /**
     * Use to get the post logout redirect uri configured in MSAL or null.
     *
     * @returns {string} post logout redirect URL
     */
    private getPostLogoutRedirectUri(requestPostLogoutRedirectUri?: string): string {
        return requestPostLogoutRedirectUri || this.config.auth.postLogoutRedirectUri || BrowserUtils.getCurrentUri();
    }

    /**
     * Used to get a discovered version of the default authority.
     */
    private async getDiscoveredDefaultAuthority(): Promise<Authority> {
        if (!this.defaultAuthority) {
            this.defaultAuthority = await AuthorityFactory.createDiscoveredInstance(this.config.auth.authority, this.config.system.networkClient);
        }
        return this.defaultAuthority;
    }

    /**
     * Helper to check whether interaction is in progress.
     */
    private interactionInProgress(): boolean {
        // Check whether value in cache is present and equal to expected value
        return (this.browserStorage.getItem(this.browserStorage.generateCacheKey(BrowserConstants.INTERACTION_STATUS_KEY), CacheSchemaType.TEMPORARY) as string) === BrowserConstants.INTERACTION_IN_PROGRESS_VALUE;
    }

    /**
     * Creates an Authorization Code Client with the given authority, or the default authority.
     * @param authorityUrl 
     */
    private async createAuthCodeClient(authorityUrl?: string): Promise<AuthorizationCodeClient> {
        // Create auth module.
        const clientConfig = await this.getClientConfiguration(authorityUrl);
        return new AuthorizationCodeClient(clientConfig);
    }

    /**
     * Creates an Silent Flow Client with the given authority, or the default authority.
     * @param authorityUrl 
     */
    private async createSilentFlowClient(authorityUrl?: string): Promise<SilentFlowClient> {
        // Create auth module.
        const clientConfig = await this.getClientConfiguration(authorityUrl);
        return new SilentFlowClient(clientConfig);
    }

    /**
     * Creates a Client Configuration object with the given request authority, or the default authority.
     * @param requestAuthority 
     */
    private async getClientConfiguration(requestAuthority?: string): Promise<ClientConfiguration> {
        // If the requestAuthority is passed and is not equivalent to the default configured authority, create new authority and discover endpoints. Return default authority otherwise.
        const discoveredAuthority = (!StringUtils.isEmpty(requestAuthority) && requestAuthority !== this.config.auth.authority) ? await AuthorityFactory.createDiscoveredInstance(requestAuthority, this.config.system.networkClient) 
            : await this.getDiscoveredDefaultAuthority();
        return {
            authOptions: {
                clientId: this.config.auth.clientId,
                authority: discoveredAuthority,
                knownAuthorities: this.config.auth.knownAuthorities,
                cloudDiscoveryMetadata: this.config.auth.cloudDiscoveryMetadata
            },
            systemOptions: {
                tokenRenewalOffsetSeconds: this.config.system.tokenRenewalOffsetSeconds,
                telemetry: this.config.system.telemetry
            },
            loggerOptions: {
                loggerCallback: this.config.system.loggerOptions.loggerCallback,
                piiLoggingEnabled: this.config.system.loggerOptions.piiLoggingEnabled
            },
            cryptoInterface: this.browserCrypto,
            networkInterface: this.networkClient,
            storageInterface: this.browserStorage,
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
    private preflightInteractiveRequest(request: RedirectRequest|PopupRequest): AuthorizationUrlRequest {
        // block the reload if it occurred inside a hidden iframe
        BrowserUtils.blockReloadInHiddenIframes();

        // Check if interaction is in progress. Throw error if true.
        if (this.interactionInProgress()) {
            throw BrowserAuthError.createInteractionInProgressError();
        }
        
        return this.initializeAuthorizationRequest(request);
    }

    /**
     * Initializer function for all request APIs
     * @param request 
     */
    private initializeBaseRequest(request: BaseAuthRequest): BaseAuthRequest {
        const validatedRequest: BaseAuthRequest = {
            ...request
        };

        if (StringUtils.isEmpty(validatedRequest.authority)) {
            validatedRequest.authority = this.config.auth.authority;
        }

        validatedRequest.correlationId = (request && request.correlationId) || this.browserCrypto.createNewGuid();

        return {
            ...validatedRequest,
            ...this.setDefaultScopes(validatedRequest)
        };
    }

    /**
     * Generates a request that will contain the openid and profile scopes.
     * @param request 
     */
    private setDefaultScopes(request: BaseAuthRequest): BaseAuthRequest {
        return {
            ...request,
            scopes: [...((request && request.scopes) || []), Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE]
        };
    }

    /**
     * Helper to initialize required request parameters for interactive APIs and ssoSilent()
     * @param request
     */
    private initializeAuthorizationRequest(request: AuthorizationUrlRequest|RedirectRequest|PopupRequest): AuthorizationUrlRequest {
        let validatedRequest: AuthorizationUrlRequest = {
            ...request
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

        validatedRequest.state = ProtocolUtils.setRequestState(
            (request && request.state) || "",
            this.browserCrypto
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
    private async initializeAuthorizationCodeRequest(request: AuthorizationUrlRequest): Promise<AuthorizationCodeRequest> {
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
    private initializeLogoutRequest(logoutRequest?: EndSessionRequest): EndSessionRequest {
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

    // #endregion
}

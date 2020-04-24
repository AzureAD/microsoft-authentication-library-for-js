/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Account, AuthorizationCodeModule, AuthenticationParameters, INetworkModule, TokenResponse, UrlString, TemporaryCacheKeys, TokenRenewParameters, StringUtils, PromptValue, ServerError, InteractionRequiredAuthError } from "@azure/msal-common";
import { Configuration, buildConfiguration } from "./Configuration";
import { BrowserStorage } from "../cache/BrowserStorage";
import { CryptoOps } from "../crypto/CryptoOps";
import { RedirectHandler } from "../interaction_handler/RedirectHandler";
import { PopupHandler } from "../interaction_handler/PopupHandler";
import { SilentHandler } from "../interaction_handler/SilentHandler";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { BrowserConfigurationAuthError } from "../error/BrowserConfigurationAuthError";
import { BrowserConstants } from "../utils/BrowserConstants";
import { AuthCallback } from "../types/AuthCallback";
import { BrowserUtils } from "../utils/BrowserUtils";

/**
 * The PublicClientApplication class is the object exposed by the library to perform authentication and authorization functions in Single Page Applications
 * to obtain JWT tokens as described in the OAuth 2.0 Authorization Code Flow with PKCE specification.
 */
export class PublicClientApplication {

    // Input configuration by developer/user
    private config: Configuration;

    // auth functions imported from @azure/msal-common module
    private authModule: AuthorizationCodeModule;

    // Crypto interface implementation
    private browserCrypto: CryptoOps;

    // Storage interface implementation
    private browserStorage: BrowserStorage;

    // Network interface implementation
    private networkClient: INetworkModule;

    // Response promise
    private tokenExchangePromise: Promise<TokenResponse>;

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

        // Create auth module.
        this.authModule = new AuthorizationCodeModule({
            auth: this.config.auth,
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
            storageInterface: this.browserStorage
        });

        // Check for hash and save response promise
        this.tokenExchangePromise = this.handleRedirectResponse();
    }

    // #region Redirect Flow

    /**
     * Process any redirect-related data and send back the success or error object.
     * IMPORTANT: Please do not use this function when using the popup APIs, as it may break the response handling
     * in the main window.
     * 
     * @param {@link (AuthCallback:type)} authCallback - Callback which contains
     * an AuthError object, containing error data from either the server
     * or the library, depending on the origin of the error, or the AuthResponse object 
     * containing data from the server (returned with a null or non-blocking error).
     */
    async handleRedirectCallback(authCallback: AuthCallback): Promise<void> {
        // Check whether callback object was passed.
        if (!authCallback) {
            throw BrowserConfigurationAuthError.createInvalidCallbackObjectError(authCallback);
        }

        // Check if we need to navigate, otherwise handle hash
        try {
            const tokenResponse = await this.tokenExchangePromise;
            if (tokenResponse) {
                authCallback(null, tokenResponse);
            }
        } catch (err) {
            authCallback(err);
        }
    }

    /**
     * Checks if navigateToLoginRequestUrl is set, and:
     * - if true, performs logic to cache and navigate 
     * - if false, handles hash string and parses response
     */
    private async handleRedirectResponse(): Promise<TokenResponse> {
        // Get current location hash from window or cache.
        const { location: { hash } } = window;
        const cachedHash = this.browserStorage.getItem(TemporaryCacheKeys.URL_HASH);
        const isResponseHash = UrlString.hashContainsKnownProperties(hash);

        const loginRequestUrl = this.browserStorage.getItem(TemporaryCacheKeys.ORIGIN_URI);
        const currentUrl = BrowserUtils.getCurrentUri();
        if (loginRequestUrl === currentUrl) {
            // We don't need to navigate - check for hash and prepare to process
            if (isResponseHash) {
                BrowserUtils.clearHash();
                return this.handleHash(hash);
            } else {
                // Loaded page with no valid hash - pass in the value retrieved from cache, or null/empty string
                return this.handleHash(cachedHash);
            }
        }

        if (this.config.auth.navigateToLoginRequestUrl && isResponseHash && !BrowserUtils.isInIframe()) {
            // Returned from authority using redirect - need to perform navigation before processing response
            this.browserStorage.setItem(TemporaryCacheKeys.URL_HASH, hash);
            
            if (StringUtils.isEmpty(loginRequestUrl) || loginRequestUrl === "null") {
                // Redirect to home page if login request url is null (real null or the string null)
                this.authModule.logger.warning("Unable to get valid login request url from cache, redirecting to home page");
                BrowserUtils.navigateWindow("/", true);
            } else {
                // Navigate to target url
                BrowserUtils.navigateWindow(loginRequestUrl, true);
            }
            return null;
        }

        if (!isResponseHash) {
            // Loaded page with no valid hash - pass in the value retrieved from cache, or null/empty string
            return this.handleHash(cachedHash);
        }

        if (!this.config.auth.navigateToLoginRequestUrl) {
            // We don't need to navigate - check for hash and prepare to process
            BrowserUtils.clearHash();
            return this.handleHash(hash);
        }

        return null;
    }

    /**
     * Checks if hash exists and handles in window. Otherwise, cancel any current requests and continue.
     * @param responseHash 
     * @param interactionHandler 
     */
    private async handleHash(responseHash: string): Promise<TokenResponse> {
        const interactionHandler = new RedirectHandler(this.authModule, this.browserStorage);
        if (!StringUtils.isEmpty(responseHash)) {
            // Hash contains known properties - handle and return in callback
            return interactionHandler.handleCodeResponse(responseHash);
        }

        // There is no hash - assume we are in clean state and clear any current request data.
        this.cleanRequest();
        return null;
    }

    /**
     * Use when initiating the login process by redirecting the user's browser to the authorization endpoint. This function redirects the page, so 
     * any code that follows this function will not execute.
     * @param {@link (AuthenticationParameters:type)}
     */
    loginRedirect(request: AuthenticationParameters): void {
        // Preflight request
        this.preflightRequest();

        try {
            // Create redirect interaction handler.
            const interactionHandler = new RedirectHandler(this.authModule, this.browserStorage);

            // Create login url, which will by default append the client id scope to the call.
            this.authModule.createLoginUrl(request).then((navigateUrl: string) => {
                // Show the UI once the url has been created. Response will come back in the hash, which will be handled in the handleRedirectCallback function.
                interactionHandler.initiateAuthRequest(navigateUrl);
            });
        } catch (e) {
            this.cleanRequest();
            throw e;
        }
    }

    /**
     * Use when you want to obtain an access_token for your API by redirecting the user's browser window to the authorization endpoint. This function redirects 
     * the page, so any code that follows this function will not execute.
     * @param {@link (AuthenticationParameters:type)}
     *
     * To acquire only idToken, please pass clientId as the only scope in the Authentication Parameters
     */
    acquireTokenRedirect(request: AuthenticationParameters): void {
        // Preflight request
        this.preflightRequest();

        try {
            // Create redirect interaction handler.
            const interactionHandler = new RedirectHandler(this.authModule, this.browserStorage);

            // Create acquire token url.
            this.authModule.createAcquireTokenUrl(request).then((navigateUrl: string) => {
                // Show the UI once the url has been created. Response will come back in the hash, which will be handled in the handleRedirectCallback function.
                interactionHandler.initiateAuthRequest(navigateUrl);
            });
        } catch (e) {
            this.cleanRequest();
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
     * @returns {Promise.<TokenResponse>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
     */
    async loginPopup(request: AuthenticationParameters): Promise<TokenResponse> {
        // Preflight request
        this.preflightRequest();

        // Create login url, which will by default append the client id scope to the call.
        const navigateUrl = await this.authModule.createLoginUrl(request);

        // Acquire token with popup
        return this.popupTokenHelper(navigateUrl);
    }

    /**
     * Use when you want to obtain an access_token for your API via opening a popup window in the user's browser
     * @param {@link AuthenticationParameters}
     *
     * To acquire only idToken, please pass clientId as the only scope in the Authentication Parameters
     * @returns {Promise.<TokenResponse>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
     */
    async acquireTokenPopup(request: AuthenticationParameters): Promise<TokenResponse> {
        // Preflight request
        this.preflightRequest();

        // Create acquire token url.
        const navigateUrl = await this.authModule.createAcquireTokenUrl(request);

        // Acquire token with popup
        return this.popupTokenHelper(navigateUrl);
    }

    /**
     * Helper which acquires an authorization code with a popup from given url, and exchanges the code for a set of OAuth tokens.
     * @param navigateUrl 
     */
    private async popupTokenHelper(navigateUrl: string): Promise<TokenResponse> {
        try {
            // Create popup interaction handler.
            const interactionHandler = new PopupHandler(this.authModule, this.browserStorage);
            // Show the UI once the url has been created. Get the window handle for the popup.
            const popupWindow: Window = interactionHandler.initiateAuthRequest(navigateUrl);
            // Monitor the window for the hash. Return the string value and close the popup when the hash is received. Default timeout is 60 seconds.
            const hash = await interactionHandler.monitorWindowForHash(popupWindow, this.config.system.windowHashTimeout, navigateUrl);
            // Handle response from hash string.
            return await interactionHandler.handleCodeResponse(hash);
        } catch (e) {
            this.cleanRequest();
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
     * @param {@link AuthenticationParameters} 
     * 
     * To renew idToken, please pass clientId as the only scope in the Authentication Parameters.
     * @returns {Promise.<TokenResponse>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
     */
    async ssoSilent(request: AuthenticationParameters): Promise<TokenResponse> {
        // block the reload if it occurred inside a hidden iframe
        BrowserUtils.blockReloadInHiddenIframes();

        // Check that we have some SSO data
        if (StringUtils.isEmpty(request.loginHint) && StringUtils.isEmpty(request.sid) && !request.account) {
            throw BrowserAuthError.createSilentSSOInsufficientInfoError();
        }

        // Check that prompt is set to none, throw error if it is set to anything else.
        if (request.prompt && request.prompt !== PromptValue.NONE) {
            throw BrowserAuthError.createSilentPromptValueError(request.prompt);
        }

        // Create silent request
        const silentRequest: AuthenticationParameters = {
            ...request,
            prompt: PromptValue.NONE
        };

        // Get scopeString for iframe ID
        const scopeString = silentRequest.scopes ? silentRequest.scopes.join(" ") : "";

        // Create authorize request url
        const navigateUrl = await this.authModule.createLoginUrl(silentRequest);

        return this.silentTokenHelper(navigateUrl, scopeString);
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
     * @returns {Promise.<TokenResponse>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
     *
     */
    async acquireTokenSilent(silentRequest: TokenRenewParameters): Promise<TokenResponse> {
        // block the reload if it occurred inside a hidden iframe
        BrowserUtils.blockReloadInHiddenIframes();

        try {
            // Send request to renew token. Auth module will throw errors if token cannot be renewed.
            return await this.authModule.getValidToken(silentRequest);
        } catch (e) {
            const isServerError = e instanceof ServerError;
            const isInteractionRequiredError = e instanceof InteractionRequiredAuthError;
            const isInvalidGrantError = (e.errorCode === BrowserConstants.INVALID_GRANT_ERROR);
            if (isServerError && isInvalidGrantError && !isInteractionRequiredError) {
                const tokenRequest: AuthenticationParameters = {
                    ...silentRequest,
                    prompt: PromptValue.NONE
                };

                // Create authorize request url
                const navigateUrl = await this.authModule.createAcquireTokenUrl(tokenRequest);

                // Get scopeString for iframe ID
                const scopeString = silentRequest.scopes ? silentRequest.scopes.join(" ") : "";

                return this.silentTokenHelper(navigateUrl, scopeString);
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
    private async silentTokenHelper(navigateUrl: string, userRequestScopes: string): Promise<TokenResponse> {
        try {
            // Create silent handler
            const silentHandler = new SilentHandler(this.authModule, this.browserStorage, this.config.system.loadFrameTimeout);
            // Get the frame handle for the silent request
            const msalFrame = await silentHandler.initiateAuthRequest(navigateUrl, userRequestScopes);
            // Monitor the window for the hash. Return the string value and close the popup when the hash is received. Default timeout is 60 seconds.
            const hash = await silentHandler.monitorFrameForHash(msalFrame, this.config.system.iframeHashTimeout, navigateUrl);
            // Handle response from hash string.
            return await silentHandler.handleCodeResponse(hash);
        } catch(e) {
            throw e;
        }
    }

    // #endregion

    // #region Logout

    /**
     * Use to log out the current user, and redirect the user to the postLogoutRedirectUri.
     * Default behaviour is to redirect the user to `window.location.href`.
     */
    logout(): void {
        // create logout string and navigate user window to logout. Auth module will clear cache.
        this.authModule.logout().then((logoutUri: string) => {
            BrowserUtils.navigateWindow(logoutUri);
        });
    }

    // #endregion

    // #region Getters and setters

    /**
     *
     * Use to get the redirect uri configured in MSAL or null.
     * Evaluates redirectUri if its a function, otherwise simply returns its value.
     * @returns {string} redirect URL
     *
     */
    public getRedirectUri(): string {
        return this.authModule.getRedirectUri();
    }

    /**
     * Use to get the post logout redirect uri configured in MSAL or null.
     * Evaluates postLogoutredirectUri if its a function, otherwise simply returns its value.
     *
     * @returns {string} post logout redirect URL
     */
    public getPostLogoutRedirectUri(): string {
        return this.authModule.getPostLogoutRedirectUri();
    }

    /**
     * Returns the signed in account
     * (the account object is created at the time of successful login)
     * or null when no state is found
     * @returns {@link Account} - the account object stored in MSAL
     */
    public getAccount(): Account {
        return this.authModule.getAccount();
    }

    // #endregion

    // #region Helpers

    /**
     * Helper to check whether interaction is in progress.
     */
    private interactionInProgress(): boolean {
        // Check whether value in cache is present and equal to expected value
        return this.browserStorage.getItem(BrowserConstants.INTERACTION_STATUS_KEY) === BrowserConstants.INTERACTION_IN_PROGRESS_VALUE;
    }

    /**
     * Helper to validate app environment before making a request.
     */
    private preflightRequest(): void {
        // block the reload if it occurred inside a hidden iframe
        BrowserUtils.blockReloadInHiddenIframes();

        // Check if interaction is in progress. Throw error if true.
        if (this.interactionInProgress()) {
            throw BrowserAuthError.createInteractionInProgressError();
        }
    }

    /**
     * Helper to remove interaction status and remove tempoarary request data.
     */
    private cleanRequest(): void {
        // Interaction is completed - remove interaction status.
        this.browserStorage.removeItem(BrowserConstants.INTERACTION_STATUS_KEY);
        this.authModule.cancelRequest();
    }

    // #endregion
}

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Account, AuthorizationCodeModule, AuthenticationParameters, INetworkModule, TokenResponse, UrlString, TemporaryCacheKeys, TokenRenewParameters } from "@azure/msal-common";
import { Configuration, buildConfiguration } from "./Configuration";
import { BrowserStorage } from "../cache/BrowserStorage";
import { CryptoOps } from "../crypto/CryptoOps";
import { RedirectHandler } from "../interaction_handler/RedirectHandler";
import { PopupHandler } from "../interaction_handler/PopupHandler";
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

    // callback for error/token response
    private authCallback: AuthCallback = null;

    // Crypto interface implementation
    private browserCrypto: CryptoOps;

    // Storage interface implementation
    private browserStorage: BrowserStorage;

    // Network interface implementation
    private networkClient: INetworkModule;

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
    }

    // #region Redirect Flow

    /**
     * Set the callback functions for the redirect flow to send back the success or error object.
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

        // Set the callback object.
        this.authCallback = authCallback;
        // Get current location hash from window or cache.
        const { location: { hash } } = window;
        const cachedHash = this.browserStorage.getItem(TemporaryCacheKeys.URL_HASH);
        try {
            // If hash exists, handle in window. Otherwise, continue execution.
            const interactionHandler = new RedirectHandler(this.authModule, this.browserStorage, this.config.auth.navigateToLoginRequestUrl);
            const responseHash = UrlString.hashContainsKnownProperties(hash) ? hash : cachedHash;
            if (responseHash) {
                const tokenResponse = await interactionHandler.handleCodeResponse(responseHash);
                this.authCallback(null, tokenResponse);
            }
        } catch (err) {
            this.authCallback(err);
        }
    }

    /**
     * Use when initiating the login process by redirecting the user's browser to the authorization endpoint. This function redirects the page, so 
     * any code that follows this function will not execute.
     * @param {@link (AuthenticationParameters:type)}
     */
    loginRedirect(request: AuthenticationParameters): void {
        // Check if callback has been set. If not, handleRedirectCallbacks wasn't called correctly.
        if (!this.authCallback) {
            throw BrowserConfigurationAuthError.createRedirectCallbacksNotSetError();
        }

        // Check if interaction is in progress. Throw error in callback and return if true.
        if (this.interactionInProgress()) {
            this.authCallback(BrowserAuthError.createInteractionInProgressError());
            return;
        }

        // Create redirect interaction handler.
        const interactionHandler = new RedirectHandler(this.authModule, this.browserStorage, this.config.auth.navigateToLoginRequestUrl);

        // Create login url, which will by default append the client id scope to the call.
        this.authModule.createLoginUrl(request).then((navigateUrl) => {
            // Show the UI once the url has been created. Response will come back in the hash, which will be handled in the handleRedirectCallback function.
            interactionHandler.showUI(navigateUrl);
        });
    }

    /**
     * Use when you want to obtain an access_token for your API by redirecting the user's browser window to the authorization endpoint. This function redirects 
     * the page, so any code that follows this function will not execute.
     * @param {@link (AuthenticationParameters:type)}
     *
     * To acquire only idToken, please pass clientId as the only scope in the Authentication Parameters
     */
    acquireTokenRedirect(request: AuthenticationParameters): void {
        // Check if callback has been set. If not, handleRedirectCallbacks wasn't called correctly.
        if (!this.authCallback) {
            throw BrowserConfigurationAuthError.createRedirectCallbacksNotSetError();
        }

        // Check if interaction is in progress. Throw error in callback and return if true.
        if (this.interactionInProgress()) {
            this.authCallback(BrowserAuthError.createInteractionInProgressError());
            return;
        }

        // Create redirect interaction handler.
        const interactionHandler = new RedirectHandler(this.authModule, this.browserStorage, this.config.auth.navigateToLoginRequestUrl);
        // Create acquire token url.
        this.authModule.createAcquireTokenUrl(request).then((navigateUrl) => {
            // Show the UI once the url has been created. Response will come back in the hash, which will be handled in the handleRedirectCallback function.
            interactionHandler.showUI(navigateUrl);
        });
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
        // Check if interaction is in progress. Throw error if true.
        if (this.interactionInProgress()) {
            throw BrowserAuthError.createInteractionInProgressError();
        }

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
        // Check if interaction is in progress. Throw error if true.
        if (this.interactionInProgress()) {
            throw BrowserAuthError.createInteractionInProgressError();
        }

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
        // Create popup interaction handler.
        const interactionHandler = new PopupHandler(this.authModule, this.browserStorage);
        // Show the UI once the url has been created. Get the window handle for the popup.
        const popupWindow = interactionHandler.showUI(navigateUrl);
        // Monitor the window for the hash. Return the string value and close the popup when the hash is received. Default timeout is 60 seconds.
        const hash = await interactionHandler.monitorWindowForHash(popupWindow, this.config.system.windowHashTimeout, navigateUrl);
        // Handle response from hash string.
        return interactionHandler.handleCodeResponse(hash);
    }

    // #region Silent Flow

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
    async acquireTokenSilent(tokenRequest: TokenRenewParameters): Promise<TokenResponse> {
        // Send request to renew token. Auth module will throw errors if token cannot be renewed.
        return this.authModule.renewToken(tokenRequest);
    }

    // #endregion

    // #region Logout

    /**
     * Use to log out the current user, and redirect the user to the postLogoutRedirectUri.
     * Default behaviour is to redirect the user to `window.location.href`.
     */
    logout(): void {
        // create logout string and navigate user window to logout. Auth module will clear cache.
        this.authModule.logout().then(logoutUri => {
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

    private interactionInProgress(): boolean {
        // Check whether value in cache is present and equal to expected value
        return this.browserStorage.getItem(BrowserConstants.INTERACTION_STATUS_KEY) === BrowserConstants.INTERACTION_IN_PROGRESS_VALUE;
    }

    // #endregion
}

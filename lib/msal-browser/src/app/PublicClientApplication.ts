/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ITokenCache } from "../cache/ITokenCache.js";
import { INavigationClient } from "../navigation/INavigationClient.js";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest.js";
import { PopupRequest } from "../request/PopupRequest.js";
import { RedirectRequest } from "../request/RedirectRequest.js";
import { SilentRequest } from "../request/SilentRequest.js";
import { WrapperSKU } from "../utils/BrowserConstants.js";
import { IPublicClientApplication } from "./IPublicClientApplication.js";
import { IController } from "../controllers/IController.js";
import {
    PerformanceCallbackFunction,
    AccountInfo,
    AccountFilter,
    Logger,
} from "@azure/msal-common/browser";
import { EndSessionRequest } from "../request/EndSessionRequest.js";
import { SsoSilentRequest } from "../request/SsoSilentRequest.js";
import * as ControllerFactory from "../controllers/ControllerFactory.js";
import { StandardController } from "../controllers/StandardController.js";
import {
    BrowserConfiguration,
    Configuration,
} from "../config/Configuration.js";
import { StandardOperatingContext } from "../operatingcontext/StandardOperatingContext.js";
import { AuthenticationResult } from "../response/AuthenticationResult.js";
import { EventCallbackFunction } from "../event/EventMessage.js";
import { ClearCacheRequest } from "../request/ClearCacheRequest.js";
import { EndSessionPopupRequest } from "../request/EndSessionPopupRequest.js";
import { NestedAppAuthController } from "../controllers/NestedAppAuthController.js";
import { NestedAppOperatingContext } from "../operatingcontext/NestedAppOperatingContext.js";
import { InitializeApplicationRequest } from "../request/InitializeApplicationRequest.js";

/**
 * The PublicClientApplication class is the object exposed by the library to perform authentication and authorization functions in Single Page Applications
 * to obtain JWT tokens as described in the OAuth 2.0 Authorization Code Flow with PKCE specification.
 */
export class PublicClientApplication implements IPublicClientApplication {
    protected controller: IController;

    /**
     * Creates StandardController and passes it to the PublicClientApplication
     *
     * @param configuration {Configuration}
     */
    public static async createPublicClientApplication(
        configuration: Configuration
    ): Promise<IPublicClientApplication> {
        const controller = await ControllerFactory.createV3Controller(
            configuration
        );
        const pca = new PublicClientApplication(configuration, controller);

        return pca;
    }

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
     * @param IController Optional parameter to explictly set the controller. (Will be removed when we remove public constructor)
     */
    public constructor(configuration: Configuration, controller?: IController) {
        this.controller =
            controller ||
            new StandardController(new StandardOperatingContext(configuration));
    }

    /**
     * Initializer function to perform async startup tasks such as connecting to WAM extension
     * @param request {?InitializeApplicationRequest}
     */
    async initialize(request?: InitializeApplicationRequest): Promise<void> {
        return this.controller.initialize(request);
    }

    /**
     * Use when you want to obtain an access_token for your API via opening a popup window in the user's browser
     *
     * @param request
     *
     * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
     */
    async acquireTokenPopup(
        request: PopupRequest
    ): Promise<AuthenticationResult> {
        return this.controller.acquireTokenPopup(request);
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
    acquireTokenRedirect(request: RedirectRequest): Promise<void> {
        return this.controller.acquireTokenRedirect(request);
    }

    /**
     * Silently acquire an access token for a given set of scopes. Returns currently processing promise if parallel requests are made.
     *
     * @param {@link (SilentRequest:type)}
     * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthenticationResult} object
     */
    acquireTokenSilent(
        silentRequest: SilentRequest
    ): Promise<AuthenticationResult> {
        return this.controller.acquireTokenSilent(silentRequest);
    }

    /**
     * This function redeems an authorization code (passed as code) from the eSTS token endpoint.
     * This authorization code should be acquired server-side using a confidential client to acquire a spa_code.
     * This API is not indended for normal authorization code acquisition and redemption.
     *
     * Redemption of this authorization code will not require PKCE, as it was acquired by a confidential client.
     *
     * @param request {@link AuthorizationCodeRequest}
     * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
     */
    acquireTokenByCode(
        request: AuthorizationCodeRequest
    ): Promise<AuthenticationResult> {
        return this.controller.acquireTokenByCode(request);
    }

    /**
     * Adds event callbacks to array
     * @param callback
     */
    addEventCallback(callback: EventCallbackFunction): string | null {
        return this.controller.addEventCallback(callback);
    }

    /**
     * Removes callback with provided id from callback array
     * @param callbackId
     */
    removeEventCallback(callbackId: string): void {
        return this.controller.removeEventCallback(callbackId);
    }

    /**
     * Registers a callback to receive performance events.
     *
     * @param {PerformanceCallbackFunction} callback
     * @returns {string}
     */
    addPerformanceCallback(callback: PerformanceCallbackFunction): string {
        return this.controller.addPerformanceCallback(callback);
    }

    /**
     * Removes a callback registered with addPerformanceCallback.
     *
     * @param {string} callbackId
     * @returns {boolean}
     */
    removePerformanceCallback(callbackId: string): boolean {
        return this.controller.removePerformanceCallback(callbackId);
    }

    /**
     * Adds event listener that emits an event when a user account is added or removed from localstorage in a different browser tab or window
     */
    enableAccountStorageEvents(): void {
        this.controller.enableAccountStorageEvents();
    }

    /**
     * Removes event listener that emits an event when a user account is added or removed from localstorage in a different browser tab or window
     */
    disableAccountStorageEvents(): void {
        this.controller.disableAccountStorageEvents();
    }

    /**
     * Returns the first account found in the cache that matches the account filter passed in.
     * @param accountFilter
     * @returns The first account found in the cache matching the provided filter or null if no account could be found.
     */
    getAccount(accountFilter: AccountFilter): AccountInfo | null {
        return this.controller.getAccount(accountFilter);
    }

    /**
     * Returns the signed in account matching homeAccountId.
     * (the account object is created at the time of successful login)
     * or null when no matching account is found
     * @param homeAccountId
     * @returns The account object stored in MSAL
     * @deprecated - Use getAccount instead
     */
    getAccountByHomeId(homeAccountId: string): AccountInfo | null {
        return this.controller.getAccountByHomeId(homeAccountId);
    }

    /**
     * Returns the signed in account matching localAccountId.
     * (the account object is created at the time of successful login)
     * or null when no matching account is found
     * @param localAccountId
     * @returns The account object stored in MSAL
     * @deprecated - Use getAccount instead
     */
    getAccountByLocalId(localId: string): AccountInfo | null {
        return this.controller.getAccountByLocalId(localId);
    }

    /**
     * Returns the signed in account matching username.
     * (the account object is created at the time of successful login)
     * or null when no matching account is found.
     * This API is provided for convenience but getAccountById should be used for best reliability
     * @param userName
     * @returns The account object stored in MSAL
     * @deprecated - Use getAccount instead
     */
    getAccountByUsername(userName: string): AccountInfo | null {
        return this.controller.getAccountByUsername(userName);
    }

    /**
     * Returns all the accounts in the cache that match the optional filter. If no filter is provided, all accounts are returned.
     * @param accountFilter - (Optional) filter to narrow down the accounts returned
     * @returns Array of AccountInfo objects in cache
     */
    getAllAccounts(accountFilter?: AccountFilter): AccountInfo[] {
        return this.controller.getAllAccounts(accountFilter);
    }

    /**
     * Event handler function which allows users to fire events after the PublicClientApplication object
     * has loaded during redirect flows. This should be invoked on all page loads involved in redirect
     * auth flows.
     * @param hash Hash to process. Defaults to the current value of window.location.hash. Only needs to be provided explicitly if the response to be handled is not contained in the current value.
     * @returns Token response or null. If the return value is null, then no auth redirect was detected.
     */
    handleRedirectPromise(
        hash?: string | undefined
    ): Promise<AuthenticationResult | null> {
        return this.controller.handleRedirectPromise(hash);
    }

    /**
     * Use when initiating the login process via opening a popup window in the user's browser
     *
     * @param request
     *
     * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
     */
    loginPopup(
        request?: PopupRequest | undefined
    ): Promise<AuthenticationResult> {
        return this.controller.loginPopup(request);
    }

    /**
     * Use when initiating the login process by redirecting the user's browser to the authorization endpoint. This function redirects the page, so
     * any code that follows this function will not execute.
     *
     * IMPORTANT: It is NOT recommended to have code that is dependent on the resolution of the Promise. This function will navigate away from the current
     * browser window. It currently returns a Promise in order to reflect the asynchronous nature of the code running in this function.
     *
     * @param request
     */
    loginRedirect(request?: RedirectRequest | undefined): Promise<void> {
        return this.controller.loginRedirect(request);
    }

    /**
     * Deprecated logout function. Use logoutRedirect or logoutPopup instead
     * @param logoutRequest
     * @deprecated
     */
    logout(logoutRequest?: EndSessionRequest): Promise<void> {
        return this.controller.logout(logoutRequest);
    }

    /**
     * Use to log out the current user, and redirect the user to the postLogoutRedirectUri.
     * Default behaviour is to redirect the user to `window.location.href`.
     * @param logoutRequest
     */
    logoutRedirect(logoutRequest?: EndSessionRequest): Promise<void> {
        return this.controller.logoutRedirect(logoutRequest);
    }

    /**
     * Clears local cache for the current user then opens a popup window prompting the user to sign-out of the server
     * @param logoutRequest
     */
    logoutPopup(logoutRequest?: EndSessionPopupRequest): Promise<void> {
        return this.controller.logoutPopup(logoutRequest);
    }

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
    ssoSilent(request: SsoSilentRequest): Promise<AuthenticationResult> {
        return this.controller.ssoSilent(request);
    }

    /**
     * Gets the token cache for the application.
     */
    getTokenCache(): ITokenCache {
        return this.controller.getTokenCache();
    }

    /**
     * Returns the logger instance
     */
    getLogger(): Logger {
        return this.controller.getLogger();
    }

    /**
     * Replaces the default logger set in configurations with new Logger with new configurations
     * @param logger Logger instance
     */
    setLogger(logger: Logger): void {
        this.controller.setLogger(logger);
    }

    /**
     * Sets the account to use as the active account. If no account is passed to the acquireToken APIs, then MSAL will use this active account.
     * @param account
     */
    setActiveAccount(account: AccountInfo | null): void {
        this.controller.setActiveAccount(account);
    }

    /**
     * Gets the currently active account
     */
    getActiveAccount(): AccountInfo | null {
        return this.controller.getActiveAccount();
    }

    /**
     * Called by wrapper libraries (Angular & React) to set SKU and Version passed down to telemetry, logger, etc.
     * @param sku
     * @param version
     */
    initializeWrapperLibrary(sku: WrapperSKU, version: string): void {
        return this.controller.initializeWrapperLibrary(sku, version);
    }

    /**
     * Sets navigation client
     * @param navigationClient
     */
    setNavigationClient(navigationClient: INavigationClient): void {
        this.controller.setNavigationClient(navigationClient);
    }

    /**
     * Returns the configuration object
     * @internal
     */
    getConfiguration(): BrowserConfiguration {
        return this.controller.getConfiguration();
    }

    /**
     * Hydrates cache with the tokens and account in the AuthenticationResult object
     * @param result
     * @param request - The request object that was used to obtain the AuthenticationResult
     * @returns
     */
    async hydrateCache(
        result: AuthenticationResult,
        request:
            | SilentRequest
            | SsoSilentRequest
            | RedirectRequest
            | PopupRequest
    ): Promise<void> {
        return this.controller.hydrateCache(result, request);
    }

    /**
     * Clears tokens and account from the browser cache.
     * @param logoutRequest
     */
    clearCache(logoutRequest?: ClearCacheRequest): Promise<void> {
        return this.controller.clearCache(logoutRequest);
    }
}

/**
 * creates NestedAppAuthController and passes it to the PublicClientApplication,
 * falls back to StandardController if NestedAppAuthController is not available
 *
 * @param configuration
 * @returns IPublicClientApplication
 *
 */
export async function createNestablePublicClientApplication(
    configuration: Configuration
): Promise<IPublicClientApplication> {
    const nestedAppAuth = new NestedAppOperatingContext(configuration);
    await nestedAppAuth.initialize();

    if (nestedAppAuth.isAvailable()) {
        const controller = new NestedAppAuthController(nestedAppAuth);
        return new PublicClientApplication(configuration, controller);
    }

    return createStandardPublicClientApplication(configuration);
}

/**
 * creates PublicClientApplication using StandardController
 *
 * @param configuration
 * @returns IPublicClientApplication
 *
 */
export async function createStandardPublicClientApplication(
    configuration: Configuration
): Promise<IPublicClientApplication> {
    const pca = new PublicClientApplication(configuration);
    await pca.initialize();
    return pca;
}

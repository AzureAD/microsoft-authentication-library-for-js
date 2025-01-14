/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    CommonAuthorizationUrlRequest,
    CommonSilentFlowRequest,
    PerformanceCallbackFunction,
    AccountInfo,
    Logger,
    ICrypto,
    IPerformanceClient,
    DEFAULT_CRYPTO_IMPLEMENTATION,
    PerformanceEvents,
    TimeUtils,
    buildStaticAuthorityOptions,
    AccountEntity,
    OIDC_DEFAULT_SCOPES,
    BaseAuthRequest,
    AccountFilter,
} from "@azure/msal-common/browser";
import { ITokenCache } from "../cache/ITokenCache.js";
import { BrowserConfiguration } from "../config/Configuration.js";
import { INavigationClient } from "../navigation/INavigationClient.js";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest.js";
import { EndSessionPopupRequest } from "../request/EndSessionPopupRequest.js";
import { EndSessionRequest } from "../request/EndSessionRequest.js";
import { PopupRequest } from "../request/PopupRequest.js";
import { RedirectRequest } from "../request/RedirectRequest.js";
import { SilentRequest } from "../request/SilentRequest.js";
import { SsoSilentRequest } from "../request/SsoSilentRequest.js";
import {
    ApiId,
    WrapperSKU,
    InteractionType,
    DEFAULT_REQUEST,
    CacheLookupPolicy,
} from "../utils/BrowserConstants.js";
import { IController } from "./IController.js";
import { NestedAppOperatingContext } from "../operatingcontext/NestedAppOperatingContext.js";
import { IBridgeProxy } from "../naa/IBridgeProxy.js";
import { CryptoOps } from "../crypto/CryptoOps.js";
import { NestedAppAuthAdapter } from "../naa/mapping/NestedAppAuthAdapter.js";
import { NestedAppAuthError } from "../error/NestedAppAuthError.js";
import { EventHandler } from "../event/EventHandler.js";
import { EventType } from "../event/EventType.js";
import { EventCallbackFunction, EventError } from "../event/EventMessage.js";
import { AuthenticationResult } from "../response/AuthenticationResult.js";
import {
    BrowserCacheManager,
    DEFAULT_BROWSER_CACHE_MANAGER,
} from "../cache/BrowserCacheManager.js";
import { ClearCacheRequest } from "../request/ClearCacheRequest.js";
import * as AccountManager from "../cache/AccountManager.js";

export class NestedAppAuthController implements IController {
    // OperatingContext
    protected readonly operatingContext: NestedAppOperatingContext;

    // BridgeProxy
    protected readonly bridgeProxy: IBridgeProxy;

    // Crypto interface implementation
    protected readonly browserCrypto: ICrypto;

    // Input configuration by developer/user
    protected readonly config: BrowserConfiguration;

    // Storage interface implementation
    protected readonly browserStorage!: BrowserCacheManager;

    // Logger
    protected logger: Logger;

    // Performance telemetry client
    protected readonly performanceClient: IPerformanceClient;

    // EventHandler
    protected readonly eventHandler: EventHandler;

    // NestedAppAuthAdapter
    protected readonly nestedAppAuthAdapter: NestedAppAuthAdapter;

    constructor(operatingContext: NestedAppOperatingContext) {
        this.operatingContext = operatingContext;
        const proxy = this.operatingContext.getBridgeProxy();
        if (proxy !== undefined) {
            this.bridgeProxy = proxy;
        } else {
            throw new Error("unexpected: bridgeProxy is undefined");
        }

        // Set the configuration.
        this.config = operatingContext.getConfig();

        // Initialize logger
        this.logger = this.operatingContext.getLogger();

        // Initialize performance client
        this.performanceClient = this.config.telemetry.client;

        // Initialize the crypto class.
        this.browserCrypto = operatingContext.isBrowserEnvironment()
            ? new CryptoOps(this.logger, this.performanceClient, true)
            : DEFAULT_CRYPTO_IMPLEMENTATION;

        // Initialize the browser storage class.
        this.browserStorage = this.operatingContext.isBrowserEnvironment()
            ? new BrowserCacheManager(
                  this.config.auth.clientId,
                  this.config.cache,
                  this.browserCrypto,
                  this.logger,
                  buildStaticAuthorityOptions(this.config.auth)
              )
            : DEFAULT_BROWSER_CACHE_MANAGER(
                  this.config.auth.clientId,
                  this.logger
              );

        this.eventHandler = new EventHandler(this.logger);

        this.nestedAppAuthAdapter = new NestedAppAuthAdapter(
            this.config.auth.clientId,
            this.config.auth.clientCapabilities,
            this.browserCrypto,
            this.logger
        );

        // Set the active account if available
        const accountContext = this.bridgeProxy.getAccountContext();
        if (accountContext) {
            const cachedAccount = AccountManager.getAccount(
                accountContext,
                this.logger,
                this.browserStorage
            );

            AccountManager.setActiveAccount(cachedAccount, this.browserStorage);
        }
    }

    /**
     * Factory function to create a new instance of NestedAppAuthController
     * @param operatingContext
     * @returns Promise<IController>
     */
    static async createController(
        operatingContext: NestedAppOperatingContext
    ): Promise<IController> {
        const controller = new NestedAppAuthController(operatingContext);
        return Promise.resolve(controller);
    }

    /**
     * Specific implementation of initialize function for NestedAppAuthController
     * @returns
     */
    initialize(): Promise<void> {
        // do nothing not required by this controller
        return Promise.resolve();
    }

    /**
     * Validate the incoming request and add correlationId if not present
     * @param request
     * @returns
     */
    private ensureValidRequest<
        T extends
            | SsoSilentRequest
            | SilentRequest
            | PopupRequest
            | RedirectRequest
    >(request: T): T {
        if (request?.correlationId) {
            return request;
        }
        return {
            ...request,
            correlationId: this.browserCrypto.createNewGuid(),
        };
    }

    /**
     * Internal implementation of acquireTokenInteractive flow
     * @param request
     * @returns
     */
    private async acquireTokenInteractive(
        request: PopupRequest | RedirectRequest
    ): Promise<AuthenticationResult> {
        const validRequest = this.ensureValidRequest(request);

        this.eventHandler.emitEvent(
            EventType.ACQUIRE_TOKEN_START,
            InteractionType.Popup,
            validRequest
        );

        const atPopupMeasurement = this.performanceClient.startMeasurement(
            PerformanceEvents.AcquireTokenPopup,
            validRequest.correlationId
        );

        atPopupMeasurement?.add({ nestedAppAuthRequest: true });

        try {
            const naaRequest =
                this.nestedAppAuthAdapter.toNaaTokenRequest(validRequest);
            const reqTimestamp = TimeUtils.nowSeconds();
            const response = await this.bridgeProxy.getTokenInteractive(
                naaRequest
            );
            const result: AuthenticationResult = {
                ...this.nestedAppAuthAdapter.fromNaaTokenResponse(
                    naaRequest,
                    response,
                    reqTimestamp
                ),
            };

            // cache the tokens in the response
            await this.hydrateCache(result, request);

            this.browserStorage.setActiveAccount(result.account);
            this.eventHandler.emitEvent(
                EventType.ACQUIRE_TOKEN_SUCCESS,
                InteractionType.Popup,
                result
            );

            atPopupMeasurement.add({
                accessTokenSize: result.accessToken.length,
                idTokenSize: result.idToken.length,
            });

            atPopupMeasurement.end({
                success: true,
                requestId: result.requestId,
            });

            return result;
        } catch (e) {
            const error = this.nestedAppAuthAdapter.fromBridgeError(e);
            this.eventHandler.emitEvent(
                EventType.ACQUIRE_TOKEN_FAILURE,
                InteractionType.Popup,
                null,
                e as EventError
            );

            atPopupMeasurement.end(
                {
                    success: false,
                },
                e
            );

            throw error;
        }
    }

    /**
     * Internal implementation of acquireTokenSilent flow
     * @param request
     * @returns
     */
    private async acquireTokenSilentInternal(
        request: SilentRequest
    ): Promise<AuthenticationResult> {
        const validRequest = this.ensureValidRequest(request);
        this.eventHandler.emitEvent(
            EventType.ACQUIRE_TOKEN_START,
            InteractionType.Silent,
            validRequest
        );

        // Look for tokens in the cache first
        const result = await this.acquireTokenFromCache(validRequest);
        if (result) {
            this.eventHandler.emitEvent(
                EventType.ACQUIRE_TOKEN_SUCCESS,
                InteractionType.Silent,
                result
            );
            return result;
        }

        // proceed with acquiring tokens via the host
        const ssoSilentMeasurement = this.performanceClient.startMeasurement(
            PerformanceEvents.SsoSilent,
            validRequest.correlationId
        );

        ssoSilentMeasurement?.increment({
            visibilityChangeCount: 0,
        });

        ssoSilentMeasurement?.add({
            nestedAppAuthRequest: true,
        });

        try {
            const naaRequest =
                this.nestedAppAuthAdapter.toNaaTokenRequest(validRequest);
            const reqTimestamp = TimeUtils.nowSeconds();
            const response = await this.bridgeProxy.getTokenSilent(naaRequest);

            const result: AuthenticationResult =
                this.nestedAppAuthAdapter.fromNaaTokenResponse(
                    naaRequest,
                    response,
                    reqTimestamp
                );

            // cache the tokens in the response
            await this.hydrateCache(result, request);

            this.browserStorage.setActiveAccount(result.account);
            this.eventHandler.emitEvent(
                EventType.ACQUIRE_TOKEN_SUCCESS,
                InteractionType.Silent,
                result
            );
            ssoSilentMeasurement?.add({
                accessTokenSize: result.accessToken.length,
                idTokenSize: result.idToken.length,
            });
            ssoSilentMeasurement?.end({
                success: true,
                requestId: result.requestId,
            });
            return result;
        } catch (e) {
            const error = this.nestedAppAuthAdapter.fromBridgeError(e);
            this.eventHandler.emitEvent(
                EventType.ACQUIRE_TOKEN_FAILURE,
                InteractionType.Silent,
                null,
                e as EventError
            );
            ssoSilentMeasurement?.end(
                {
                    success: false,
                },
                e
            );
            throw error;
        }
    }

    /**
     * acquires tokens from cache
     * @param request
     * @returns
     */
    private async acquireTokenFromCache(
        request: SilentRequest
    ): Promise<AuthenticationResult | null> {
        const atsMeasurement = this.performanceClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            request.correlationId
        );

        atsMeasurement?.add({
            nestedAppAuthRequest: true,
        });

        // if the request has claims, we cannot look up in the cache
        if (request.claims) {
            this.logger.verbose(
                "Claims are present in the request, skipping cache lookup"
            );
            return null;
        }

        // respect cache lookup policy
        let result: AuthenticationResult | null = null;
        switch (request.cacheLookupPolicy) {
            case CacheLookupPolicy.Default:
            case CacheLookupPolicy.AccessToken:
            case CacheLookupPolicy.AccessTokenAndRefreshToken:
                result = await this.acquireTokenFromCacheInternal(request);
                break;
            default:
                return null;
        }

        if (result) {
            this.eventHandler.emitEvent(
                EventType.ACQUIRE_TOKEN_SUCCESS,
                InteractionType.Silent,
                result
            );
            atsMeasurement?.add({
                accessTokenSize: result?.accessToken.length,
                idTokenSize: result?.idToken.length,
            });
            atsMeasurement?.end({
                success: true,
            });
            return result;
        }

        this.logger.error(
            "Cached tokens are not found for the account, proceeding with silent token request."
        );

        this.eventHandler.emitEvent(
            EventType.ACQUIRE_TOKEN_FAILURE,
            InteractionType.Silent,
            null
        );
        atsMeasurement?.end({
            success: false,
        });

        return null;
    }

    /**
     *
     * @param request
     * @returns
     */
    private async acquireTokenFromCacheInternal(
        request: SilentRequest
    ): Promise<AuthenticationResult | null> {
        const accountContext = this.bridgeProxy.getAccountContext();
        let currentAccount = null;
        if (accountContext) {
            const hubAccount = AccountManager.getAccount(
                accountContext,
                this.logger,
                this.browserStorage
            );
            // always prioritize for hub account context, the reqirement of `request.account` will be removed soon
            currentAccount = hubAccount || request.account;
        }

        // fall back to brokering if no cached account is found
        if (!currentAccount) {
            this.logger.verbose(
                "No active account found, falling back to the host"
            );
            return Promise.resolve(null);
        }

        this.logger.verbose(
            "active account found, attempting to acquire token silently"
        );

        const authRequest: BaseAuthRequest = {
            ...request,
            correlationId:
                request.correlationId || this.browserCrypto.createNewGuid(),
            authority: request.authority || currentAccount.environment,
            scopes: request.scopes?.length
                ? request.scopes
                : [...OIDC_DEFAULT_SCOPES],
        };

        // fetch access token and check for expiry
        const tokenKeys = this.browserStorage.getTokenKeys();
        const cachedAccessToken = this.browserStorage.getAccessToken(
            currentAccount,
            authRequest,
            tokenKeys,
            currentAccount.tenantId,
            this.performanceClient,
            authRequest.correlationId
        );

        // If there is no access token, log it and return null
        if (!cachedAccessToken) {
            this.logger.verbose("No cached access token found");
            return Promise.resolve(null);
        } else if (
            TimeUtils.wasClockTurnedBack(cachedAccessToken.cachedAt) ||
            TimeUtils.isTokenExpired(
                cachedAccessToken.expiresOn,
                this.config.system.tokenRenewalOffsetSeconds
            )
        ) {
            this.logger.verbose("Cached access token has expired");
            return Promise.resolve(null);
        }

        const cachedIdToken = this.browserStorage.getIdToken(
            currentAccount,
            tokenKeys,
            currentAccount.tenantId,
            this.performanceClient,
            authRequest.correlationId
        );

        if (!cachedIdToken) {
            this.logger.verbose("No cached id token found");
            return Promise.resolve(null);
        }

        return this.nestedAppAuthAdapter.toAuthenticationResultFromCache(
            currentAccount,
            cachedIdToken,
            cachedAccessToken,
            authRequest,
            authRequest.correlationId
        );
    }

    /**
     * acquireTokenPopup flow implementation
     * @param request
     * @returns
     */
    async acquireTokenPopup(
        request: PopupRequest
    ): Promise<AuthenticationResult> {
        return this.acquireTokenInteractive(request);
    }

    /**
     * acquireTokenRedirect flow is not supported in nested app auth
     * @param request
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    acquireTokenRedirect(request: RedirectRequest): Promise<void> {
        throw NestedAppAuthError.createUnsupportedError();
    }

    /**
     * acquireTokenSilent flow implementation
     * @param silentRequest
     * @returns
     */
    async acquireTokenSilent(
        silentRequest: SilentRequest
    ): Promise<AuthenticationResult> {
        return this.acquireTokenSilentInternal(silentRequest);
    }

    /**
     * Hybrid flow is not currently supported in nested app auth
     * @param request
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    acquireTokenByCode(
        request: AuthorizationCodeRequest // eslint-disable-line @typescript-eslint/no-unused-vars
    ): Promise<AuthenticationResult> {
        throw NestedAppAuthError.createUnsupportedError();
    }

    /**
     * acquireTokenNative flow is not currently supported in nested app auth
     * @param request
     * @param apiId
     * @param accountId
     */
    acquireTokenNative(
        request: // eslint-disable-line @typescript-eslint/no-unused-vars
        | SilentRequest
            | Partial<
                  Omit<
                      CommonAuthorizationUrlRequest,
                      | "requestedClaimsHash"
                      | "responseMode"
                      | "codeChallenge"
                      | "codeChallengeMethod"
                      | "nativeBroker"
                  >
              >
            | PopupRequest,
        apiId: ApiId, // eslint-disable-line @typescript-eslint/no-unused-vars
        accountId?: string | undefined // eslint-disable-line @typescript-eslint/no-unused-vars
    ): Promise<AuthenticationResult> {
        throw NestedAppAuthError.createUnsupportedError();
    }

    /**
     * acquireTokenByRefreshToken flow is not currently supported in nested app auth
     * @param commonRequest
     * @param silentRequest
     */
    acquireTokenByRefreshToken(
        commonRequest: CommonSilentFlowRequest, // eslint-disable-line @typescript-eslint/no-unused-vars
        silentRequest: SilentRequest // eslint-disable-line @typescript-eslint/no-unused-vars
    ): Promise<AuthenticationResult> {
        throw NestedAppAuthError.createUnsupportedError();
    }

    /**
     * Adds event callbacks to array
     * @param callback
     * @param eventTypes
     */
    addEventCallback(
        callback: EventCallbackFunction,
        eventTypes?: Array<EventType>
    ): string | null {
        return this.eventHandler.addEventCallback(callback, eventTypes);
    }

    /**
     * Removes callback with provided id from callback array
     * @param callbackId
     */
    removeEventCallback(callbackId: string): void {
        this.eventHandler.removeEventCallback(callbackId);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    addPerformanceCallback(callback: PerformanceCallbackFunction): string {
        throw NestedAppAuthError.createUnsupportedError();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    removePerformanceCallback(callbackId: string): boolean {
        throw NestedAppAuthError.createUnsupportedError();
    }

    enableAccountStorageEvents(): void {
        throw NestedAppAuthError.createUnsupportedError();
    }

    disableAccountStorageEvents(): void {
        throw NestedAppAuthError.createUnsupportedError();
    }

    // #region Account APIs

    /**
     * Returns all the accounts in the cache that match the optional filter. If no filter is provided, all accounts are returned.
     * @param accountFilter - (Optional) filter to narrow down the accounts returned
     * @returns Array of AccountInfo objects in cache
     */
    getAllAccounts(accountFilter?: AccountFilter): AccountInfo[] {
        return AccountManager.getAllAccounts(
            this.logger,
            this.browserStorage,
            this.isBrowserEnv(),
            accountFilter
        );
    }

    /**
     * Returns the first account found in the cache that matches the account filter passed in.
     * @param accountFilter
     * @returns The first account found in the cache matching the provided filter or null if no account could be found.
     */
    getAccount(accountFilter: AccountFilter): AccountInfo | null {
        return AccountManager.getAccount(
            accountFilter,
            this.logger,
            this.browserStorage
        );
    }

    /**
     * Returns the signed in account matching username.
     * (the account object is created at the time of successful login)
     * or null when no matching account is found.
     * This API is provided for convenience but getAccountById should be used for best reliability
     * @param username
     * @returns The account object stored in MSAL
     */
    getAccountByUsername(username: string): AccountInfo | null {
        return AccountManager.getAccountByUsername(
            username,
            this.logger,
            this.browserStorage
        );
    }

    /**
     * Returns the signed in account matching homeAccountId.
     * (the account object is created at the time of successful login)
     * or null when no matching account is found
     * @param homeAccountId
     * @returns The account object stored in MSAL
     */
    getAccountByHomeId(homeAccountId: string): AccountInfo | null {
        return AccountManager.getAccountByHomeId(
            homeAccountId,
            this.logger,
            this.browserStorage
        );
    }

    /**
     * Returns the signed in account matching localAccountId.
     * (the account object is created at the time of successful login)
     * or null when no matching account is found
     * @param localAccountId
     * @returns The account object stored in MSAL
     */
    getAccountByLocalId(localAccountId: string): AccountInfo | null {
        return AccountManager.getAccountByLocalId(
            localAccountId,
            this.logger,
            this.browserStorage
        );
    }

    /**
     * Sets the account to use as the active account. If no account is passed to the acquireToken APIs, then MSAL will use this active account.
     * @param account
     */
    setActiveAccount(account: AccountInfo | null): void {
        /*
         * StandardController uses this to allow the developer to set the active account
         * in the nested app auth scenario the active account is controlled by the app hosting the nested app
         */
        return AccountManager.setActiveAccount(account, this.browserStorage);
    }

    /**
     * Gets the currently active account
     */
    getActiveAccount(): AccountInfo | null {
        return AccountManager.getActiveAccount(this.browserStorage);
    }

    // #endregion

    handleRedirectPromise(
        hash?: string | undefined // eslint-disable-line @typescript-eslint/no-unused-vars
    ): Promise<AuthenticationResult | null> {
        return Promise.resolve(null);
    }
    loginPopup(
        request?: PopupRequest | undefined // eslint-disable-line @typescript-eslint/no-unused-vars
    ): Promise<AuthenticationResult> {
        return this.acquireTokenInteractive(request || DEFAULT_REQUEST);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    loginRedirect(request?: RedirectRequest | undefined): Promise<void> {
        throw NestedAppAuthError.createUnsupportedError();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    logout(logoutRequest?: EndSessionRequest | undefined): Promise<void> {
        throw NestedAppAuthError.createUnsupportedError();
    }
    logoutRedirect(
        logoutRequest?: EndSessionRequest | undefined // eslint-disable-line @typescript-eslint/no-unused-vars
    ): Promise<void> {
        throw NestedAppAuthError.createUnsupportedError();
    }
    logoutPopup(
        logoutRequest?: EndSessionPopupRequest | undefined // eslint-disable-line @typescript-eslint/no-unused-vars
    ): Promise<void> {
        throw NestedAppAuthError.createUnsupportedError();
    }
    ssoSilent(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request: Partial<
            Omit<
                CommonAuthorizationUrlRequest,
                | "requestedClaimsHash"
                | "responseMode"
                | "codeChallenge"
                | "codeChallengeMethod"
                | "nativeBroker"
            >
        >
    ): Promise<AuthenticationResult> {
        return this.acquireTokenSilentInternal(request as SilentRequest);
    }
    getTokenCache(): ITokenCache {
        throw NestedAppAuthError.createUnsupportedError();
    }

    /**
     * Returns the logger instance
     */
    public getLogger(): Logger {
        return this.logger;
    }

    /**
     * Replaces the default logger set in configurations with new Logger with new configurations
     * @param logger Logger instance
     */
    setLogger(logger: Logger): void {
        this.logger = logger;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    initializeWrapperLibrary(sku: WrapperSKU, version: string): void {
        /*
         * Standard controller uses this to set the sku and version of the wrapper library in the storage
         * we do nothing here
         */
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setNavigationClient(navigationClient: INavigationClient): void {
        this.logger.warning(
            "setNavigationClient is not supported in nested app auth"
        );
    }

    getConfiguration(): BrowserConfiguration {
        return this.config;
    }

    isBrowserEnv(): boolean {
        return this.operatingContext.isBrowserEnvironment();
    }

    getBrowserCrypto(): ICrypto {
        return this.browserCrypto;
    }

    getPerformanceClient(): IPerformanceClient {
        throw NestedAppAuthError.createUnsupportedError();
    }

    getRedirectResponse(): Map<string, Promise<AuthenticationResult | null>> {
        throw NestedAppAuthError.createUnsupportedError();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async clearCache(logoutRequest?: ClearCacheRequest): Promise<void> {
        throw NestedAppAuthError.createUnsupportedError();
    }

    async hydrateCache(
        result: AuthenticationResult,
        request:
            | SilentRequest
            | SsoSilentRequest
            | RedirectRequest
            | PopupRequest
    ): Promise<void> {
        this.logger.verbose("hydrateCache called");

        const accountEntity = AccountEntity.createFromAccountInfo(
            result.account,
            result.cloudGraphHostName,
            result.msGraphHost
        );
        this.browserStorage.setAccount(accountEntity);
        return this.browserStorage.hydrateCache(result, request);
    }
}

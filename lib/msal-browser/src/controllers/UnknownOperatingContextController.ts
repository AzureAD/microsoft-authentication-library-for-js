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
} from "@azure/msal-common";
import { ITokenCache } from "../cache/ITokenCache";
import { BrowserConfiguration } from "../config/Configuration";
import { NativeMessageHandler } from "../broker/nativeBroker/NativeMessageHandler";
import { PopupClient } from "../interaction_client/PopupClient";
import { SilentIframeClient } from "../interaction_client/SilentIframeClient";
import {
    BrowserCacheManager,
    DEFAULT_BROWSER_CACHE_MANAGER,
} from "../cache/BrowserCacheManager";
import { INavigationClient } from "../navigation/INavigationClient";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest";
import { EndSessionPopupRequest } from "../request/EndSessionPopupRequest";
import { EndSessionRequest } from "../request/EndSessionRequest";
import { PopupRequest } from "../request/PopupRequest";
import { RedirectRequest } from "../request/RedirectRequest";
import { SilentRequest } from "../request/SilentRequest";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { ApiId, WrapperSKU, InteractionType } from "../utils/BrowserConstants";
import { IController } from "./IController";
import { UnknownOperatingContext } from "../operatingcontext/UnknownOperatingContext";
import { CryptoOps } from "../crypto/CryptoOps";
import { BrowserUtils } from "../utils/BrowserUtils";
import { EventHandler } from "../event/EventHandler";
import { EventCallbackFunction } from "../event/EventMessage";

/**
 * UnknownOperatingContextController class
 *
 * - Until initialize method is called, this controller is the default
 * - AFter initialize method is called, this controller will be swapped out for the appropriate controller
 * if the operating context can be determined; otherwise this controller will continued be used
 *
 * - Why do we have this?  We don't want to dynamically import (download) all of the code in StandardController if we don't need to.
 *
 * - Only includes implementation for getAccounts and handleRedirectPromise
 *   - All other methods are will throw initialization error (because either initialize method or the factory method were not used)
 *   - This controller is necessary for React Native wrapper.... hopefully can be removed in the future
 */
export class UnknownOperatingContextController implements IController {
    // OperatingContext
    protected readonly operatingContext: UnknownOperatingContext;

    // Logger
    protected logger: Logger;

    // Storage interface implementation
    protected readonly browserStorage: BrowserCacheManager;

    // Input configuration by developer/user
    protected readonly config: BrowserConfiguration;

    // Performance telemetry client
    protected readonly performanceClient: IPerformanceClient;

    // Crypto interface implementation
    protected readonly browserCrypto: ICrypto;

    // Flag to indicate if in browser environment
    protected isBrowserEnvironment: boolean;

    // Flag representing whether or not the initialize API has been called and completed
    protected initialized: boolean = false;

    protected readonly eventHandler: EventHandler;

    constructor(operatingContext: UnknownOperatingContext) {
        this.operatingContext = operatingContext;

        this.isBrowserEnvironment =
            this.operatingContext.isBrowserEnvironment();

        this.config = operatingContext.getConfig();

        this.logger = operatingContext.getLogger();

        // Initialize performance client
        this.performanceClient = this.config.telemetry.client;

        // Initialize the crypto class.
        this.browserCrypto = this.isBrowserEnvironment
            ? new CryptoOps(this.logger, this.performanceClient)
            : DEFAULT_CRYPTO_IMPLEMENTATION;

        // Initialize the browser storage class.
        this.browserStorage = this.isBrowserEnvironment
            ? new BrowserCacheManager(
                  this.config.auth.clientId,
                  this.config.cache,
                  this.browserCrypto,
                  this.logger
              )
            : DEFAULT_BROWSER_CACHE_MANAGER(
                  this.config.auth.clientId,
                  this.logger
              );

        this.eventHandler = new EventHandler(this.logger, this.browserCrypto);
    }
    getBrowserStorage(): BrowserCacheManager {
        return this.browserStorage;
    }
    getNativeInternalStorage(): BrowserCacheManager {
        return this.browserStorage;
    }
    getNativeExtensionProvider(): NativeMessageHandler | undefined {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return undefined;
    }
    setNativeExtensionProvider(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        provider: NativeMessageHandler | undefined
    ): void {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return undefined;
    }
    getNativeAccountId(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request:
            | PopupRequest
            | RedirectRequest
            | Partial<
                  Omit<
                      CommonAuthorizationUrlRequest,
                      | "responseMode"
                      | "codeChallenge"
                      | "codeChallengeMethod"
                      | "requestedClaimsHash"
                      | "nativeBroker"
                  >
              >
    ): string {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return "";
    }
    getEventHandler(): EventHandler {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return {} as EventHandler;
    }

    getAccountByHomeId(homeAccountId: string): AccountInfo | null {
        this.logger.trace("getAccountByHomeId called");
        if (!homeAccountId) {
            this.logger.warning(
                "getAccountByHomeId: No homeAccountId provided"
            );
            return null;
        }

        const account = this.browserStorage.getAccountInfoFilteredBy({
            homeAccountId,
        });
        if (account) {
            this.logger.verbose(
                "getAccountByHomeId: Account matching homeAccountId found, returning"
            );
            this.logger.verbosePii(
                `getAccountByHomeId: Returning signed-in accounts matching homeAccountId: ${homeAccountId}`
            );
            return account;
        } else {
            this.logger.verbose(
                "getAccountByHomeId: No matching account found, returning null"
            );
            return null;
        }
    }
    getAccountByLocalId(localAccountId: string): AccountInfo | null {
        this.logger.trace("getAccountByLocalId called");
        if (!localAccountId) {
            this.logger.warning(
                "getAccountByLocalId: No localAccountId provided"
            );
            return null;
        }

        const account = this.browserStorage.getAccountInfoFilteredBy({
            localAccountId,
        });
        if (account) {
            this.logger.verbose(
                "getAccountByLocalId: Account matching localAccountId found, returning"
            );
            this.logger.verbosePii(
                `getAccountByLocalId: Returning signed-in accounts matching localAccountId: ${localAccountId}`
            );
            return account;
        } else {
            this.logger.verbose(
                "getAccountByLocalId: No matching account found, returning null"
            );
            return null;
        }
    }
    getAccountByUsername(username: string): AccountInfo | null {
        this.logger.trace("getAccountByUsername called");
        if (!username) {
            this.logger.warning("getAccountByUsername: No username provided");
            return null;
        }

        const account = this.browserStorage.getAccountInfoFilteredBy({
            username,
        });
        if (account) {
            this.logger.verbose(
                "getAccountByUsername: Account matching username found, returning"
            );
            this.logger.verbosePii(
                `getAccountByUsername: Returning signed-in accounts matching username: ${username}`
            );
            return account;
        } else {
            this.logger.verbose(
                "getAccountByUsername: No matching account found, returning null"
            );
            return null;
        }
    }
    getAllAccounts(): AccountInfo[] {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        return [];
    }
    initialize(): Promise<void> {
        this.initialized = true;
        return Promise.resolve();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    acquireTokenPopup(request: PopupRequest): Promise<AuthenticationResult> {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return {} as Promise<AuthenticationResult>;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    acquireTokenRedirect(request: RedirectRequest): Promise<void> {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return Promise.resolve();
    }
    acquireTokenSilent(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        silentRequest: SilentRequest
    ): Promise<AuthenticationResult> {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return {} as Promise<AuthenticationResult>;
    }
    acquireTokenByCode(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request: AuthorizationCodeRequest
    ): Promise<AuthenticationResult> {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return {} as Promise<AuthenticationResult>;
    }
    acquireTokenNative(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request:
            | PopupRequest
            | SilentRequest
            | Partial<
                  Omit<
                      CommonAuthorizationUrlRequest,
                      | "responseMode"
                      | "codeChallenge"
                      | "codeChallengeMethod"
                      | "requestedClaimsHash"
                      | "nativeBroker"
                  >
              >,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        apiId: ApiId,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        accountId?: string | undefined
    ): Promise<AuthenticationResult> {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return {} as Promise<AuthenticationResult>;
    }
    acquireTokenByRefreshToken(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        commonRequest: CommonSilentFlowRequest,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        silentRequest: SilentRequest
    ): Promise<AuthenticationResult> {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return {} as Promise<AuthenticationResult>;
    }
    addEventCallback(callback: EventCallbackFunction): string | null {
        return this.eventHandler.addEventCallback(callback);
    }
    removeEventCallback(callbackId: string): void {
        this.eventHandler.removeEventCallback(callbackId);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    addPerformanceCallback(callback: PerformanceCallbackFunction): string {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return "";
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    removePerformanceCallback(callbackId: string): boolean {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return true;
    }
    enableAccountStorageEvents(): void {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
    }
    disableAccountStorageEvents(): void {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
    }

    handleRedirectPromise(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        hash?: string | undefined
    ): Promise<AuthenticationResult | null> {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        return Promise.resolve(null);
    }
    loginPopup(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request?: PopupRequest | undefined
    ): Promise<AuthenticationResult> {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return {} as Promise<AuthenticationResult>;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    loginRedirect(request?: RedirectRequest | undefined): Promise<void> {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return {} as Promise<void>;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    logout(logoutRequest?: EndSessionRequest | undefined): Promise<void> {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return {} as Promise<void>;
    }
    logoutRedirect(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        logoutRequest?: EndSessionRequest | undefined
    ): Promise<void> {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return {} as Promise<void>;
    }
    logoutPopup(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        logoutRequest?: EndSessionPopupRequest | undefined
    ): Promise<void> {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return {} as Promise<void>;
    }
    ssoSilent(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request: Partial<
            Omit<
                CommonAuthorizationUrlRequest,
                | "responseMode"
                | "codeChallenge"
                | "codeChallengeMethod"
                | "requestedClaimsHash"
                | "nativeBroker"
            >
        >
    ): Promise<AuthenticationResult> {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return {} as Promise<AuthenticationResult>;
    }
    getTokenCache(): ITokenCache {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return {} as ITokenCache;
    }
    getLogger(): Logger {
        return this.logger;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setLogger(logger: Logger): void {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setActiveAccount(account: AccountInfo | null): void {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
    }
    getActiveAccount(): AccountInfo | null {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    initializeWrapperLibrary(sku: WrapperSKU, version: string): void {
        this.browserStorage.setWrapperMetadata(sku, version);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setNavigationClient(navigationClient: INavigationClient): void {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
    }
    getConfiguration(): BrowserConfiguration {
        return this.config;
    }
    isBrowserEnv(): boolean {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return true;
    }
    getBrowserCrypto(): ICrypto {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return {} as ICrypto;
    }
    getPerformanceClient(): IPerformanceClient {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return {} as IPerformanceClient;
    }
    getNavigationClient(): INavigationClient {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return {} as INavigationClient;
    }
    getRedirectResponse(): Map<string, Promise<AuthenticationResult | null>> {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return {} as Map<string, Promise<AuthenticationResult | null>>;
    }
    preflightBrowserEnvironmentCheck(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        interactionType: InteractionType,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        isAppEmbedded?: boolean | undefined
    ): void {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
    }
    canUseNative(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request:
            | PopupRequest
            | RedirectRequest
            | Partial<
                  Omit<
                      CommonAuthorizationUrlRequest,
                      | "responseMode"
                      | "codeChallenge"
                      | "codeChallengeMethod"
                      | "requestedClaimsHash"
                      | "nativeBroker"
                  >
              >,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        accountId?: string | undefined
    ): boolean {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return false;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createPopupClient(correlationId?: string | undefined): PopupClient {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return {} as PopupClient;
    }
    createSilentIframeClient(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        correlationId?: string | undefined
    ): SilentIframeClient {
        BrowserUtils.blockAPICallsBeforeInitialize(this.initialized);
        BrowserUtils.blockNonBrowserEnvironment(this.isBrowserEnvironment);
        return {} as SilentIframeClient;
    }
}

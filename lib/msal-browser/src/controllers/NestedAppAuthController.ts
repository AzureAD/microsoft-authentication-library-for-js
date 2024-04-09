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
    AccountFilter,
    TimeUtils,
} from "@azure/msal-common";
import { ITokenCache } from "../cache/ITokenCache";
import { BrowserConfiguration } from "../config/Configuration";
import { INavigationClient } from "../navigation/INavigationClient";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest";
import { EndSessionPopupRequest } from "../request/EndSessionPopupRequest";
import { EndSessionRequest } from "../request/EndSessionRequest";
import { PopupRequest } from "../request/PopupRequest";
import { RedirectRequest } from "../request/RedirectRequest";
import { SilentRequest } from "../request/SilentRequest";
import { SsoSilentRequest } from "../request/SsoSilentRequest";
import {
    ApiId,
    WrapperSKU,
    InteractionType,
    DEFAULT_REQUEST,
} from "../utils/BrowserConstants";
import { IController } from "./IController";
import { TeamsAppOperatingContext } from "../operatingcontext/TeamsAppOperatingContext";
import { IBridgeProxy } from "../naa/IBridgeProxy";
import { CryptoOps } from "../crypto/CryptoOps";
import { NestedAppAuthAdapter } from "../naa/mapping/NestedAppAuthAdapter";
import { NestedAppAuthError } from "../error/NestedAppAuthError";
import { EventHandler } from "../event/EventHandler";
import { EventType } from "../event/EventType";
import { EventCallbackFunction, EventError } from "../event/EventMessage";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { ClearCacheRequest } from "../request/ClearCacheRequest";

export class NestedAppAuthController implements IController {
    // OperatingContext
    protected readonly operatingContext: TeamsAppOperatingContext;

    // BridgeProxy
    protected readonly bridgeProxy: IBridgeProxy;

    // Crypto interface implementation
    protected readonly browserCrypto: ICrypto;

    // Input configuration by developer/user
    protected readonly config: BrowserConfiguration;

    // Logger
    protected logger: Logger;

    // Performance telemetry client
    protected readonly performanceClient: IPerformanceClient;

    // EventHandler
    protected readonly eventHandler: EventHandler;

    // NestedAppAuthAdapter
    protected readonly nestedAppAuthAdapter: NestedAppAuthAdapter;

    constructor(operatingContext: TeamsAppOperatingContext) {
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
            ? new CryptoOps(this.logger, this.performanceClient)
            : DEFAULT_CRYPTO_IMPLEMENTATION;

        this.eventHandler = new EventHandler(this.logger, this.browserCrypto);

        this.nestedAppAuthAdapter = new NestedAppAuthAdapter(
            this.config.auth.clientId,
            this.config.auth.clientCapabilities,
            this.browserCrypto,
            this.logger
        );
    }
    getBrowserStorage(): BrowserCacheManager {
        throw NestedAppAuthError.createUnsupportedError();
    }

    getEventHandler(): EventHandler {
        return this.eventHandler;
    }

    static async createController(
        operatingContext: TeamsAppOperatingContext
    ): Promise<IController> {
        const controller = new NestedAppAuthController(operatingContext);
        return Promise.resolve(controller);
    }

    initialize(): Promise<void> {
        // do nothing not required by this controller
        return Promise.resolve();
    }

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
            const result: AuthenticationResult =
                this.nestedAppAuthAdapter.fromNaaTokenResponse(
                    naaRequest,
                    response,
                    reqTimestamp
                );

            this.operatingContext.setActiveAccount(result.account);
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

    private async acquireTokenSilentInternal(
        request: SilentRequest
    ): Promise<AuthenticationResult> {
        const validRequest = this.ensureValidRequest(request);
        this.eventHandler.emitEvent(
            EventType.ACQUIRE_TOKEN_START,
            InteractionType.Silent,
            validRequest
        );

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

            this.operatingContext.setActiveAccount(result.account);
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

    async acquireTokenPopup(
        request: PopupRequest
    ): Promise<AuthenticationResult> {
        return this.acquireTokenInteractive(request);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    acquireTokenRedirect(request: RedirectRequest): Promise<void> {
        throw NestedAppAuthError.createUnsupportedError();
    }

    async acquireTokenSilent(
        silentRequest: SilentRequest
    ): Promise<AuthenticationResult> {
        return this.acquireTokenSilentInternal(silentRequest);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    acquireTokenByCode(
        request: AuthorizationCodeRequest // eslint-disable-line @typescript-eslint/no-unused-vars
    ): Promise<AuthenticationResult> {
        throw NestedAppAuthError.createUnsupportedError();
    }
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
    acquireTokenByRefreshToken(
        commonRequest: CommonSilentFlowRequest, // eslint-disable-line @typescript-eslint/no-unused-vars
        silentRequest: SilentRequest // eslint-disable-line @typescript-eslint/no-unused-vars
    ): Promise<AuthenticationResult> {
        throw NestedAppAuthError.createUnsupportedError();
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getAccount(accountFilter: AccountFilter): AccountInfo | null {
        throw NestedAppAuthError.createUnsupportedError();
        // TODO: Look at standard implementation
    }

    getAccountByHomeId(homeAccountId: string): AccountInfo | null {
        const currentAccount = this.operatingContext.getActiveAccount();
        if (currentAccount !== undefined) {
            if (currentAccount.homeAccountId === homeAccountId) {
                return this.nestedAppAuthAdapter.fromNaaAccountInfo(
                    currentAccount
                );
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    getAccountByLocalId(localId: string): AccountInfo | null {
        const currentAccount = this.operatingContext.getActiveAccount();
        if (currentAccount !== undefined) {
            if (currentAccount.localAccountId === localId) {
                return this.nestedAppAuthAdapter.fromNaaAccountInfo(
                    currentAccount
                );
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    getAccountByUsername(userName: string): AccountInfo | null {
        const currentAccount = this.operatingContext.getActiveAccount();
        if (currentAccount !== undefined) {
            if (currentAccount.username === userName) {
                return this.nestedAppAuthAdapter.fromNaaAccountInfo(
                    currentAccount
                );
            } else {
                return null;
            }
        } else {
            return null;
        }
    }
    getAllAccounts(): AccountInfo[] {
        const currentAccount = this.operatingContext.getActiveAccount();
        if (currentAccount !== undefined) {
            return [
                this.nestedAppAuthAdapter.fromNaaAccountInfo(currentAccount),
            ];
        } else {
            return [];
        }
    }
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
    setActiveAccount(account: AccountInfo | null): void {
        /*
         * StandardController uses this to allow the developer to set the active account
         * in the nested app auth scenario the active account is controlled by the app hosting the nested app
         */
        this.logger.warning("nestedAppAuth does not support setActiveAccount");
        return;
    }
    getActiveAccount(): AccountInfo | null {
        const currentAccount = this.operatingContext.getActiveAccount();
        if (currentAccount !== undefined) {
            return this.nestedAppAuthAdapter.fromNaaAccountInfo(currentAccount);
        } else {
            return null;
        }
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async hydrateCache(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        result: AuthenticationResult,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request:
            | SilentRequest
            | SsoSilentRequest
            | RedirectRequest
            | PopupRequest
    ): Promise<void> {
        throw NestedAppAuthError.createUnsupportedError();
    }
}

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationResult,
    CommonAuthorizationUrlRequest,
    CommonSilentFlowRequest,
    PerformanceCallbackFunction,
    AccountInfo,
    Logger,
    ICrypto,
    IPerformanceClient,
    StubPerformanceClient,
    DEFAULT_CRYPTO_IMPLEMENTATION,
} from "@azure/msal-common";
import { ITokenCache } from "../cache/ITokenCache";
import { BrowserConfiguration } from "../config/Configuration";
import { PopupClient } from "../interaction_client/PopupClient";
import { SilentIframeClient } from "../interaction_client/SilentIframeClient";
import { INavigationClient } from "../navigation/INavigationClient";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest";
import { EndSessionPopupRequest } from "../request/EndSessionPopupRequest";
import { EndSessionRequest } from "../request/EndSessionRequest";
import { PopupRequest } from "../request/PopupRequest";
import { RedirectRequest } from "../request/RedirectRequest";
import { SilentRequest } from "../request/SilentRequest";
import { ApiId, WrapperSKU, InteractionType } from "../utils/BrowserConstants";
import { IController } from "./IController";
import { TeamsAppOperatingContext } from "../operatingcontext/TeamsAppOperatingContext";
import { IBridgeProxy } from "../naa/IBridgeProxy";
import { BrowserPerformanceClient } from "../telemetry/BrowserPerformanceClient";
import { version, name } from "../packageMetadata";
import { CryptoOps } from "../crypto/CryptoOps";
import { NestedAppAuthAdapter } from "../naa/mapping/NestedAppAuthAdapter";
import { NestedAppAuthError } from "../error/NestedAppAuthError";

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
        this.performanceClient = operatingContext.isBrowserEnvironment()
            ? new BrowserPerformanceClient(
                  this.config.auth.clientId,
                  this.config.auth.authority,
                  this.logger,
                  name,
                  version,
                  this.config.telemetry.application,
                  this.config.system.cryptoOptions
              )
            : new StubPerformanceClient(
                  this.config.auth.clientId,
                  this.config.auth.authority,
                  this.logger,
                  name,
                  version,
                  this.config.telemetry.application
              );

        // Initialize the crypto class.
        this.browserCrypto = operatingContext.isBrowserEnvironment()
            ? new CryptoOps(
                  this.logger,
                  this.performanceClient,
                  this.config.system.cryptoOptions
              )
            : DEFAULT_CRYPTO_IMPLEMENTATION;

        this.nestedAppAuthAdapter = new NestedAppAuthAdapter(
            this.config.auth.clientId,
            this.config.auth.clientCapabilities,
            this.browserCrypto,
            this.logger
        );
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

    private async acquireTokenInteractive(
        request: PopupRequest | RedirectRequest
    ): Promise<AuthenticationResult> {
        const naaRequest = this.nestedAppAuthAdapter.toNaaTokenRequest(request);
        const response = await this.bridgeProxy.getTokenInteractive(naaRequest);

        return this.nestedAppAuthAdapter.fromNaaTokenResponse(
            naaRequest,
            response
        );
    }

    private async acquireTokenSilentInternal(
        request: SilentRequest
    ): Promise<AuthenticationResult> {
        const naaRequest =
            this.nestedAppAuthAdapter.toNaaSilentTokenRequest(request);
        const response = await this.bridgeProxy.getTokenSilent(naaRequest);

        return this.nestedAppAuthAdapter.fromNaaTokenResponse(
            naaRequest,
            response
        );
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    addEventCallback(callback: Function): string | null {
        throw NestedAppAuthError.createUnsupportedError();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    removeEventCallback(callbackId: string): void {
        throw NestedAppAuthError.createUnsupportedError();
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        throw new Error("Method not implemented.");
    }
    handleRedirectPromise(
        hash?: string | undefined // eslint-disable-line @typescript-eslint/no-unused-vars
    ): Promise<AuthenticationResult | null> {
        throw new Error("Method not implemented.");
    }
    loginPopup(
        request?: PopupRequest | undefined // eslint-disable-line @typescript-eslint/no-unused-vars
    ): Promise<AuthenticationResult> {
        if (request !== undefined) {
            return this.acquireTokenInteractive(request);
        } else {
            throw NestedAppAuthError.createUnsupportedError();
        }
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
        throw NestedAppAuthError.createUnsupportedError();
    }
    getTokenCache(): ITokenCache {
        throw NestedAppAuthError.createUnsupportedError();
    }
    getLogger(): Logger {
        throw NestedAppAuthError.createUnsupportedError();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setLogger(logger: Logger): void {
        throw NestedAppAuthError.createUnsupportedError();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setActiveAccount(account: AccountInfo | null): void {
        throw NestedAppAuthError.createUnsupportedError();
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
        // Do nothing for this for now
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setNavigationClient(navigationClient: INavigationClient): void {
        throw NestedAppAuthError.createUnsupportedError();
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
    getNativeAccountId(
        request: // eslint-disable-line @typescript-eslint/no-unused-vars
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
            | PopupRequest
            | RedirectRequest
    ): string {
        throw NestedAppAuthError.createUnsupportedError();
    }
    getNavigationClient(): INavigationClient {
        throw NestedAppAuthError.createUnsupportedError();
    }
    getRedirectResponse(): Map<string, Promise<AuthenticationResult | null>> {
        throw NestedAppAuthError.createUnsupportedError();
    }
    preflightBrowserEnvironmentCheck(
        interactionType: InteractionType, // eslint-disable-line @typescript-eslint/no-unused-vars
        setInteractionInProgress?: boolean | undefined // eslint-disable-line @typescript-eslint/no-unused-vars
    ): void {
        throw NestedAppAuthError.createUnsupportedError();
    }
    canUseNative(
        request: // eslint-disable-line @typescript-eslint/no-unused-vars
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
            | PopupRequest
            | RedirectRequest,
        accountId?: string | undefined // eslint-disable-line @typescript-eslint/no-unused-vars
    ): boolean {
        throw NestedAppAuthError.createUnsupportedError();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createPopupClient(correlationId?: string | undefined): PopupClient {
        // eslint-disable-line @typescript-eslint/no-unused-vars
        throw NestedAppAuthError.createUnsupportedError();
    }
    createSilentIframeClient(
        correlationId?: string | undefined // eslint-disable-line @typescript-eslint/no-unused-vars
    ): SilentIframeClient {
        throw NestedAppAuthError.createUnsupportedError();
    }
}

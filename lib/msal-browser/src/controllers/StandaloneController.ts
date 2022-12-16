/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ITokenCache } from "../cache/ITokenCache";
import { BrowserConfiguration } from "../config/Configuration";
import { INavigationClient } from "../navigation/INavigationClient";
import { StandaloneOperatingContext } from "../operatingcontext/StandaloneOperatingContext";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest";
import { PopupRequest } from "../request/PopupRequest";
import { RedirectRequest } from "../request/RedirectRequest";
import { SilentRequest } from "../request/SilentRequest";
import { WrapperSKU } from "../utils/BrowserConstants";
import { IController } from "./IController";
import { StringUtils, InteractionRequiredAuthError, AccountInfo, Constants, INetworkModule, AuthenticationResult, Logger, CommonSilentFlowRequest, ICrypto, DEFAULT_CRYPTO_IMPLEMENTATION, AuthError, PerformanceEvents, PerformanceCallbackFunction, StubPerformanceClient, IPerformanceClient, BaseAuthRequest, PromptValue, ClientAuthError } from "@azure/msal-common";
import { CryptoOps } from "../crypto/CryptoOps";
import { version, name } from "../packageMetadata";
import { BrowserPerformanceClient } from "../telemetry/BrowserPerformanceClient";

export class StandaloneController implements IController{

    // Flag representing whether or not the initialize API has been called and completed
    protected initialized: boolean = false;

    protected context:StandaloneOperatingContext;

    // Performance telemetry client
    protected performanceClient: IPerformanceClient;

    // Crypto interface implementation
    protected readonly browserCrypto: ICrypto;

    // Storage interface implementation
    protected readonly browserStorage: BrowserCacheManager;

    constructor(context:StandaloneOperatingContext){
        this.context = context;
        
        // Initialize performance client
        this.performanceClient = new BrowserPerformanceClient(this.context.getConfig().auth.clientId, 
            this.context.getConfig().auth.authority, 
            this.context.getLogger(), 
            name, 
            version, 
            this.context.getConfig().telemetry.application, 
            this.context.getConfig().system.cryptoOptions);
        
        // Initialize the crypto class.
        this.browserCrypto = new CryptoOps(this.context.getLogger(), this.performanceClient, this.context.getConfig().system.cryptoOptions);
        
    }

    initialize(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    acquireTokenPopup(request: PopupRequest): Promise<AuthenticationResult> {
        throw new Error("Method not implemented.");
    }
    acquireTokenRedirect(request: RedirectRequest): Promise<void> {
        throw new Error("Method not implemented.");
    }
    acquireTokenSilent(silentRequest: SilentRequest): Promise<AuthenticationResult> {
        throw new Error("Method not implemented.");
    }
    acquireTokenByCode(request: AuthorizationCodeRequest): Promise<AuthenticationResult> {
        throw new Error("Method not implemented.");
    }
    addEventCallback(callback: Function): string | null {
        throw new Error("Method not implemented.");
    }
    removeEventCallback(callbackId: string): void {
        throw new Error("Method not implemented.");
    }
    addPerformanceCallback(callback: PerformanceCallbackFunction): string {
        throw new Error("Method not implemented.");
    }
    removePerformanceCallback(callbackId: string): boolean {
        throw new Error("Method not implemented.");
    }
    enableAccountStorageEvents(): void {
        throw new Error("Method not implemented.");
    }
    disableAccountStorageEvents(): void {
        throw new Error("Method not implemented.");
    }
    getAccountByHomeId(homeAccountId: string) {
        throw new Error("Method not implemented.");
    }
    getAccountByLocalId(localId: string) {
        throw new Error("Method not implemented.");
    }
    getAccountByUsername(userName: string) {
        throw new Error("Method not implemented.");
    }
    getAllAccounts(): AccountInfo[] {
        throw new Error("Method not implemented.");
    }
    handleRedirectPromise(hash?: string | undefined): Promise<any> {
        throw new Error("Method not implemented.");
    }
    loginPopup(request?: PopupRequest | undefined): Promise<AuthenticationResult> {
        throw new Error("Method not implemented.");
    }
    loginRedirect(request?: RedirectRequest | undefined): Promise<void> {
        throw new Error("Method not implemented.");
    }
    logout(logoutRequest?: any): Promise<void> {
        throw new Error("Method not implemented.");
    }
    logoutRedirect(logoutRequest?: any): Promise<void> {
        throw new Error("Method not implemented.");
    }
    logoutPopup(logoutRequest?: any): Promise<void> {
        throw new Error("Method not implemented.");
    }
    ssoSilent(request: Partial<Omit<CommonAuthorizationUrlRequest, "responseMode" | "codeChallenge" | "codeChallengeMethod" | "requestedClaimsHash" | "nativeBroker">>): Promise<AuthenticationResult> {
        throw new Error("Method not implemented.");
    }
    getTokenCache(): ITokenCache {
        throw new Error("Method not implemented.");
    }
    getLogger() {
        throw new Error("Method not implemented.");
    }
    setLogger(logger: Logger): void {
        throw new Error("Method not implemented.");
    }
    setActiveAccount(account: any): void {
        throw new Error("Method not implemented.");
    }
    getActiveAccount() {
        throw new Error("Method not implemented.");
    }
    initializeWrapperLibrary(sku: WrapperSKU, version: string): void {
        throw new Error("Method not implemented.");
    }
    setNavigationClient(navigationClient: INavigationClient): void {
        throw new Error("Method not implemented.");
    }
    getConfiguration(): BrowserConfiguration {
        throw new Error("Method not implemented.");
    }
    
}

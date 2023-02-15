/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ITokenCache } from "../cache/ITokenCache";
import { INavigationClient } from "../navigation/INavigationClient";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest";
import { PopupRequest } from "../request/PopupRequest";
import { RedirectRequest } from "../request/RedirectRequest";
import { SilentRequest } from "../request/SilentRequest";
import { WrapperSKU } from "../utils/BrowserConstants";
import { IPublicClientApplication } from "./IPublicClientApplication";
import { IController } from "../controllers/IController";
import { AuthenticationResult, PerformanceCallbackFunction, AccountInfo, Logger, EndSessionRequest, SsoSilentRequest } from "..";
import { ControllerFactory } from "../controllers/ControllerFactory";
import { StandardController } from "../controllers/StandardController";
import { BrowserConfiguration, buildConfiguration, Configuration } from "../config/Configuration";
import { version, name } from "../packageMetadata";
import { StandardOperatingContext } from "../operatingcontext/StandardOperatingContext";

/**
 * The PublicClientApplication class is the object exposed by the library to perform authentication and authorization functions in Single Page Applications
 * to obtain JWT tokens as described in the OAuth 2.0 Authorization Code Flow with PKCE specification.
 */
export class PublicClientApplication implements IPublicClientApplication {

    private controller : IController;

    public static async createPublicClientApplication(configuration: Configuration): Promise<IPublicClientApplication> {

        const factory = new ControllerFactory(configuration);
        const controller = await factory.createController();
        const pca = new PublicClientApplication(configuration, controller);
        
        return pca;
    }

    public constructor(configuration: Configuration, controller?: IController){
        if(controller){
            this.controller = controller;
        }else{
            const config = buildConfiguration(configuration, true);
            const logger = new Logger(config.system.loggerOptions, name, version);
            const standardOperatingContext = new StandardOperatingContext(logger, config);
            this.controller = new StandardController(standardOperatingContext, standardOperatingContext.getConfig());
        }
    }

    initialize(): Promise<void> {
        return this.controller.initialize();
    }
    async acquireTokenPopup(request: PopupRequest): Promise<AuthenticationResult> {
        return this.controller.acquireTokenPopup(request);
    }
    acquireTokenRedirect(request: RedirectRequest): Promise<void> {
        return this.controller.acquireTokenRedirect(request);
    }
    acquireTokenSilent(silentRequest: SilentRequest): Promise<AuthenticationResult> {
        return this.controller.acquireTokenSilent(silentRequest);
    }
    acquireTokenByCode(request: AuthorizationCodeRequest): Promise<AuthenticationResult> {
        return this.controller.acquireTokenByCode(request);
    }
    addEventCallback(callback: Function): string | null {
        return this.controller.addEventCallback(callback);
    }
    removeEventCallback(callbackId: string): void {
        return this.controller.removeEventCallback(callbackId);
    }
    addPerformanceCallback(callback: PerformanceCallbackFunction): string {
        return this.controller.addPerformanceCallback(callback);
    }
    removePerformanceCallback(callbackId: string): boolean {
        return this.controller.removePerformanceCallback(callbackId);
    }
    enableAccountStorageEvents(): void {
        this.controller.enableAccountStorageEvents();
    }
    disableAccountStorageEvents(): void {
        this.controller.disableAccountStorageEvents();
    }
    getAccountByHomeId(homeAccountId: string): AccountInfo | null {
        return this.controller.getAccountByHomeId(homeAccountId);
    }
    getAccountByLocalId(localId: string): AccountInfo | null {
        return this.controller.getAccountByLocalId(localId);
    }
    getAccountByUsername(userName: string): AccountInfo | null {
        return this.controller.getAccountByUsername(userName);
    }
    getAllAccounts(): AccountInfo[] {
        return this.controller.getAllAccounts();
    }
    handleRedirectPromise(hash?: string | undefined): Promise<AuthenticationResult | null> {
        return this.controller.handleRedirectPromise(hash);
    }
    loginPopup(request?: PopupRequest | undefined): Promise<AuthenticationResult> {
        return this.controller.loginPopup(request);
    }
    loginRedirect(request?: RedirectRequest | undefined): Promise<void> {
        return this.controller.loginRedirect(request);
    }
    logout(logoutRequest?: EndSessionRequest): Promise<void> {
        return this.controller.logout(logoutRequest);
    }
    logoutRedirect(logoutRequest?: EndSessionRequest): Promise<void> {
        return this.controller.logoutRedirect(logoutRequest);
    }
    logoutPopup(logoutRequest?: EndSessionRequest): Promise<void> {
        return this.controller.logoutPopup(logoutRequest);
    }
    ssoSilent(request: SsoSilentRequest): Promise<AuthenticationResult> {
        return this.controller.ssoSilent(request);
    }
    getTokenCache(): ITokenCache {
        return this.controller.getTokenCache();
    }
    getLogger(): Logger {
        return this.controller.getLogger();
    }
    setLogger(logger: Logger): void {
        this.controller.setLogger(logger);
    }
    setActiveAccount(account: AccountInfo | null): void {
        this.controller.setActiveAccount(account);
    }
    getActiveAccount(): AccountInfo | null {
        return this.controller.getActiveAccount();
    }
    initializeWrapperLibrary(sku: WrapperSKU, version: string): void {
        return this.initializeWrapperLibrary(sku, version);
    }
    setNavigationClient(navigationClient: INavigationClient): void {
        this.controller.setNavigationClient(navigationClient);
    }
    getConfiguration(): BrowserConfiguration {
        return this.controller.getConfiguration();
    }
    
}

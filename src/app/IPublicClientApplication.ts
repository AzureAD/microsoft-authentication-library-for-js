/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, AccountInfo, Logger, PerformanceCallbackFunction } from "@azure/msal-common";
import { RedirectRequest } from "../request/RedirectRequest";
import { PopupRequest } from "../request/PopupRequest";
import { SilentRequest } from "../request/SilentRequest";
import { SsoSilentRequest } from "../request/SsoSilentRequest";
import { EndSessionRequest } from "../request/EndSessionRequest";
import { BrowserConfigurationAuthError } from "../error/BrowserConfigurationAuthError";
import { WrapperSKU } from "../utils/BrowserConstants";
import { INavigationClient } from "../navigation/INavigationClient";
import { EndSessionPopupRequest } from "../request/EndSessionPopupRequest";
import { ITokenCache } from "../cache/ITokenCache";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest";
import { BrowserConfiguration } from "../config/Configuration";

export interface IPublicClientApplication {
    initialize(): Promise<void>;
    acquireTokenPopup(request: PopupRequest): Promise<AuthenticationResult>;
    acquireTokenRedirect(request: RedirectRequest): Promise<void>;
    acquireTokenSilent(silentRequest: SilentRequest): Promise<AuthenticationResult>;
    acquireTokenByCode(request: AuthorizationCodeRequest): Promise<AuthenticationResult>;
    addEventCallback(callback: Function): string | null;
    removeEventCallback(callbackId: string): void;
    addPerformanceCallback(callback: PerformanceCallbackFunction): string;
    removePerformanceCallback(callbackId: string): boolean;
    enableAccountStorageEvents(): void;
    disableAccountStorageEvents(): void;
    getAccountByHomeId(homeAccountId: string): AccountInfo | null;
    getAccountByLocalId(localId: string): AccountInfo | null;
    getAccountByUsername(userName: string): AccountInfo | null;
    getAllAccounts(): AccountInfo[];
    handleRedirectPromise(hash?: string): Promise<AuthenticationResult | null>;
    loginPopup(request?: PopupRequest): Promise<AuthenticationResult>;
    loginRedirect(request?: RedirectRequest): Promise<void>;
    logout(logoutRequest?: EndSessionRequest): Promise<void>;
    logoutRedirect(logoutRequest?: EndSessionRequest): Promise<void>;
    logoutPopup(logoutRequest?: EndSessionPopupRequest): Promise<void>;
    ssoSilent(request: SsoSilentRequest): Promise<AuthenticationResult>;
    getTokenCache(): ITokenCache;
    getLogger(): Logger;
    setLogger(logger: Logger): void;
    setActiveAccount(account: AccountInfo | null): void;
    getActiveAccount(): AccountInfo | null;
    initializeWrapperLibrary(sku: WrapperSKU, version: string): void;
    setNavigationClient(navigationClient: INavigationClient): void;
    getConfiguration(): BrowserConfiguration;
}

export const stubbedPublicClientApplication: IPublicClientApplication = {
    initialize: () => {
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());
    },
    acquireTokenPopup: () => {
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());
    },
    acquireTokenRedirect: () => {	
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());	
    },	
    acquireTokenSilent: () => {	
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());	
    },
    acquireTokenByCode: () => {
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());
    },
    getAllAccounts: () => {
        return [];	
    },	
    getAccountByHomeId: () => {
        return null;
    },
    getAccountByUsername: () => {	
        return null;	
    },	
    getAccountByLocalId: () => {
        return null;
    },
    handleRedirectPromise: () => {	
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());	
    },	
    loginPopup: () => {	
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());	
    },	
    loginRedirect: () => {	
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());	
    },	
    logout: () => {	
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());	
    },	
    logoutRedirect: () => {	
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());	
    },
    logoutPopup: () => {	
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());	
    },
    ssoSilent: () => {	
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());	
    },
    addEventCallback: () => {
        return null;
    },
    removeEventCallback: () => {
        return;
    },
    addPerformanceCallback: () => {
        return "";
    },
    removePerformanceCallback: () => {
        return false;
    },
    enableAccountStorageEvents: () => {
        return;
    },
    disableAccountStorageEvents: () => {
        return;
    },
    getTokenCache: () => {
        throw BrowserConfigurationAuthError.createStubPcaInstanceCalledError();
    },
    getLogger: () => {
        throw BrowserConfigurationAuthError.createStubPcaInstanceCalledError();
    },
    setLogger: () => {
        return;
    },
    setActiveAccount: () => {
        return;
    },
    getActiveAccount: () => {
        return null;
    },
    initializeWrapperLibrary: () => {
        return;
    },
    setNavigationClient: () => {
        return;
    },
    getConfiguration: () => {
        throw BrowserConfigurationAuthError.createStubPcaInstanceCalledError();
    }
};

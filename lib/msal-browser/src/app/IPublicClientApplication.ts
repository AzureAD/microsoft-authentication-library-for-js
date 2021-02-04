/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, AccountInfo, Logger } from "@azure/msal-common";
import { RedirectRequest } from "../request/RedirectRequest";
import { PopupRequest } from "../request/PopupRequest";
import { SilentRequest } from "../request/SilentRequest";
import { SsoSilentRequest } from "../request/SsoSilentRequest";
import { EndSessionRequest } from "../request/EndSessionRequest";
import { BrowserConfigurationAuthError } from "../error/BrowserConfigurationAuthError";
import { WrapperSKU } from "../utils/BrowserConstants";

export interface IPublicClientApplication {
    acquireTokenPopup(request: PopupRequest): Promise<AuthenticationResult>;
    acquireTokenRedirect(request: RedirectRequest): Promise<void>;
    acquireTokenSilent(silentRequest: SilentRequest): Promise<AuthenticationResult>;
    addEventCallback(callback: Function): string | null;
    removeEventCallback(callbackId: string): void;
    getAccountByHomeId(homeAccountId: string): AccountInfo | null;
    getAccountByLocalId(localId: string): AccountInfo | null;
    getAccountByUsername(userName: string): AccountInfo | null;
    getAllAccounts(): AccountInfo[];
    handleRedirectPromise(hash?: string): Promise<AuthenticationResult | null>;
    loginPopup(request?: PopupRequest): Promise<AuthenticationResult>;
    loginRedirect(request?: RedirectRequest): Promise<void>;
    logout(logoutRequest?: EndSessionRequest): Promise<void>;
    ssoSilent(request: SsoSilentRequest): Promise<AuthenticationResult>;
    getLogger(): Logger;
    setLogger(logger: Logger): void;
    setActiveAccount(account: AccountInfo | null): void;
    getActiveAccount(): AccountInfo | null;
    initializeWrapperLibrary(sku: WrapperSKU, version: string): void;
}

export const stubbedPublicClientApplication: IPublicClientApplication = {
    acquireTokenPopup: () => {
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());
    },
    acquireTokenRedirect: () => {	
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());	
    },	
    acquireTokenSilent: () => {	
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
    ssoSilent: () => {	
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError());	
    },
    addEventCallback: () => {
        return null;
    },
    removeEventCallback: () => {
        return;
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
    }
};

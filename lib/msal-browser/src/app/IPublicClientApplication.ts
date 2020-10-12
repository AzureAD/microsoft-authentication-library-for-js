import { AuthenticationResult, AccountInfo, EndSessionRequest } from "@azure/msal-common";
import { RedirectRequest } from "../request/RedirectRequest";
import { PopupRequest } from "../request/PopupRequest";
import { SilentRequest } from "../request/SilentRequest";
import { SsoSilentRequest } from "../request/SsoSilentRequest";
import { BrowserConfigurationAuthError } from "../error/BrowserConfigurationAuthError";

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
export interface IPublicClientApplication {
    acquireTokenPopup(request: PopupRequest): Promise<AuthenticationResult>;
    acquireTokenRedirect(request: RedirectRequest): Promise<void>;
    acquireTokenSilent(silentRequest: SilentRequest): Promise<AuthenticationResult>;
    getAccountByUsername(userName: string): AccountInfo | null;
    getAccountByHomeId(homeAccountId: string): AccountInfo | null;
    getAllAccounts(): AccountInfo[];
    handleRedirectPromise(): Promise<AuthenticationResult | null>;
    loginPopup(request?: PopupRequest): Promise<AuthenticationResult>;
    loginRedirect(request?: RedirectRequest): Promise<void>;
    logout(logoutRequest?: EndSessionRequest): Promise<void>;
    ssoSilent(request: SsoSilentRequest): Promise<AuthenticationResult>;
}

export const stubbedPublicClientApplication: IPublicClientApplication = {
    acquireTokenPopup: () => {
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError);
    },
    acquireTokenRedirect: () => {	
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError);	
    },	
    acquireTokenSilent: () => {	
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError);	
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
    handleRedirectPromise: () => {	
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError);	
    },	
    loginPopup: () => {	
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError);	
    },	
    loginRedirect: () => {	
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError);	
    },	
    logout: () => {	
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError);	
    },	
    ssoSilent: () => {	
        return Promise.reject(BrowserConfigurationAuthError.createStubPcaInstanceCalledError);	
    }
};

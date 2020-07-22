import React from 'react';
import { AuthenticationParameters, TokenResponse, TokenRenewParameters, Account,  } from "@azure/msal-browser";

// TODO: Move this to msal-browser
export interface IPublicClientApplication {
    acquireTokenPopup(request: AuthenticationParameters): Promise<TokenResponse>;
    acquireTokenRedirect(request: AuthenticationParameters): void;
    acquireTokenSilent(silentRequest: TokenRenewParameters): Promise<TokenResponse>;
    getAccount(): Account | null;
    handleRedirectPromise(): Promise<TokenResponse | null>;
    loginPopup(request: AuthenticationParameters): Promise<TokenResponse>;
    loginRedirect(request: AuthenticationParameters): void;
    logout(): void;
    ssoSilent(request: AuthenticationParameters): Promise<TokenResponse>;
}

export interface IMsalProviderContext extends IPublicClientApplication {
    account: Account | null
};

const noProviderError = () => {
    if (process.env.NODE_ENV === 'development') {
        console.error('An MSAL React method was called before any instance of <MsalProvider> was rendered as a parent in the component tree.');
    }
}

const defaultMsalContext: IMsalProviderContext = {
    // Msal methods
    acquireTokenPopup: (request: AuthenticationParameters) => {
        noProviderError();
        return Promise.reject();
    },
    acquireTokenRedirect: (request: AuthenticationParameters) => {
        noProviderError();
    },
    acquireTokenSilent: (silentRequest: TokenRenewParameters) => {
        noProviderError();
        return Promise.reject();
    },
    getAccount: () => {
        noProviderError();
        return null;
    },
    handleRedirectPromise: () => {
        noProviderError();
        return Promise.reject(null);
    },
    loginPopup: (request: AuthenticationParameters) => {
        noProviderError();
        return Promise.reject();
    },
    loginRedirect: (request: AuthenticationParameters) => {
        noProviderError();
    },
    logout: () => {
        noProviderError();
    },
    ssoSilent: (request: AuthenticationParameters) => {
        noProviderError();
        return Promise.reject();
    },

    // State values
    account: null
}

export const MsalContext = React.createContext<IMsalProviderContext>(defaultMsalContext);
export const MsalConsumer = MsalContext.Consumer;
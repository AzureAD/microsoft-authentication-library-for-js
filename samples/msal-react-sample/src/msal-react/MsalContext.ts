import React from 'react';
import { AccountInfo, IPublicClientApplication, RedirectRequest, EndSessionRequest, AuthorizationUrlRequest, SilentRequest } from "@azure/msal-browser";

export interface IMsalProps extends IPublicClientApplication {
    accounts: AccountInfo[],
    isAuthenticated: boolean
};

const noProviderError = () => {
    if (process.env.NODE_ENV === 'development') {
        console.error('An MSAL React method was called before any instance of <MsalProvider> was rendered as a parent in the component tree.');
    }
}

const defaultMsalContext: IMsalProps = {
    // Msal methods
    acquireTokenPopup: (request: AuthorizationUrlRequest) => {
        noProviderError();
        return Promise.reject();
    },
    acquireTokenRedirect: (request: RedirectRequest) => {
        noProviderError();
        return Promise.reject();
    },
    acquireTokenSilent: (silentRequest: SilentRequest) => {
        noProviderError();
        return Promise.reject();
    },
    getAllAccounts: () => {
        noProviderError();
        return [];
    },
    getAccountByUsername: (userName: string) => {
        noProviderError();
        // TODO: getAccountByUsername should have a return type of `AccountInfo | null`
        // Also should prevent possible null reference exception if no account matches the username
        // https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/src/app/PublicClientApplication.ts#L466
        return null as unknown as AccountInfo;
    },
    handleRedirectPromise: () => {
        noProviderError();
        return Promise.reject(null);
    },
    loginPopup: (request: AuthorizationUrlRequest) => {
        noProviderError();
        return Promise.reject();
    },
    loginRedirect: (request: RedirectRequest) => {
        noProviderError();
        return Promise.reject();
    },
    logout: (logoutRequest?: EndSessionRequest | undefined) => {
        noProviderError();
        return Promise.reject();
    },
    ssoSilent: (request: AuthorizationUrlRequest) => {
        noProviderError();
        return Promise.reject();
    },

    // State values
    accounts: [],
    isAuthenticated: false
}

export const MsalContext = React.createContext<IMsalProps>(defaultMsalContext);
export const MsalConsumer = MsalContext.Consumer;
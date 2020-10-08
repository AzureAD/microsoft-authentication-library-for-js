import * as React from "react";
import { IPublicClientApplication, AccountInfo } from "@azure/msal-browser";

type MsalState = {
    accounts: AccountInfo[];
};

export interface IMsalContext {
    instance: IPublicClientApplication;
    state: MsalState;
}

// Stubbed context implementation
const defaultMsalContext: IMsalContext = {
    instance: {
        // Msal methods
        acquireTokenPopup: () => {
            return Promise.reject();
        },
        acquireTokenRedirect: () => {
            return Promise.reject();
        },
        acquireTokenSilent: () => {
            return Promise.reject();
        },
        getAllAccounts: () => {
            debugger;
            return [];
        },
        getAccountByUsername: () => {
            /*
             * TODO: getAccountByUsername should have a return type of `AccountInfo | null`
             * Also should prevent possible null reference exception if no account matches the username
             * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/src/app/PublicClientApplication.ts#L466
             */
            return (null as unknown) as AccountInfo;
        },
        getAccountByHomeId: () => {
            return null;
        },
        handleRedirectPromise: () => {
            return Promise.reject(null);
        },
        loginPopup: () => {
            return Promise.reject();
        },
        loginRedirect: () => {
            return Promise.reject();
        },
        logout: () => {
            return Promise.reject();
        },
        ssoSilent: () => {
            return Promise.reject();
        },
        addEventCallback: () => {
            return;
        }
    },
    state: {
        accounts: [],
    },
};

export const MsalContext = React.createContext<IMsalContext>(
    defaultMsalContext
);
export const MsalConsumer = MsalContext.Consumer;

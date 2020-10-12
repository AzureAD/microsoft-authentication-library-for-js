import * as React from "react";
import { IPublicClientApplication, stubbedPublicClientApplication, AccountInfo, AuthError } from "@azure/msal-browser";

type MsalState = {
    loginInProgress: boolean;
    accounts: AccountInfo[];
    error: Error|AuthError|null;
};

export interface IMsalContext {
    instance: IPublicClientApplication;
    state: MsalState;
}

/*
 * Stubbed context implementation
 * Only used when there is no provider, which is an unsupported scenario
 */
const defaultMsalContext: IMsalContext = {
    instance: stubbedPublicClientApplication,
    state: {
        loginInProgress: false,
        accounts: [],
        error: null
    },
};

export const MsalContext = React.createContext<IMsalContext>(
    defaultMsalContext
);
export const MsalConsumer = MsalContext.Consumer;

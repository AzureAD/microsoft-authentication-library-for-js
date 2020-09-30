import * as React from "react";
import { PublicClientApplication, IPublicClientApplication, AccountInfo } from "@azure/msal-browser";

type MsalState = {
    accounts: AccountInfo[];
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
    instance: new PublicClientApplication({}),
    state: {
        accounts: [],
    },
};

export const MsalContext = React.createContext<IMsalContext>(
    defaultMsalContext
);
export const MsalConsumer = MsalContext.Consumer;

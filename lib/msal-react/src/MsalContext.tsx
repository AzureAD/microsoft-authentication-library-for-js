/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as React from "react";
import { IPublicClientApplication, stubbedPublicClientApplication, AccountInfo } from "@azure/msal-browser";

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
    instance: stubbedPublicClientApplication,
    state: {
        accounts: [],
    },
};

export const MsalContext = React.createContext<IMsalContext>(
    defaultMsalContext
);
export const MsalConsumer = MsalContext.Consumer;

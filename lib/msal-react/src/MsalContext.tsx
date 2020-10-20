/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as React from "react";
import { IPublicClientApplication, stubbedPublicClientApplication, AccountInfo } from "@azure/msal-browser";

export interface IMsalContext {
    instance: IPublicClientApplication;
    loginInProgress: boolean;
    accounts: AccountInfo[];
}

/*
 * Stubbed context implementation
 * Only used when there is no provider, which is an unsupported scenario
 */
const defaultMsalContext: IMsalContext = {
    instance: stubbedPublicClientApplication,
    loginInProgress: false,
    accounts: [],
};

export const MsalContext = React.createContext<IMsalContext>(
    defaultMsalContext
);
export const MsalConsumer = MsalContext.Consumer;

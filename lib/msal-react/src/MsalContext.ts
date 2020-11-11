/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as React from "react";
import { IPublicClientApplication, stubbedPublicClientApplication, AccountInfo } from "@azure/msal-browser";
import { InteractionStatus } from "./utils/Constants";

export interface IMsalContext {
    instance: IPublicClientApplication;
    inProgress: InteractionStatus;
    accounts: AccountInfo[];
}

/*
 * Stubbed context implementation
 * Only used when there is no provider, which is an unsupported scenario
 */
const defaultMsalContext: IMsalContext = {
    instance: stubbedPublicClientApplication,
    inProgress: InteractionStatus.None,
    accounts: [],
};

export const MsalContext = React.createContext<IMsalContext>(
    defaultMsalContext
);
export const MsalConsumer = MsalContext.Consumer;

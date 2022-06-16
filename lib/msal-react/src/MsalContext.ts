/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as React from "react";
import { IPublicClientApplication, stubbedPublicClientApplication, Logger, InteractionStatus, AccountInfo } from "@azure/msal-browser";

export interface IMsalContext {
    instance: IPublicClientApplication;
    inProgress: InteractionStatus;
    accounts: AccountInfo[];
    logger: Logger;
}

/*
 * Stubbed context implementation
 * Only used when there is no provider, which is an unsupported scenario
 */
const defaultMsalContext: IMsalContext = {
    instance: stubbedPublicClientApplication,
    inProgress: InteractionStatus.None,
    accounts: [],
    logger: new Logger({})
};

export const MsalContext = React.createContext<IMsalContext>(
    defaultMsalContext
);
export const MsalConsumer = MsalContext.Consumer;

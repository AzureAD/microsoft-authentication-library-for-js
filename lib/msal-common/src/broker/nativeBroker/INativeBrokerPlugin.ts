/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "../../account/AccountInfo";
import { NativeRequest } from "../../request/NativeRequest";
import { NativeSignOutRequest } from "../../request/NativeSignOutRequest";
import { AuthenticationResult } from "../../response/AuthenticationResult";

export interface INativeBrokerPlugin {
    getAccountById(accountId: string, correlationId: string): Promise<AccountInfo>;
    acquireTokenSilent(request: NativeRequest): Promise<AuthenticationResult>;
    acquireTokenInteractive(request: NativeRequest): Promise<AuthenticationResult>;
    signOut(request: NativeSignOutRequest): Promise<void>;
}

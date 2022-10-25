/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "../../account/AccountInfo";
import { NativeRequest } from "../../request/NativeRequest";
import { AuthenticationResult } from "../../response/AuthenticationResult";

export interface INativeBrokerPlugin {
    getAccountById(accountId: string): Promise<AccountInfo>;
    acquireTokenSilent(request: NativeRequest): Promise<AuthenticationResult>;
    acquireTokenInteractive(request: NativeRequest): Promise<AuthenticationResult>;
    acquireTokenByUsernamePassword(request: NativeRequest): Promise<AuthenticationResult>;
}

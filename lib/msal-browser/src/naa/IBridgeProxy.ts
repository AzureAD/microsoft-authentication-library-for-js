/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "./AccountInfo";
import {
    AccountByHomeIdRequest,
    AccountByLocalIdRequest,
    AccountByUsernameRequest,
} from "./AccountRequests";
import { TokenRequest } from "./TokenRequest";
import { TokenResponse } from "./TokenResponse";

export interface IBridgeProxy {
    getTokenInteractive(request: TokenRequest): Promise<TokenResponse>;
    getTokenSilent(request: TokenRequest): Promise<TokenResponse>;
    getAccountInfo(
        request:
            | AccountByHomeIdRequest
            | AccountByLocalIdRequest
            | AccountByUsernameRequest
    ): Promise<AccountInfo>;
    getActiveAccount(): Promise<AccountInfo>;
}

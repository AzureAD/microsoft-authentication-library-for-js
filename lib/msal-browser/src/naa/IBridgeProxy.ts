/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "./AccountInfo";
import { AuthResult } from "./AuthResult";
import { BridgeCapabilities } from "./BridgeCapabilities";
import { TokenRequest } from "./TokenRequest";

export interface IBridgeProxy {
    getTokenInteractive(request: TokenRequest): Promise<AuthResult>;
    getTokenSilent(request: TokenRequest): Promise<AuthResult>;
    getActiveAccount(): Promise<AccountInfo>;
    getHostCapabilities(): BridgeCapabilities | null;
}

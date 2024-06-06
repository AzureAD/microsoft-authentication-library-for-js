/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BridgeError } from "./BridgeError";
import { TokenResponse } from "./TokenResponse";
import { AccountInfo } from "./AccountInfo";
import { InitContext } from "./InitContext";

export type BridgeResponseEnvelope = {
    messageType: "NestedAppAuthResponse";
    requestId: string;
    success: boolean; // false if body is error
    token?: TokenResponse;
    error?: BridgeError;
    account?: AccountInfo;
    initContext?: InitContext;
};

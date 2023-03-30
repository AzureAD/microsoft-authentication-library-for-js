/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TokenRequest } from "./TokenRequest";
import {
    AccountByHomeIdRequest,
    AccountByLocalIdRequest,
    AccountByUsernameRequest,
} from "./AccountRequests";

export type BridgeMethods =
    | "GetToken"
    | "GetActiveAccount"
    | "GetAllAccounts"
    | "GetAccountByHomeId"
    | "GetAccountByLocalId"
    | "GetAccountByUsername"
    | "GetInitContext";

export type BridgeRequestEnvelope = {
    messageType: "NestedAppAuthRequest";
    method: BridgeMethods;
    sendTime?: number; // Assume this is epoch
    clientLibrary?: string;
    clientLibraryVersion?: string;
    requestId: string;
    apiKey?: string;
    body?:
    | TokenRequest
    | AccountByHomeIdRequest
    | AccountByLocalIdRequest
    | AccountByUsernameRequest;
};

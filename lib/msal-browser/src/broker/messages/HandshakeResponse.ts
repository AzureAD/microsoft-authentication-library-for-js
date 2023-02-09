/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "./TokenResponse";

export type HandshakeResponse = {
    /**
     * Version of selected protocol between broker client (MSAL.js, this module) and the broker server (broker app)
     * The server should look at the versions supported by client and ones it support
     * Based on that server should select the highest supported version
     */
    selectedProtocolVersion: string,

    /**
     * Alias of broker server
     * This is alias of broker as recognized by STS
     * For example, it could be "multihub". In that case the broker client app must register a SPA type uri "brk-multihub://<Origin of broker client app>"
     * Broker client should use this value to determine if running inside such broker server is supported by app
     */
    brokerAlias: string,

    /**
     * Active account to be used by broker client
     */
    account: AccountInfo
};

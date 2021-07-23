/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerAuthorizationROPCResponse } from "@azure/msal-common";
import { SilentRequest } from "../request/SilentRequest";
import { LoadTokenOptions } from "./TokenCache";

export interface ITokenCache {

    /** API to side-load tokens to MSAL cache */
    loadTokens(request: SilentRequest, response: ServerAuthorizationROPCResponse, options: LoadTokenOptions): void;
}

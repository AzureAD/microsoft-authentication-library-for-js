/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SilentRequest } from "../request/SilentRequest";
import { LoadTokenOptions, ServerResponseROPC } from "./TokenCache";

export interface ITokenCache {

    /** API to side-load tokens to MSAL cache */
    loadTokens(request: SilentRequest, response: ServerResponseROPC, options: LoadTokenOptions): void;
}

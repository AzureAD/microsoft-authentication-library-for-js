/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ExternalTokenResponse, AuthenticationResult } from "@azure/msal-common";
import { SilentRequest } from "../request/SilentRequest";
import { LoadTokenOptions } from "./TokenCache";

export interface ITokenCache {

    /**
     * API to side-load tokens to MSAL cache
     * @returns `AuthenticationResult` for the response that was loaded.
     */
    loadExternalTokens(request: SilentRequest, response: ExternalTokenResponse, options: LoadTokenOptions): AuthenticationResult;

}

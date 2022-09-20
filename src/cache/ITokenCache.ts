/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ExternalTokenResponse } from "@azure/msal-common";
import { SilentRequest } from "../request/SilentRequest";
import { LoadTokenOptions } from "./TokenCache";

export interface ITokenCache {

    /**
     * API to side-load tokens to MSAL cache
     * @returns The homeAccountId of the account associated with the response.
     */
    loadExternalTokens(request: SilentRequest, response: ExternalTokenResponse, options: LoadTokenOptions): string;

}

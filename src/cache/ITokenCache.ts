/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ExternalTokenResponse, CacheRecord } from "@azure/msal-common";
import { SilentRequest } from "../request/SilentRequest";
import { LoadTokenOptions } from "./TokenCache";

export interface ITokenCache {

    /**
     * API to side-load tokens to MSAL cache
     * @returns A `CacheRecord` containing the entities that were loaded.
     */
    loadExternalTokens(request: SilentRequest, response: ExternalTokenResponse, options: LoadTokenOptions): CacheRecord;

}

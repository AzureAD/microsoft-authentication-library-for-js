/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult } from "./AuthenticationResult";
import { CacheRecord } from "../cache/entities/CacheRecord";

export type BrokerAuthenticationResult = AuthenticationResult & {
    tokensToCache: CacheRecord;
};

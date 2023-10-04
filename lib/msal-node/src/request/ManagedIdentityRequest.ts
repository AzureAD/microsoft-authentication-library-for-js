/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseAuthRequest } from "@azure/msal-common/request/BaseAuthRequest";

/**
 * ManagedIdentityRequest
 * - forceRefresh - forces managed identity requests to skip the cache and make network calls if true
 * - resourceUri  - the URI of the managed identity
 */
export type ManagedIdentityRequest = BaseAuthRequest & {
    forceRefresh?: boolean;
    resourceUri: string;
};

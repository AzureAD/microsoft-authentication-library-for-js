/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * ManagedIdentityRequest
 * - claims       - a stringified claims request which will be used to determine whether or not the cache should be skipped
 * - forceRefresh - forces managed identity requests to skip the cache and make network calls if true
 * - resource     - resource requested to access the protected API. It should be of the form "{ResourceIdUri}" or {ResourceIdUri/.default}. For instance https://management.azure.net or, for Microsoft Graph, https://graph.microsoft.com/.default
 */
export type ManagedIdentityRequestParams = {
    claims?: string;
    forceRefresh?: boolean;
    resource: string;
};

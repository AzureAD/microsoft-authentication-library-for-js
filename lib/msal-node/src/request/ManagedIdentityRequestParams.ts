/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * ManagedIdentityRequest
 * @public
 */
export type ManagedIdentityRequestParams = {
    /**
     * A stringified claims request which will be used to determine whether or not the cache should be skipped
     */
    claims?: string;
    /**
     * Client-originated claims to forward to the managed identity endpoint, sent as the `claims` query parameter.
     * Unlike `claims` (a server-issued challenge, which bypasses the token cache), client claims are cached and the
     * cache entry is keyed on the claims value: identical values are served from cache, while different values produce
     * separate cache entries. Only supported for the IMDS source.
     */
    clientClaims?: string;
    /**
     * Forces managed identity requests to skip the cache and make network calls if true
     */
    forceRefresh?: boolean;
    /**
     * Resource requested to access the protected API. It should be of the form "ResourceIdUri" or "ResourceIdUri/.default". For instance https://management.azure.net or, for Microsoft Graph, https://graph.microsoft.com/.default
     */
    resource: string;
};

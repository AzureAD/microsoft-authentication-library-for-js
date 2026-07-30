/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseAuthRequest } from "@azure/msal-common/node";

/**
 * CommonOnBehalfOfRequest
 */
export type CommonOnBehalfOfRequest = Omit<
    BaseAuthRequest,
    "extraQueryParameters" | "extraParameters"
> & {
    /**
     * The access token that was sent to the middle-tier API. This token must have an audience of the app making this OBO request.
     */
    oboAssertion: string;
    /**
     * Skip token cache lookup and force request to authority to get a a new token. Defaults to false.
     */
    skipCache?: boolean;
    /**
     * Client-originated claims to forward to the token endpoint, sent as the `claims` parameter on the wire.
     * Unlike `claims` (a server-issued challenge, which bypasses the token cache), client claims are cached and
     * the cache entry is keyed on the claims value. Must use stable, non-dynamic values to avoid unbounded cache growth.
     * See the MSAL Node token caching guide (`docs/caching.md`) for cache serialization and eviction strategies.
     */
    claimsFromClient?: string;
};

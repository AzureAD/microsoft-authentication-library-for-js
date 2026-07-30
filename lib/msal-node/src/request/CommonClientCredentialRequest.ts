/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    BaseAuthRequest,
    AzureRegion,
    ClientAssertion,
} from "@azure/msal-common/node";

/**
 * CommonClientCredentialRequest
 */
export type CommonClientCredentialRequest = Omit<
    BaseAuthRequest,
    "extraQueryParameters" | "extraParameters"
> & {
    /**
     * Skip token cache lookup and force request to authority to get a a new token. Defaults to false.
     */
    skipCache?: boolean;
    /**
     * Azure region to be used for regional authentication.
     */
    azureRegion?: AzureRegion;
    /**
     * An assertion string or a callback function that returns an assertion string (both are Base64Url-encoded signed JWTs) used in the Client Credential flow.
     */
    clientAssertion?: ClientAssertion;
    /**
     * FMI path to scope the client credentials token to a specific agent identity. Sent as `fmi_path` in the POST body.
     */
    fmiPath?: string;
    /**
     * Client-originated claims to forward to the token endpoint, sent as the `claims` parameter on the wire.
     * Unlike `claims` (a server-issued challenge, which bypasses the token cache), client claims are cached and
     * the cache entry is keyed on the claims value. Must use stable, non-dynamic values to avoid unbounded cache growth.
     * See the MSAL Node token caching guide (`docs/caching.md`) for cache serialization and eviction strategies.
     */
    claimsFromClient?: string;
};

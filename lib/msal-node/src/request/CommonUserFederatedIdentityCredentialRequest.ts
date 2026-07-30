/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseAuthRequest, ClientAssertion } from "@azure/msal-common/node";

/**
 * Internal request type for the user_fic grant.
 * Used by UserFederatedIdentityCredentialClient after base request initialization.
 * @internal
 */
export type CommonUserFederatedIdentityCredentialRequest = Omit<
    BaseAuthRequest,
    "extraQueryParameters" | "extraParameters"
> & {
    /** The federated identity credential (instance token from Leg 2) */
    assertion: string;
    /** An optional per-request client assertion override */
    clientAssertion?: ClientAssertion;
    /** Target user's Object ID — exactly one of userObjectId or username must be provided */
    userObjectId?: string;
    /** Target user's UPN — exactly one of userObjectId or username must be provided */
    username?: string;
    /**
     * Client-originated claims to forward to the token endpoint, sent as the `claims` parameter on the wire.
     * Unlike `claims` (a server-issued challenge), these are client-originated. The user_fic grant always calls
     * the network, so `claimsFromClient` is forwarded on every request and does not participate in this flow's cache
     * key (tokens are still written to the cache, but not partitioned by `claimsFromClient`).
     */
    claimsFromClient?: string;
};

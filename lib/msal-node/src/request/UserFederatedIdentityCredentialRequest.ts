/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientAssertionCallback } from "@azure/msal-common/node";
import { CommonUserFederatedIdentityCredentialRequest } from "./CommonUserFederatedIdentityCredentialRequest.js";

/**
 * Request object for acquireTokenByUserFederatedIdentityCredential.
 * Exactly one of userObjectId or username must be provided.
 * @public
 */
export type UserFederatedIdentityCredentialRequest = Partial<
    Omit<
        CommonUserFederatedIdentityCredentialRequest,
        | "scopes"
        | "assertion"
        | "resourceRequestMethod"
        | "resourceRequestUri"
        | "clientAssertion"
    >
> & {
    /** Array of scopes the application is requesting access to */
    scopes: Array<string>;
    /** The federated identity credential (instance token from Leg 2) */
    assertion: string;
    /** An optional per-request client assertion override */
    clientAssertion?: string | ClientAssertionCallback;
} & (
        | {
              /** Target user's Object ID */
              userObjectId: string;
              username?: never;
          }
        | {
              /** Target user's UPN */
              username: string;
              userObjectId?: never;
          }
    );

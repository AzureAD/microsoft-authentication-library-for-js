/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseAuthRequest, ClientAssertion } from "@azure/msal-common/node";

/**
 * Request object for acquireTokenByUserFederatedIdentityCredential.
 * Exactly one of userObjectId or username must be provided.
 * @public
 */
export type UserFederatedIdentityCredentialRequest = Omit<
    BaseAuthRequest,
    "extraQueryParameters" | "extraParameters"
> & {
    /** The federated identity credential (instance token from Leg 2) */
    assertion: string;
    /** An optional per-request client assertion override */
    clientAssertion?: ClientAssertion;
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

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientAssertionCallback } from "@azure/msal-common/node";
import { CommonUserFederatedIdentityCredentialRequest } from "./CommonUserFederatedIdentityCredentialRequest.js";

/**
 * Request object for acquireTokenByUserFederatedIdentityCredential.
 *
 * Required fields: `scopes`, `assertion`, and exactly one of
 * `userObjectId` or `username`. Other base-request fields
 * (`authority`, `correlationId`, etc.) are filled in by the library.
 *
 * @example
 * ```typescript
 * const request: UserFederatedIdentityCredentialRequest = {
 *     scopes: ["https://graph.microsoft.com/.default"],
 *     assertion: instanceTokenFromLeg2,
 *     username: "user@contoso.com",
 * };
 * ```
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
    /** Target user's Object ID — exactly one of userObjectId or username must be provided */
    userObjectId?: string;
    /** Target user's UPN — exactly one of userObjectId or username must be provided */
    username?: string;
    /** An optional per-request client assertion override */
    clientAssertion?: string | ClientAssertionCallback;
};

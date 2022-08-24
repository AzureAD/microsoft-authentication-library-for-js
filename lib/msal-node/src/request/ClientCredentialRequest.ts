/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CommonClientCredentialRequest } from "@azure/msal-common";

/**
 * CommonClientCredentialRequest
 * - scopes                  - Array of scopes the application is requesting access to.
 * - authority               - URL of the authority, the security token service (STS) from which MSAL will acquire tokens.
 * - correlationId           - Unique GUID set per request to trace a request end-to-end for telemetry purposes.
 * - skipCache               - Skip token cache lookup and force request to authority to get a a new token. Defaults to false.
 * - clientAssertion         - A Base64Url-encoded signed JWT assertion string used in the Client Credential flow
 * @public
 */
export type ClientCredentialRequest = Partial<Omit<CommonClientCredentialRequest, "scopes"|"resourceRequestMethod"|"resourceRequestUri"|"requestedClaimsHash"|"clientAssertion">> & {
    scopes: Array<string>;
    clientAssertion?: string;
};

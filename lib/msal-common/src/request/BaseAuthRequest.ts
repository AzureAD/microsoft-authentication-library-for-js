/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationScheme } from "../utils/Constants";
import { AzureCloudOptions } from "../config/ClientConfiguration";

/**
 * BaseAuthRequest
 * - authority               - URL of the authority, the security token service (STS) from which MSAL will acquire tokens. Defaults to https://login.microsoftonline.com/common. If using the same authority for all request, authority should set on client application object and not request, to avoid resolving authority endpoints multiple times.
 * - correlationId           - Unique GUID set per request to trace a request end-to-end for telemetry purposes.
 * - scopes                  - Array of scopes the application is requesting access to.
 * - authenticationScheme    - The type of token retrieved. Defaults to "Bearer". Can also be type "pop" or "SSH".
 * - claims                  - A stringified claims request which will be added to all /authorize and /token calls
 * - shrClaims               - A stringified claims object which will be added to a Signed HTTP Request
 * - shrNonce                - A server-generated timestamp that has been encrypted and base64URL encoded, which will be added to a Signed HTTP Request.
 * - resourceRequestMethod   - HTTP Request type used to request data from the resource (i.e. "GET", "POST", etc.).  Used for proof-of-possession flows.
 * - resourceRequestUri      - URI that token will be used for. Used for proof-of-possession flows.
 * - sshJwk                  - A stringified JSON Web Key representing a public key that can be signed by an SSH certificate.
 * - sshKid                  - Key ID that uniquely identifies the SSH public key mentioned above.
 * - azureCloudOptions       - Convenience string enums for users to provide public/sovereign cloud ids
 * - requestedClaimsHash     - SHA 256 hash string of the requested claims string, used as part of an access token cache key so tokens can be filtered by requested claims
 */
export type BaseAuthRequest = {
    authority: string;
    correlationId: string;
    scopes: Array<string>;
    authenticationScheme?: AuthenticationScheme;
    claims?: string;
    shrClaims?: string;
    shrNonce?: string;
    resourceRequestMethod?: string;
    resourceRequestUri?: string;
    sshJwk?: string;
    sshKid?: string;
    azureCloudOptions?: AzureCloudOptions;
    requestedClaimsHash?: string;
    maxAge?: number;
};

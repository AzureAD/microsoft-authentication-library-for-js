/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseAuthRequest } from "./BaseAuthRequest";

/**
 * Request object passed by user to acquire a token from the server exchanging a valid authorization code (second leg of OAuth2.0 Authorization Code flow)
 *
 * - scopes                  - A space-separated array of scopes for the same resource.
 * - authority:              - URL of the authority, the security token service (STS) from which MSAL will acquire tokens. If authority is set on client application object, this will override that value. Overriding the value will cause for authority validation to happen each time. If the same authority will be used for all request, set on the application object instead of the requests.
 * - redirectUri             - The redirect URI of your app, where the authority will redirect to after the user inputs credentials and consents. It must exactly match one of the redirect URIs you registered in the portal.
 * - code                    - The authorization_code that the user acquired in the first leg of the flow.
 * - codeVerifier            - The same code_verifier that was used to obtain the authorization_code. Required if PKCE was used in the authorization code grant request.For more information, see the PKCE RFC: https://tools.ietf.org/html/rfc7636
 * - correlationId           - Unique GUID set per request to trace a request end-to-end for telemetry purposes
 */
export type AuthorizationCodeRequest = BaseAuthRequest & {
    redirectUri: string;
    code: string;
    codeVerifier?: string;
    correlationId?: string;
};

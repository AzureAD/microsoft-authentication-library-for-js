/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseAuthRequest } from "./BaseAuthRequest";

/**
 * @type RefreshTokenRequest
 *
 * scopes:                  A space-separated array of scopes for the same resource.
 * authority:               URL of the authority, the security token service (STS) from which MSAL will acquire tokens.
 * refreshToken:            A refresh token returned from a previous request to the Identity provider.
 * redirectUri:             The redirect URI where authentication responses can be received by your application. It must exactly match one of the redirect URIs registered in the Azure portal.
 */
export type RefreshTokenRequest = BaseAuthRequest & {
    refreshToken: string;
};

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CommonAuthorizationCodeRequest } from "@azure/msal-common/browser";

/**
 * AuthorizationCodeRequest: Request object passed by browser clients to exchange an authorization code for tokens.
 *
 * - code                      - The authorization_code that the user acquired in the first leg of the flow.
 * - nativeAccountId           - Identifier for the native account when integrating with native or brokered experiences.
 * - cloudGraphHostName        - Hostname for the Microsoft Cloud instance's Graph endpoint (for example, graph.microsoft.com).
 * - msGraphHost               - Hostname for the Microsoft Graph endpoint when overriding defaults.
 * - cloudInstanceHostName     - Hostname for the Azure AD cloud instance that issued the authorization code.
 *
 * All other properties are inherited from CommonAuthorizationCodeRequest.
 */
export type AuthorizationCodeRequest = Partial<
    Omit<CommonAuthorizationCodeRequest, "code" | "enableSpaAuthorizationCode">
> & {
    code?: string;
    nativeAccountId?: string;
    cloudGraphHostName?: string;
    msGraphHost?: string;
    cloudInstanceHostName?: string;
};

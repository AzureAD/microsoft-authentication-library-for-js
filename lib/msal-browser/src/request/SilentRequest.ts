/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo, SilentFlowRequest, StringDict } from "@azure/msal-common";

/**
 * SilentRequest: Request object passed by user to retrieve tokens from the
 * cache, renew an expired token with a refresh token, or retrieve a code (first leg of authorization code grant flow) 
 * in a hidden iframe.
 * 
 * - scopes                 - Array of scopes the application is requesting access to.
 * - authority              - Url of the authority which the application acquires tokens from.
 * - correlationId          - Unique GUID set per request to trace a request end-to-end for telemetry purposes.
 * - account                - Account entity to lookup the credentials.
 * - forceRefresh           - Forces silent requests to make network calls if true.
 * - extraQueryParameters   - String to string map of custom query parameters. Only used when renewing the refresh token.
 * - redirectUri            - The redirect URI where authentication responses can be received by your application. It must exactly match one of the redirect URIs registered in the Azure portal. Only used for cases where refresh token is expired.
 */
export type SilentRequest = Omit<SilentFlowRequest, "authority"|"correlationId"|"forceRefresh"|"account"> & {
    redirectUri?: string;
    extraQueryParameters?: StringDict;
    authority?: string;
    account?: AccountInfo;
    correlationId?: string;
    forceRefresh?: boolean;
};

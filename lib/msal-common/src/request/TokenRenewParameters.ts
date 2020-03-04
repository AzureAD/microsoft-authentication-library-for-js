/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ClientRequestParameters } from "./ClientRequestParameters";
import { Account } from "../account/Account";

/**
 * AuthenticationParameters passed by user to retrieve a token from the server.
 * - scopes: requested token scopes
 * - resource: requested resource uri
 * - extraQueryParameters: string to string map of custom query parameters
 * - authority: authority to request tokens from
 * - correlationId: custom correlationId given by user
 * - account: Account object to perform SSO
 * - forceRefresh: Forces silent requests to make network calls if true
 */
export type TokenRenewParameters = ClientRequestParameters & {
    account?: Account;
    forceRefresh?: boolean;
};

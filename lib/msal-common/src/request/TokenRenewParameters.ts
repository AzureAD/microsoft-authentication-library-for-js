/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Account } from "../account/Account";
import { StringDict } from "../utils/MsalTypes";

/**
 * AuthenticationParameters passed by user to retrieve a token from the server.
 * - scopes: requested token scopes
 * - extraQueryParameters: string to string map of custom query parameters
 * - authority: authority to request tokens from
 * - correlationId: correlationId set by the user to trace the request
 * - account: Account object to perform SSO
 * - sid: session id for SSO
 * - loginHint: login hint for SSO
 * - forceRefresh: Forces silent requests to make network calls if true
 */
export type TokenRenewParameters = {
    scopes?: Array<string>;
    extraQueryParameters?: StringDict;
    authority?: string;
    correlationId?: string;
    account?: Account;
    loginHint?: string;
    forceRefresh?: boolean;
};

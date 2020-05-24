/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ClientRequestParameters } from "./ClientRequestParameters";
import { Account } from "../account/Account";

/**
 * AuthenticationParameters passed by user to retrieve a token from the server.
 * - scopes: requested token scopes
 * - extraScopesToConsent: additional scopes to consent
 * - prompt: the value of the OAuth prompt parameter
 * - extraQueryParameters: string to string map of custom query parameters
 * - claimsRequest: stringified claims object to request additional claims in a token
 * - authority: authority to request tokens from
 * - userRequestState: state parameter to ensure request/response integrity
 * - correlationId: custom correlationId given by user
 * - account: Account object to perform SSO
 * - loginHint: login hint for SSO
 */
export type AuthenticationParameters = ClientRequestParameters & {
    extraScopesToConsent?: Array<string>;
    prompt?: string;
    userRequestState?: string;
    account?: Account;
    sid?: string;
    loginHint?: string;
};

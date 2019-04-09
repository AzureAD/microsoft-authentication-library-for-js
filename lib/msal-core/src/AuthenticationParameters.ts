// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Account } from "./Account";

/**
 * Key-Value type to support queryParams and extraQueryParams
 */
export type QPDict = {[key: string]: string};


export type AuthenticationParameters = {
    scopes?: Array<string>;
    extraScopesToConsent?: Array<string>;
    prompt?: string;
    extraQueryParameters?: QPDict;
    claimsRequest?: null;
    authority?: string;
    correlationId?: string;
    account?: Account;
    sid?: string;
    loginHint?: string;
};

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CommonAuthorizationUrlRequest } from "@azure/msal-common/browser";

/**
 * Request object passed by user to ssoSilent to retrieve a Code from the server (first leg of authorization code grant flow)
 */
export type SsoSilentRequest = Partial<
    Omit<
        CommonAuthorizationUrlRequest,
        | "responseMode"
        | "earJwk"
        | "codeChallenge"
        | "codeChallengeMethod"
        | "platformBroker"
    >
> & {
    /**
     * Optional tenant ID (GUID) used to filter cached accounts in multi-tenant scenarios.
     * When provided, account lookup will also match on tenantId, preventing incorrect account matches
     * when the same user has accounts across multiple tenants with the same loginHint.
     */
    tenantId?: string;
};

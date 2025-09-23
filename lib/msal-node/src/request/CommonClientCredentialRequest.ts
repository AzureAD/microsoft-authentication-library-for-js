/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    BaseAuthRequest,
    AzureRegion,
    ClientAssertion,
} from "@azure/msal-common";

/**
 * CommonClientCredentialRequest
 * - scopes                             - Array of scopes the application is requesting access to.
 * - authority                          - URL of the authority, the security token service (STS) from which MSAL will acquire tokens.
 * - correlationId                      - Unique GUID set per request to trace a request end-to-end for telemetry purposes.
 * - skipCache                          - Skip token cache lookup and force request to authority to get a a new token. Defaults to false.
 * - preferredAzureRegionOptions        - Options of the user's preferred azure region
 * - extraQueryParameters               - String to string map of custom query parameters added to outgoing token service requests
 * - extraParams                        - String to string map of custom query parameters added to outgoing token service requests
 */
export type CommonClientCredentialRequest = BaseAuthRequest & {
    skipCache?: boolean;
    azureRegion?: AzureRegion;
    clientAssertion?: ClientAssertion;
};

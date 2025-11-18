/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    BaseAuthRequest,
    AzureRegion,
    ClientAssertion,
} from "@azure/msal-common/node";

/**
 * CommonClientCredentialRequest
 * - scopes                             - Array of scopes the application is requesting access to.
 * - authority                          - URL of the authority, the security token service (STS) from which MSAL will acquire tokens.
 * - correlationId                      - Unique GUID set per request to trace a request end-to-end for telemetry purposes.
 * - skipCache                          - Skip token cache lookup and force request to authority to get a a new token. Defaults to false.
 * - preferredAzureRegionOptions        - Options of the user's preferred azure region
 * - clientAssertion                  - An assertion string or a callback function that returns an assertion string (both are Base64Url-encoded signed JWTs) used in the Client Credential flow
 * - azureRegion                       - Azure region to be used for regional authentication
 */
export type CommonClientCredentialRequest = Omit<
    BaseAuthRequest,
    "extraQueryParameters" | "extraParameters"
> & {
    skipCache?: boolean;
    azureRegion?: AzureRegion;
    clientAssertion?: ClientAssertion;
};

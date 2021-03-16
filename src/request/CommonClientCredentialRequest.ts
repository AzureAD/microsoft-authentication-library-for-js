/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseAuthRequest } from "./BaseAuthRequest";

/*
 * PrefferedAzureRegionOptions
 * - useAzureRegion                     - Detect azure region and modify the authority to a regional authority
 * - regionUsedIfAutoDetectionFails     - Region to use if region auto detection fails
 * - fallbackToGlobal                   - Use the global authority if no region is available for use
 */
export type PrefferedAzureRegionOptions = {
    useAzureRegion: boolean;
    regionUsedIfAutoDetectionFails?: string;
    fallbackToGlobal?: boolean;
};

/**
 * CommonClientCredentialRequest
 * - scopes                             - Array of scopes the application is requesting access to.
 * - authority                          - URL of the authority, the security token service (STS) from which MSAL will acquire tokens.
 * - correlationId                      - Unique GUID set per request to trace a request end-to-end for telemetry purposes.
 * - skipCache                          - Skip token cache lookup and force request to authority to get a a new token. Defaults to false.
 * - prefferedAzureRegionOptions        - Options of the user's preferred azure region
 */
export type CommonClientCredentialRequest = BaseAuthRequest & {
    skipCache?: boolean;
    prefferedAzureRegionOptions?: PrefferedAzureRegionOptions;
};

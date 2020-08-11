

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseAuthRequest } from "./BaseAuthRequest";

/**
 * RefreshTokenRequest
 * - scopes                  - Array of scopes the application is requesting access to.
 * - authority               - URL of the authority, the security token service (STS) from which MSAL will acquire tokens.
 * - correlationId           - Unique GUID set per request to trace a request end-to-end for telemetry purposes.
 * - oboAssertion            - The access token that was sent to the middle-tier API. This token must have an audience of the app making this OBO request. 
 */
export type OnBehalfOfRequest = BaseAuthRequest & {
    oboAssertion: string
};

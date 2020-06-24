/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Tenant Discovery Response which contains the relevant OAuth endpoints and data needed for authentication and authorization.
 */
export interface IOpenIdConfigResponse {
    authorization_endpoint: string;
    token_endpoint: string;
    end_session_endpoint: string;
    issuer: string;
}

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 */
export interface TenantDiscoveryResponse {
    authorization_endpoint: string;
    token_endpoint: string;
    end_session_endpoint: string;
    issuer: string;
}

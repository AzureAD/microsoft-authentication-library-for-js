/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// TODO: Add documentation
export type ShortLivedCredential = {
    client_id: string;
    credential: string;
    expires_in: number;
    identity_type: string;
    refresh_in: number;
    region: string;
    regional_token_url: string;
    tenant_id: string;
};

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * Step 8 (token): flat OAuth token response. A default resource scope is appended
 * server-side even when only `openid offline_access` was requested. Fields are limited to
 * those observed on the wire: the standard OAuth token set plus `client_info` (returned
 * because the token request sends `client_info=true`, and needed to derive the account id).
 * Error fields are intentionally absent here — token errors use `V2OAuthErrorResponse`.
 */
export interface V2TokenResponse {
    token_type: string;
    expires_in: number;
    access_token: string;
    refresh_token?: string;
    scope: string;
    id_token?: string;
    ext_expires_in?: number;
    client_info?: string;
}

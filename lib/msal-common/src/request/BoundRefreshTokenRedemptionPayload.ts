/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type BoundRefreshTokenRedemptionPayload = {
    client_id: string;
    scope: string;
    grant_type: string;
    refresh_token: string;
    iss: string;
    aud: string;
    exp: number;
    client_secret?: string;
    client_assertion?: string;
    client_assertion_type?: string;
    req_cnf?: string;
};

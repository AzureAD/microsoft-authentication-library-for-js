/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerAuthorizationTokenResponse } from "@azure/msal-common/response/ServerAuthorizationTokenResponse";

/**
 * //
 */
export type ServerManagedIdentityTokenResponse =
    ServerAuthorizationTokenResponse & {
        // success
        client_id?: string;
        expires_on?: number;
        resource?: string;

        // error
        message?: string;
        correlationId?: string;
    };

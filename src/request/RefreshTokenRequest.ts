/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseAuthRequest } from "./BaseAuthRequest";

/**
 * RefreshTokenRequest
 *
 * - refreshToken:            A refresh token returned from a previous request to the Identity provider.
 */
export type RefreshTokenRequest = BaseAuthRequest & {
    refreshToken: string;
};

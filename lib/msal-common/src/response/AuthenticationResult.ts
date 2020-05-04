/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Result returned from the authority's token endpoint.
 */
export type AuthenticationResult = {
    // TODO this is temp class, it will be updated.
    accessToken: string;
    refreshToken: string;
    idToken: string;
    expiresOn: string;
};

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type AuthenticationResult = {
    accessToken: string;
    refreshToken: string;
    idToken: string; 
    expiresOn: string; 
};

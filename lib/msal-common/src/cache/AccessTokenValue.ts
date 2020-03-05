/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Value of access token cache item which is stored in cache. Helps manage token renewal.
 */
export class AccessTokenValue {
    // Success cases
    tokenType?: string;
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    expiresOnSec?: string;
    extExpiresOnSec?: string;

    // These fields exist when a thumbprint is being throttled
    error?: string;
    errorDescription?: string;
    errorCodes?: string;         // delimited by " "
    throttleTime?: number;       // in ms

    constructor(tokenType?: string, accessToken?: string, idToken?: string, refreshToken?: string, expiresOn?: string, extExpiresOn?: string, error?: string, errorDescription?: string, errorCodes?: string, throttleTime?: number) {
        this.tokenType = tokenType;
        this.accessToken = accessToken;
        this.idToken = idToken;
        this.refreshToken = refreshToken;
        this.expiresOnSec = expiresOn;
        this.extExpiresOnSec = extExpiresOn;
        this.error = error;
        this.errorDescription = errorDescription;
        this.errorCodes = errorCodes;
        this.throttleTime = throttleTime;
    }
}

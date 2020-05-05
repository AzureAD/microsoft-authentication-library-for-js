/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Value of access token cache item which is stored in cache. Helps manage token renewal.
 */
export class AccessTokenValue {

    tokenType: string;
    accessToken: string;
    idToken: string;
    expiresOnSec: string;
    extExpiresOnSec: string;

    constructor(tokenType: string, accessToken: string, idToken: string, expiresOn: string, extExpiresOn: string) {
        this.tokenType = tokenType;
        this.accessToken = accessToken;
        this.idToken = idToken;
        this.expiresOnSec = expiresOn;
        this.extExpiresOnSec = extExpiresOn;
    }
}

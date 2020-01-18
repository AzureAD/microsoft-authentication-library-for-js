/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 */
export class AccessTokenValue {

    tokenType: string;
    accessToken: string;
    idToken: string;
    refreshToken: string;
    expiresOnSec: string;
    extExpiresOnSec: string;

    constructor(tokenType: string, accessToken: string, idToken: string, refreshToken: string, expiresOn: string, extExpiresOn: string) {
        this.tokenType = tokenType;
        this.accessToken = accessToken;
        this.idToken = idToken;
        this.refreshToken = refreshToken;
        this.expiresOnSec = expiresOn;
        this.extExpiresOnSec = extExpiresOn;
    }
}

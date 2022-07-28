/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 */
export class AccessTokenValue {

    accessToken: string | null | undefined;
    idToken: string | undefined;
    expiresIn: string;
    homeAccountIdentifier: string | undefined;

    constructor(accessToken: string | null | undefined, idToken: string | undefined, expiresIn: string, homeAccountIdentifier: string | undefined) {
        this.accessToken = accessToken;
        this.idToken = idToken;
        this.expiresIn = expiresIn;
        this.homeAccountIdentifier = homeAccountIdentifier;
    }
}

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { UrlString } from "../url/UrlString";
import { ICrypto } from "../utils/crypto/ICrypto";

/**
 * @hidden
 */
export class AccessTokenKey {

    authority: string;
    clientId: string;
    scopes: string;
    homeAccountIdentifier: string;

    constructor(authority: string, clientId: string, scopes: string, uid: string, utid: string, crypto: ICrypto) {
        const authorityUri = new UrlString(authority);
        this.authority = authorityUri.getUrlString();
        this.clientId = clientId;
        this.scopes = scopes;
        this.homeAccountIdentifier = crypto.base64Encode(uid) + "." + crypto.base64Encode(utid);
    }
}

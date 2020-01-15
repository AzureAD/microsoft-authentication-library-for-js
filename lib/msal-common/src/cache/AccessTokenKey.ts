/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICrypto } from "../crypto/ICrypto";
import { UrlString } from "../url/UrlString";

/**
 * @hidden
 */
export class AccessTokenKey {

    authority: string;
    clientId: string;
    scopes: string;
    homeAccountIdentifier: string;

    constructor(authority: string, clientId: string, scopes: string, uid: string, utid: string, cryptoObj: ICrypto) {
        const authorityUri = new UrlString(authority);
        this.authority = authorityUri.urlString;
        this.clientId = clientId;
        this.scopes = scopes;
        this.homeAccountIdentifier = `${cryptoObj.base64Encode(uid)}.${cryptoObj.base64Encode(utid)}`;
    }
}

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CryptoUtils } from "../utils/CryptoUtils";
import { UrlUtils } from "../utils/UrlUtils";

/**
 * @hidden
 */
export class AccessTokenKey {

    authority: string | null;
    clientId: string;
    scopes: string | undefined;
    homeAccountIdentifier: string;

    constructor(authority: string, clientId: string, scopes: string | undefined, uid: string | undefined, utid: string | undefined) {
        this.authority = UrlUtils.CanonicalizeUri(authority);
        this.clientId = clientId;
        this.scopes = scopes;
        this.homeAccountIdentifier = CryptoUtils.base64Encode(uid!) + "." + CryptoUtils.base64Encode(utid!); // TODO bug: what if uid and utid are undefined?
    }
}

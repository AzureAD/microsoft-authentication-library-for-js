/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientAuthError } from "../error/ClientAuthError";
import { StringUtils } from "../utils/StringUtils";
import { ICrypto } from "../utils/crypto/ICrypto";

/**
 * @hidden
 */
export type ClientInfo = {
    uid: string,
    utid: string
};

/**
 * Function to build a client info object
 * @param rawClientInfo 
 * @param crypto 
 */
export function buildClientInfo(rawClientInfo: string, crypto: ICrypto): ClientInfo {
    if (!rawClientInfo || StringUtils.isEmpty(rawClientInfo)) {
        throw ClientAuthError.createClientInfoEmptyError(rawClientInfo);
    }

    try {
        const decodedClientInfo: string = crypto.base64Decode(rawClientInfo);
        return JSON.parse(decodedClientInfo) as ClientInfo;
    } catch (e) {
        throw ClientAuthError.createClientInfoDecodingError(e);
    }
}

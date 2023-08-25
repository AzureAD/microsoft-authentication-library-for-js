/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientAuthError } from "../error/ClientAuthError";
import { ICrypto } from "../crypto/ICrypto";
import { Separators, Constants } from "../utils/Constants";

/**
 * Client info object which consists of two IDs. Need to add more info here.
 */
export type ClientInfo = {
    uid: string;
    utid: string;
};

/**
 * Function to build a client info object from server clientInfo string
 * @param rawClientInfo
 * @param crypto
 */
export function buildClientInfo(
    rawClientInfo: string,
    crypto: ICrypto
): ClientInfo {
    if (!rawClientInfo) {
        throw ClientAuthError.createClientInfoEmptyError();
    }

    try {
        const decodedClientInfo: string = crypto.base64Decode(rawClientInfo);
        return JSON.parse(decodedClientInfo) as ClientInfo;
    } catch (e) {
        throw ClientAuthError.createClientInfoDecodingError(
            (e as ClientAuthError).message
        );
    }
}

/**
 * Function to build a client info object from cached homeAccountId string
 * @param homeAccountId
 */
export function buildClientInfoFromHomeAccountId(
    homeAccountId: string
): ClientInfo {
    if (!homeAccountId) {
        throw ClientAuthError.createClientInfoDecodingError(
            "Home account ID was empty."
        );
    }
    const clientInfoParts: string[] = homeAccountId.split(
        Separators.CLIENT_INFO_SEPARATOR,
        2
    );
    return {
        uid: clientInfoParts[0],
        utid:
            clientInfoParts.length < 2
                ? Constants.EMPTY_STRING
                : clientInfoParts[1],
    };
}

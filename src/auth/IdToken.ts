/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientAuthError } from "../error/ClientAuthError";
import { StringUtils } from "../utils/StringUtils";
import { ICrypto } from "../utils/crypto/ICrypto";
import { IdTokenClaims } from "./IdTokenClaims";

/**
 * @hidden
 */
export class IdToken {

    rawIdToken: string;
    claims: IdTokenClaims;
    constructor(rawIdToken: string, crypto: ICrypto) {
        if (StringUtils.isEmpty(rawIdToken)) {
            throw ClientAuthError.createIdTokenNullOrEmptyError(rawIdToken);
        }

        this.rawIdToken = rawIdToken;
        this.claims = IdToken.extractIdToken(rawIdToken, crypto) as IdTokenClaims;
    }

    /**
     * Extract IdToken by decoding the RAWIdToken
     *
     * @param encodedIdToken
     */
    static extractIdToken(encodedIdToken: string, crypto: ICrypto): any {
        // id token will be decoded to get the username
        const decodedToken = StringUtils.decodeJwt(encodedIdToken);
        if (!decodedToken) {
            return null;
        }
        try {
            const base64IdToken = decodedToken.JWSPayload;
            // base64Decode() should throw an error if there is an issue
            const base64Decoded = crypto.base64Decode(base64IdToken);
            return JSON.parse(base64Decoded);
        } catch (err) {
            throw ClientAuthError.createIdTokenExtractionError(err);
        }
    }
}

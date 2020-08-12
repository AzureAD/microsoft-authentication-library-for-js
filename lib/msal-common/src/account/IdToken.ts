/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { IdTokenClaims } from "./IdTokenClaims";
import { DecodedJwt } from "./DecodedJwt";
import { ClientAuthError } from "../error/ClientAuthError";
import { StringUtils } from "../utils/StringUtils";
import { ICrypto } from "../crypto/ICrypto";

/**
 * Id Token representation class. Parses id token string and generates claims object.
 */
export class IdToken {

    // Raw Id Token string
    rawIdToken: string;
    // Claims inside Id Token
    claims: IdTokenClaims;
    constructor(rawIdToken: string, crypto: ICrypto) {
        if (StringUtils.isEmpty(rawIdToken)) {
            throw ClientAuthError.createIdTokenNullOrEmptyError(rawIdToken);
        }

        this.rawIdToken = rawIdToken;
        this.claims = IdToken.extractIdToken(rawIdToken, crypto);
    }

    /**
     * Extract IdToken by decoding the RAWIdToken
     *
     * @param encodedIdToken
     */
    static extractIdToken(encodedIdToken: string, crypto: ICrypto): IdTokenClaims {
        // id token will be decoded to get the username
        const decodedToken: DecodedJwt = StringUtils.decodeJwt(encodedIdToken);
        if (!decodedToken) {
            return null;
        }
        try {
            const base64IdTokenPayload = decodedToken.JWSPayload;
            // base64Decode() should throw an error if there is an issue
            const base64Decoded = crypto.base64Decode(base64IdTokenPayload);
            return JSON.parse(base64Decoded) as IdTokenClaims;
        } catch (err) {
            throw ClientAuthError.createIdTokenParsingError(err);
        }
    }
}

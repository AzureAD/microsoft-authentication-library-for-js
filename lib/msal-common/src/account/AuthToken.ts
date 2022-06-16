/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TokenClaims } from "./TokenClaims";
import { DecodedAuthToken } from "./DecodedAuthToken";
import { ClientAuthError } from "../error/ClientAuthError";
import { StringUtils } from "../utils/StringUtils";
import { ICrypto } from "../crypto/ICrypto";

/**
 * JWT Token representation class. Parses token string and generates claims object.
 */
export class AuthToken {

    // Raw Token string
    rawToken: string;
    // Claims inside token
    claims: TokenClaims;
    constructor(rawToken: string, crypto: ICrypto) {
        if (StringUtils.isEmpty(rawToken)) {
            throw ClientAuthError.createTokenNullOrEmptyError(rawToken);
        }

        this.rawToken = rawToken;
        this.claims = AuthToken.extractTokenClaims(rawToken, crypto);
    }

    /**
     * Extract token by decoding the rawToken
     *
     * @param encodedToken
     */
    static extractTokenClaims(encodedToken: string, crypto: ICrypto): TokenClaims {

        const decodedToken: DecodedAuthToken = StringUtils.decodeAuthToken(encodedToken);

        // token will be decoded to get the username
        try {
            const base64TokenPayload = decodedToken.JWSPayload;

            // base64Decode() should throw an error if there is an issue
            const base64Decoded = crypto.base64Decode(base64TokenPayload);
            return JSON.parse(base64Decoded) as TokenClaims;
        } catch (err) {
            throw ClientAuthError.createTokenParsingError(err);
        }
    }
}

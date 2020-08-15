/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TokenClaims } from "./TokenClaims";
import { DecodedJwt } from "./DecodedJwt";
import { ClientAuthError } from "../error/ClientAuthError";
import { StringUtils } from "../utils/StringUtils";
import { ICrypto } from "../crypto/ICrypto";

/**
 * Id Token representation class. Parses id token string and generates claims object.
 */
export class JwtToken {

    // Raw Id Token string
    rawToken: string;
    // Claims inside Id Token
    claims: TokenClaims;
    constructor(rawToken: string, crypto: ICrypto) {
        if (StringUtils.isEmpty(rawToken)) {
            throw ClientAuthError.createTokenNullOrEmptyError(rawToken);
        }

        this.rawToken = rawToken;
        this.claims = JwtToken.extractTokenClaims(rawToken, crypto);
    }

    /**
     * Extract IdToken by decoding the RAWIdToken
     *
     * @param encodedIdToken
     */
    static extractTokenClaims(encodedIdToken: string, crypto: ICrypto): TokenClaims {
        // id token will be decoded to get the username
        const decodedToken: DecodedJwt = StringUtils.decodeJwt(encodedIdToken);
        if (!decodedToken) {
            return null;
        }
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

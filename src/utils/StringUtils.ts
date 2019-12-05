import { ClientAuthError } from "../error/ClientAuthError";

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 */
export class StringUtils {
    
    /**
     * decode a JWT
     *
     * @param jwtToken
     */
    static decodeJwt(jwtToken: string): any {
        if (StringUtils.isEmpty(jwtToken)) {
            throw ClientAuthError.createIdTokenNullOrEmptyError(jwtToken);
        }
        const idTokenPartsRegex = /^([^\.\s]*)\.([^\.\s]+)\.([^\.\s]*)$/;
        const matches = idTokenPartsRegex.exec(jwtToken);
        if (!matches || matches.length < 4) {
            throw ClientAuthError.createIdTokenParsingError(`Given token is malformed: ${jwtToken}`);
        }
        const crackedToken = {
            header: matches[1],
            JWSPayload: matches[2],
            JWSSig: matches[3]
        };
        return crackedToken;
    }

    /**
     * Check if a string is empty
     *
     * @param str
     */
    static isEmpty(str: string): boolean {
        return (typeof str === "undefined" || !str || 0 === str.length);
    }
}

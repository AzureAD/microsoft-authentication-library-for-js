/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ClientAuthError } from "../error/ClientAuthError";

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
     * Check if a string is empty.
     *
     * @param str
     */
    static isEmpty(str: string): boolean {
        return (typeof str === "undefined" || !str || 0 === str.length);
    }

    /**
     * Parses string into an object.
     *
     * @param query
     */
    static queryStringToObject(query: string): any {
        let match: Array<string>; // Regex for replacing addition symbol with a space
        const pl = /\+/g;
        const search = /([^&=]+)=([^&]*)/g;
        const decode = (s: string) => decodeURIComponent(s.replace(pl, " "));
        const obj: {} = {};
        match = search.exec(query);
        while (match) {
            obj[decode(match[1])] = decode(match[2]);
            match = search.exec(query);
        }
        return obj;
    }

    /**
     * Trims entries and converts them to lower case.
     *
     * @param arr
     */
    static trimAndConvertArrayEntriesToLowerCase(arr: Array<string>): Array<string> {
        return arr.map(entry => entry.trim().toLowerCase());
    }
}

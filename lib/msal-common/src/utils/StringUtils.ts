/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DecodedJwt } from "../account/DecodedJwt";
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
    static decodeJwt(jwtToken: string): DecodedJwt {
        if (StringUtils.isEmpty(jwtToken)) {
            throw ClientAuthError.createIdTokenNullOrEmptyError(jwtToken);
        }
        const idTokenPartsRegex = /^([^\.\s]*)\.([^\.\s]+)\.([^\.\s]*)$/;
        const matches = idTokenPartsRegex.exec(jwtToken);
        if (!matches || matches.length < 4) {
            throw ClientAuthError.createIdTokenParsingError(`Given token is malformed: ${JSON.stringify(jwtToken)}`);
        }
        const crackedToken: DecodedJwt = {
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

    static startsWith(str: string, search: string): boolean {
        return str.substring(0, search.length -1) === search;
    }

    /**
     * Parses string into an object.
     *
     * @param query
     */
    static queryStringToObject<T>(query: string): T {
        let match: Array<string>; // Regex for replacing addition symbol with a space
        const pl = /\+/g;
        const search = /([^&=]+)=([^&]*)/g;
        const decode = (s: string): string => decodeURIComponent(decodeURIComponent(s.replace(pl, " ")));
        const obj: {} = {};
        match = search.exec(query);
        while (match) {
            obj[decode(match[1])] = decode(match[2]);
            match = search.exec(query);
        }
        return obj as T;
    }

    /**
     * Trims entries and converts them to lower case.
     *
     * @param arr
     */
    static trimAndConvertArrayEntriesToLowerCase(arr: Array<string>): Array<string> {
        return arr.map(entry => entry.trim().toLowerCase());
    }

    /**
     * Removes empty strings from array
     * @param arr
     */
    static removeEmptyStringsFromArray(arr: Array<string>): Array<string> {
        return arr.filter(entry => {
            return !StringUtils.isEmpty(entry);
        });
    }
}

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
        return str.indexOf(search) === 0;
    }

    static endsWith(str: string, search: string): boolean {
        return (str.length >= search.length) && (str.lastIndexOf(search) === (str.length - search.length));
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
     * Trims entries in an array.
     *
     * @param arr
     */
    static trimArrayEntries(arr: Array<string>): Array<string> {
        return arr.map(entry => entry.trim());
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

    /**
     * Attempts to parse a string into JSON
     * @param str
     */
    static jsonParseHelper(str: string) {
        try {
            return JSON.parse(str);
        } catch (e) {
            return null;
        }
    }
}

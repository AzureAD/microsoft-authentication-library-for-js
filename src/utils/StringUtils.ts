/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DecodedAuthToken } from "../account/DecodedAuthToken";
import { ClientAuthError } from "../error/ClientAuthError";

/**
 * @hidden
 */
export class StringUtils {

    /**
     * decode a JWT
     *
     * @param authToken
     */
    static decodeAuthToken(authToken: string): DecodedAuthToken {
        if (StringUtils.isEmpty(authToken)) {
            throw ClientAuthError.createTokenNullOrEmptyError(authToken);
        }
        const tokenPartsRegex = /^([^\.\s]*)\.([^\.\s]+)\.([^\.\s]*)$/;
        const matches = tokenPartsRegex.exec(authToken);
        if (!matches || matches.length < 4) {
            throw ClientAuthError.createTokenParsingError(`Given token is malformed: ${JSON.stringify(authToken)}`);
        }
        const crackedToken: DecodedAuthToken = {
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
    static isEmpty(str?: string): boolean {
        return (typeof str === "undefined" || !str || 0 === str.length);
    }

    /**
     * Check if stringified object is empty
     * @param strObj 
     */
    static isEmptyObj(strObj?: string): boolean {
        if (strObj && !StringUtils.isEmpty(strObj)) {
            try {
                const obj = JSON.parse(strObj);
                return Object.keys(obj).length === 0;
            } catch (e) {}
        }
        return true;
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
        const obj: {} = {};
        const params = query.split("&");
        const decode = (s: string) => decodeURIComponent(s.replace(/\+/g, " "));
        params.forEach((pair) => {
            if (pair.trim()) {
                const [key, value] = pair.split(/=(.+)/g, 2); // Split on the first occurence of the '=' character
                if (key && value) {
                    obj[decode(key)] = decode(value);
                }
            }
        });
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
    static jsonParseHelper<T>(str: string): T | null {
        try {
            return JSON.parse(str) as T;
        } catch (e) {
            return null;
        }
    }

    /**
     * Tests if a given string matches a given pattern, with support for wildcards and queries.
     * @param pattern Wildcard pattern to string match. Supports "*" for wildcards and "?" for queries
     * @param input String to match against
     */
    static matchPattern(pattern: string, input: string): boolean {
        /**
         * Wildcard support: https://stackoverflow.com/a/3117248/4888559
         * Queries: replaces "?" in string with escaped "\?" for regex test
         */
        const regex: RegExp = new RegExp(pattern.replace(/\\/g, "\\\\").replace(/\*/g, "[^ ]*").replace(/\?/g, "\\\?")); // eslint-disable-line security/detect-non-literal-regexp

        return regex.test(input);
    }
}

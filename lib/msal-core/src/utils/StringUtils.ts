/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 */
export class StringUtils {
    /**
     * Check if a string is empty
     *
     * @param str
     */
    static isEmpty(str: string): boolean {
        return (typeof str === "undefined" || !str || 0 === str.length);
    }

    /**
     * toLower
     *
     * @param arr
     */
    static convertArrayEntriesToLowerCase(arr: Array<string>): Array<string> {
        return arr.map(entry => entry.toLowerCase());
    }
}
